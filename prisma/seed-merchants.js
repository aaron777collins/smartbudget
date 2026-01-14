/**
 * Merchant Knowledge Base Seed Script
 *
 * Seeds the MerchantKnowledge table with common Canadian merchants
 * Part of Task 3.3: Merchant Normalization Pipeline
 *
 * Usage: node prisma/seed-merchants.js
 */

const { PrismaClient } = require('@prisma/client');
const { merchantKnowledgeData } = require('./merchant-knowledge-data.ts');

const prisma = new PrismaClient();

async function main() {
  console.log('🛒 Seeding Merchant Knowledge Base...\n');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const merchant of merchantKnowledgeData) {
    try {
      // Find category by slug
      const category = await prisma.category.findUnique({
        where: { slug: merchant.categorySlug },
      });

      if (!category) {
        console.log(`⚠️  Category not found: ${merchant.categorySlug} (skipping ${merchant.merchantName})`);
        skippedCount++;
        continue;
      }

      // Check if merchant already exists
      const existing = await prisma.merchantKnowledge.findUnique({
        where: { merchantName: merchant.merchantName },
      });

      if (existing) {
        console.log(`⏭️  Already exists: ${merchant.merchantName}`);
        skippedCount++;
        continue;
      }

      // Create merchant knowledge entry
      await prisma.merchantKnowledge.create({
        data: {
          merchantName: merchant.merchantName,
          normalizedName: merchant.normalizedName,
          categoryId: category.id,
          confidenceScore: merchant.confidenceScore,
          source: merchant.source,
          metadata: merchant.metadata || {},
        },
      });

      console.log(`✅ Created: ${merchant.merchantName} → ${merchant.normalizedName} (${merchant.categorySlug})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating merchant ${merchant.merchantName}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Merchant Knowledge Base Seeding Summary:');
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors:  ${errorCount}`);
  console.log(`   📦 Total:   ${merchantKnowledgeData.length}`);
  console.log('\n✨ Merchant knowledge base seeding complete!\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
