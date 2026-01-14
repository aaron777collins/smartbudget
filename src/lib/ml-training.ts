/**
 * ML Training Pipeline
 *
 * Learns from user corrections to improve categorization accuracy over time.
 * Uses weakly supervised learning approach:
 * 1. Collect user corrections (userCorrected=true transactions)
 * 2. Add to merchant knowledge base
 * 3. Retrain model (reload training data with new examples)
 * 4. Improve future categorization accuracy
 */

import { prisma } from './prisma';
import { clearMLCache } from './ml-categorizer';

/**
 * Training statistics
 */
export interface TrainingStats {
  userCorrectionsCount: number;
  newExamplesAdded: number;
  knowledgeBaseSize: number;
  categoriesUpdated: string[];
  trainingDate: Date;
}

/**
 * Process user corrections and add to knowledge base
 *
 * Algorithm:
 * 1. Find all transactions where userCorrected=true
 * 2. For each, check if merchant is in knowledge base
 * 3. If not, add with high confidence (0.95 - user confirmed)
 * 4. If exists but different category, update if user correction is more recent
 * 5. Track statistics
 */
export async function trainFromUserCorrections(
  userId?: string
): Promise<TrainingStats> {
  console.log('Starting training from user corrections...');

  // Find all user-corrected transactions
  const userCorrections = await prisma.transaction.findMany({
    where: {
      userCorrected: true,
      categoryId: { not: null },
      ...(userId ? { userId } : {})
    },
    select: {
      id: true,
      merchantName: true,
      description: true,
      amount: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      },
      subcategoryId: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  console.log(`Found ${userCorrections.length} user corrections`);

  if (userCorrections.length === 0) {
    return {
      userCorrectionsCount: 0,
      newExamplesAdded: 0,
      knowledgeBaseSize: await getMerchantKnowledgeBaseSize(),
      categoriesUpdated: [],
      trainingDate: new Date()
    };
  }

  // Group corrections by merchant (use most recent correction for each)
  const merchantCorrections = new Map<string, typeof userCorrections[0]>();
  for (const correction of userCorrections) {
    const key = correction.merchantName.toLowerCase().trim();
    if (!merchantCorrections.has(key)) {
      merchantCorrections.set(key, correction);
    }
  }

  console.log(`Processing ${merchantCorrections.size} unique merchants`);

  const categoriesUpdated = new Set<string>();
  let newExamplesAdded = 0;

  // Process each merchant correction
  for (const [merchantKey, correction] of merchantCorrections) {
    try {
      // Check if merchant exists in knowledge base
      const existing = await prisma.merchantKnowledge.findUnique({
        where: { merchantName: correction.merchantName }
      });

      if (!existing) {
        // Add new merchant to knowledge base
        await prisma.merchantKnowledge.create({
          data: {
            merchantName: correction.merchantName,
            normalizedName: correction.merchantName,
            categoryId: correction.categoryId!,
            confidenceScore: 0.95, // High confidence - user confirmed
            source: 'user_correction',
            metadata: {
              description: `User-corrected categorization`,
              correctedAt: correction.updatedAt.toISOString(),
              categoryName: correction.category?.name
            }
          }
        });

        newExamplesAdded++;
        categoriesUpdated.add(correction.category?.slug || 'unknown');

        console.log(`Added merchant: ${correction.merchantName} → ${correction.category?.name}`);
      } else {
        // Update if category changed and user correction is more recent
        if (existing.categoryId !== correction.categoryId) {
          const existingUpdatedAt = existing.updatedAt || existing.createdAt;

          if (correction.updatedAt > existingUpdatedAt) {
            await prisma.merchantKnowledge.update({
              where: { id: existing.id },
              data: {
                categoryId: correction.categoryId!,
                confidenceScore: 0.95,
                source: 'user_correction',
                metadata: {
                  ...(typeof existing.metadata === 'object' ? existing.metadata : {}),
                  description: `User-corrected categorization`,
                  previousCategory: existing.categoryId,
                  correctedAt: correction.updatedAt.toISOString(),
                  categoryName: correction.category?.name
                },
                updatedAt: new Date()
              }
            });

            categoriesUpdated.add(correction.category?.slug || 'unknown');
            console.log(`Updated merchant: ${correction.merchantName} → ${correction.category?.name}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing merchant ${correction.merchantName}:`, error);
    }
  }

  // Clear ML cache to force reload of training data
  clearMLCache();

  const stats: TrainingStats = {
    userCorrectionsCount: userCorrections.length,
    newExamplesAdded,
    knowledgeBaseSize: await getMerchantKnowledgeBaseSize(),
    categoriesUpdated: Array.from(categoriesUpdated),
    trainingDate: new Date()
  };

  console.log('Training complete:', stats);
  return stats;
}

/**
 * Get size of merchant knowledge base
 */
async function getMerchantKnowledgeBaseSize(): Promise<number> {
  return prisma.merchantKnowledge.count();
}

/**
 * Scheduled training job (can be called by cron/background worker)
 * Retrains model periodically (e.g., daily or weekly)
 */
export async function scheduledTraining(): Promise<TrainingStats> {
  console.log('Running scheduled training...');
  return trainFromUserCorrections();
}

/**
 * Get training statistics without running training
 */
export async function getTrainingStats() {
  const userCorrectionsCount = await prisma.transaction.count({
    where: {
      userCorrected: true,
      categoryId: { not: { equals: null } }
    }
  });

  const knowledgeBaseSize = await getMerchantKnowledgeBaseSize();

  // Get category distribution in knowledge base
  const categoryDistribution = await prisma.merchantKnowledge.groupBy({
    by: ['categoryId'],
    _count: true
  });

  // Get source distribution
  const sourceDistribution = await prisma.merchantKnowledge.groupBy({
    by: ['source'],
    _count: true
  });

  return {
    userCorrectionsCount,
    knowledgeBaseSize,
    categoryDistribution: categoryDistribution.map(cd => ({
      categoryId: cd.categoryId,
      count: cd._count
    })),
    sourceDistribution: sourceDistribution.map(sd => ({
      source: sd.source,
      count: sd._count
    }))
  };
}

/**
 * Reset user correction flags after training
 * (Optional - keeps database clean, but loses history)
 */
export async function resetUserCorrectionFlags() {
  const result = await prisma.transaction.updateMany({
    where: {
      userCorrected: true
    },
    data: {
      userCorrected: false
    }
  });

  console.log(`Reset ${result.count} user correction flags`);
  return result.count;
}
