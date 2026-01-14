import { PrismaClient } from '@prisma/client';
import { CATEGORIES, TOTAL_CATEGORIES, TOTAL_SUBCATEGORIES } from './categories-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  console.log(`📦 Seeding ${TOTAL_CATEGORIES} categories and ${TOTAL_SUBCATEGORIES} subcategories...`);

  let categoriesCreated = 0;
  let subcategoriesCreated = 0;
  let categoriesSkipped = 0;
  let subcategoriesSkipped = 0;

  for (const categoryData of CATEGORIES) {
    try {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug },
      });

      let category;
      if (existingCategory) {
        console.log(`⏭️  Category "${categoryData.name}" already exists, skipping...`);
        category = existingCategory;
        categoriesSkipped++;
      } else {
        // Create category
        category = await prisma.category.create({
          data: {
            name: categoryData.name,
            slug: categoryData.slug,
            icon: categoryData.icon,
            color: categoryData.color,
            description: categoryData.description,
            isSystemCategory: true,
            userId: null, // System categories are not user-specific
          },
        });
        console.log(`✅ Created category: ${categoryData.name}`);
        categoriesCreated++;
      }

      // Create subcategories
      for (const subcategoryData of categoryData.subcategories) {
        try {
          // Check if subcategory already exists
          const existingSubcategory = await prisma.subcategory.findUnique({
            where: { slug: subcategoryData.slug },
          });

          if (existingSubcategory) {
            subcategoriesSkipped++;
          } else {
            await prisma.subcategory.create({
              data: {
                categoryId: category.id,
                name: subcategoryData.name,
                slug: subcategoryData.slug,
                icon: subcategoryData.icon || null,
              },
            });
            subcategoriesCreated++;
          }
        } catch (error) {
          console.error(`❌ Error creating subcategory "${subcategoryData.name}":`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating category "${categoryData.name}":`, error);
    }
  }

  console.log('\n✨ Seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`  - Categories created: ${categoriesCreated}`);
  console.log(`  - Categories skipped (already exist): ${categoriesSkipped}`);
  console.log(`  - Subcategories created: ${subcategoriesCreated}`);
  console.log(`  - Subcategories skipped (already exist): ${subcategoriesSkipped}`);
  console.log(`  - Total categories in database: ${categoriesCreated + categoriesSkipped}`);
  console.log(`  - Total subcategories in database: ${subcategoriesCreated + subcategoriesSkipped}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
