/**
 * Merchant Research API Endpoint
 *
 * Uses Claude AI to research unknown merchants and suggest categories.
 * Saves successful results to the merchant knowledge base.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { researchMerchant, researchMerchantsBatch } from '@/lib/merchant-researcher';
import { prisma } from '@/lib/prisma';
import { createJob, JobType } from '@/lib/job-queue';

/**
 * POST /api/merchants/research
 *
 * Research a single merchant or batch of merchants
 *
 * Body:
 * - merchantName: string (for single)
 * - amount?: number (optional)
 * - date?: string (optional, ISO format)
 * - merchants?: Array<{merchantName, amount?, date?}> (for batch)
 * - saveToKnowledgeBase?: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Anthropic API key not configured',
          message: 'Please set ANTHROPIC_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    // Define type for merchant input
    interface MerchantInput {
      merchantName: string;
      amount?: number;
      date?: string;
    }

    // Batch research
    if (body.merchants && Array.isArray(body.merchants)) {
      const merchants = body.merchants.map((m: MerchantInput) => ({
        merchantName: m.merchantName,
        amount: m.amount,
        date: m.date,
      }));

      // For large batches (>10 merchants), use background job queue
      const useBackgroundJob = body.background === true || merchants.length > 10;

      if (useBackgroundJob) {
        // Create background job
        const job = await createJob({
          userId: session.user.id,
          type: JobType.MERCHANT_RESEARCH_BATCH,
          payload: {
            merchants: merchants,
            saveToKnowledgeBase: body.saveToKnowledgeBase !== false,
          },
          total: merchants.length,
        });

        // Trigger processing asynchronously (don't wait)
        fetch(`${request.nextUrl.origin}/api/jobs/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => console.error('Failed to trigger job processing:', err));

        return NextResponse.json({
          success: true,
          background: true,
          jobId: job.id,
          message: `Background job created for ${merchants.length} merchants`,
        });
      }

      // For small batches, process immediately
      const results = await researchMerchantsBatch(
        merchants.map((m: MerchantInput) => ({
          merchantName: m.merchantName,
          amount: m.amount,
          date: m.date ? new Date(m.date) : undefined,
        }))
      );

      // Save successful results to knowledge base if requested
      if (body.saveToKnowledgeBase !== false) {
        await saveBatchToKnowledgeBase(results);
      }

      return NextResponse.json({
        success: true,
        results,
        count: results.length,
      });
    }

    // Single merchant research
    const { merchantName, amount, date, saveToKnowledgeBase = true } = body;

    if (!merchantName) {
      return NextResponse.json(
        { error: 'merchantName is required' },
        { status: 400 }
      );
    }

    const result = await researchMerchant(
      merchantName,
      amount,
      date ? new Date(date) : undefined
    );

    // Save to knowledge base if successful and requested
    if (saveToKnowledgeBase && result.categorySlug && result.confidence >= 0.7) {
      await saveToKnowledgeBase(result);
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Merchant research API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to research merchant',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Save research result to merchant knowledge base
 */
async function saveToKnowledgeBase(
  result: Awaited<ReturnType<typeof researchMerchant>>
): Promise<void> {
  if (!result.categorySlug) {
    return;
  }

  try {
    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { slug: result.categorySlug },
    });

    if (!category) {
      console.warn(`Category not found for slug: ${result.categorySlug}`);
      return;
    }

    // Create or update merchant knowledge entry
    await prisma.merchantKnowledge.upsert({
      where: { merchantName: result.merchantName },
      create: {
        merchantName: result.merchantName,
        normalizedName: result.businessName || result.merchantName,
        categoryId: category.id,
        confidenceScore: result.confidence,
        source: 'claude_ai',
        metadata: {
          businessType: result.businessType,
          reasoning: result.reasoning,
          sources: result.sources,
          website: result.website,
          location: result.location,
          researchedAt: new Date().toISOString(),
        },
      },
      update: {
        normalizedName: result.businessName || result.merchantName,
        categoryId: category.id,
        confidenceScore: result.confidence,
        source: 'claude_ai',
        metadata: {
          businessType: result.businessType,
          reasoning: result.reasoning,
          sources: result.sources,
          website: result.website,
          location: result.location,
          researchedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    console.log(`Saved merchant research to knowledge base: ${result.merchantName}`);
  } catch (error) {
    console.error('Failed to save to knowledge base:', error);
    // Don't throw - research was still successful
  }
}

/**
 * Save batch results to knowledge base
 */
async function saveBatchToKnowledgeBase(
  results: Awaited<ReturnType<typeof researchMerchantsBatch>>
): Promise<void> {
  // Filter successful results (confidence >= 0.7)
  const successfulResults = results.filter(
    (r) => r.categorySlug && r.confidence >= 0.7
  );

  // Save each result
  for (const result of successfulResults) {
    await saveToKnowledgeBase(result);
  }

  console.log(
    `Saved ${successfulResults.length}/${results.length} merchant research results to knowledge base`
  );
}
