const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Plaid Personal Finance Categories v2 (PFCv2) Taxonomy
const CATEGORIES = [
  {
    name: 'Income',
    slug: 'income',
    icon: 'dollar-sign',
    color: '#10B981',
    description: 'All sources of income including wages, dividends, and other earnings',
    subcategories: [
      { name: 'Wages', slug: 'income-wages' },
      { name: 'Dividends', slug: 'income-dividends' },
      { name: 'Interest Earned', slug: 'income-interest' },
      { name: 'Tax Refunds', slug: 'income-tax-refunds' },
      { name: 'Unemployment', slug: 'income-unemployment' },
      { name: 'Retirement Pension', slug: 'income-retirement' },
      { name: 'Child Support', slug: 'income-child-support' },
      { name: 'Other Income', slug: 'income-other' },
    ],
  },
  {
    name: 'Transfer In',
    slug: 'transfer-in',
    icon: 'arrow-down-circle',
    color: '#14B8A6',
    description: 'Money transferred into accounts',
    subcategories: [
      { name: 'Deposit', slug: 'transfer-in-deposit' },
      { name: 'Investment Transfer', slug: 'transfer-in-investment' },
      { name: 'Savings Transfer', slug: 'transfer-in-savings' },
      { name: 'Wire Transfer', slug: 'transfer-in-wire' },
      { name: 'Other Transfer In', slug: 'transfer-in-other' },
    ],
  },
  {
    name: 'Transfer Out',
    slug: 'transfer-out',
    icon: 'arrow-up-circle',
    color: '#F59E0B',
    description: 'Money transferred out of accounts',
    subcategories: [
      { name: 'Withdrawal', slug: 'transfer-out-withdrawal' },
      { name: 'Investment Transfer', slug: 'transfer-out-investment' },
      { name: 'Savings Transfer', slug: 'transfer-out-savings' },
      { name: 'Cash Advance', slug: 'transfer-out-cash-advance' },
      { name: 'Wire Transfer', slug: 'transfer-out-wire' },
      { name: 'Other Transfer Out', slug: 'transfer-out-other' },
    ],
  },
  {
    name: 'Loan Payments',
    slug: 'loan-payments',
    icon: 'receipt',
    color: '#EF4444',
    description: 'Payments toward loans and credit obligations',
    subcategories: [
      { name: 'Car Payment', slug: 'loan-car' },
      { name: 'Credit Card Payment', slug: 'loan-credit-card' },
      { name: 'Mortgage Payment', slug: 'loan-mortgage' },
      { name: 'Student Loan', slug: 'loan-student' },
      { name: 'Personal Loan', slug: 'loan-personal' },
      { name: 'Other Loan Payment', slug: 'loan-other' },
    ],
  },
  {
    name: 'Bank Fees',
    slug: 'bank-fees',
    icon: 'alert-circle',
    color: '#DC2626',
    description: 'Banking and financial service fees',
    subcategories: [
      { name: 'ATM Fees', slug: 'bank-fees-atm' },
      { name: 'Foreign Transaction Fee', slug: 'bank-fees-foreign' },
      { name: 'Insufficient Funds', slug: 'bank-fees-nsf' },
      { name: 'Overdraft Fee', slug: 'bank-fees-overdraft' },
      { name: 'Interest Charges', slug: 'bank-fees-interest' },
      { name: 'Monthly Service Fee', slug: 'bank-fees-monthly' },
      { name: 'Late Payment Fee', slug: 'bank-fees-late' },
      { name: 'Other Bank Fees', slug: 'bank-fees-other' },
    ],
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    icon: 'music',
    color: '#EC4899',
    description: 'Entertainment, recreation, and leisure activities',
    subcategories: [
      { name: 'Gambling', slug: 'entertainment-gambling' },
      { name: 'Music & Audio', slug: 'entertainment-music' },
      { name: 'Sporting Events', slug: 'entertainment-sports' },
      { name: 'Museums & Attractions', slug: 'entertainment-museums' },
      { name: 'Movies & Theaters', slug: 'entertainment-movies' },
      { name: 'Video Games', slug: 'entertainment-games' },
      { name: 'Concerts & Shows', slug: 'entertainment-concerts' },
      { name: 'Hobbies', slug: 'entertainment-hobbies' },
      { name: 'Other Entertainment', slug: 'entertainment-other' },
    ],
  },
  {
    name: 'Food & Drink',
    slug: 'food-and-drink',
    icon: 'utensils',
    color: '#F59E0B',
    description: 'All food and beverage purchases',
    subcategories: [
      { name: 'Groceries', slug: 'food-groceries' },
      { name: 'Restaurants', slug: 'food-restaurants' },
      { name: 'Fast Food', slug: 'food-fast-food' },
      { name: 'Coffee Shops', slug: 'food-coffee' },
      { name: 'Bars & Alcohol', slug: 'food-alcohol' },
      { name: 'Vending Machines', slug: 'food-vending' },
      { name: 'Food Delivery', slug: 'food-delivery' },
      { name: 'Other Food & Drink', slug: 'food-other' },
    ],
  },
  {
    name: 'General Merchandise',
    slug: 'general-merchandise',
    icon: 'shopping-bag',
    color: '#8B5CF6',
    description: 'General shopping and merchandise purchases',
    subcategories: [
      { name: 'Clothing', slug: 'merchandise-clothing' },
      { name: 'Electronics', slug: 'merchandise-electronics' },
      { name: 'Books & Music', slug: 'merchandise-books' },
      { name: 'Department Stores', slug: 'merchandise-department' },
      { name: 'Online Marketplaces', slug: 'merchandise-online' },
      { name: 'Pet Supplies', slug: 'merchandise-pets' },
      { name: 'Sporting Goods', slug: 'merchandise-sporting-goods' },
      { name: 'Toys & Games', slug: 'merchandise-toys' },
      { name: 'Office Supplies', slug: 'merchandise-office' },
      { name: 'Other Merchandise', slug: 'merchandise-other' },
    ],
  },
  {
    name: 'Home Improvement',
    slug: 'home-improvement',
    icon: 'home',
    color: '#FB923C',
    description: 'Home improvement, furniture, and maintenance',
    subcategories: [
      { name: 'Furniture', slug: 'home-furniture' },
      { name: 'Hardware & Building Materials', slug: 'home-hardware' },
      { name: 'Repair & Maintenance', slug: 'home-repair' },
      { name: 'Security Systems', slug: 'home-security' },
      { name: 'Lawn & Garden', slug: 'home-garden' },
      { name: 'Home Decor', slug: 'home-decor' },
      { name: 'Appliances', slug: 'home-appliances' },
      { name: 'Other Home Improvement', slug: 'home-other' },
    ],
  },
  {
    name: 'Medical',
    slug: 'medical',
    icon: 'heart-pulse',
    color: '#F43F5E',
    description: 'Healthcare and medical expenses',
    subcategories: [
      { name: 'Dental Care', slug: 'medical-dental' },
      { name: 'Eye Care', slug: 'medical-eye' },
      { name: 'Nursing Care', slug: 'medical-nursing' },
      { name: 'Pharmacies', slug: 'medical-pharmacy' },
      { name: 'Primary Care', slug: 'medical-primary' },
      { name: 'Specialists', slug: 'medical-specialists' },
      { name: 'Veterinary Services', slug: 'medical-veterinary' },
      { name: 'Medical Supplies', slug: 'medical-supplies' },
      { name: 'Other Medical', slug: 'medical-other' },
    ],
  },
  {
    name: 'Personal Care',
    slug: 'personal-care',
    icon: 'sparkles',
    color: '#A78BFA',
    description: 'Personal care and wellness services',
    subcategories: [
      { name: 'Gyms & Fitness', slug: 'personal-gym' },
      { name: 'Hair & Beauty', slug: 'personal-hair' },
      { name: 'Laundry & Dry Cleaning', slug: 'personal-laundry' },
      { name: 'Spa & Massage', slug: 'personal-spa' },
      { name: 'Other Personal Care', slug: 'personal-other' },
    ],
  },
  {
    name: 'General Services',
    slug: 'general-services',
    icon: 'briefcase',
    color: '#6366F1',
    description: 'Professional and general services',
    subcategories: [
      { name: 'Accounting & Tax Preparation', slug: 'services-accounting' },
      { name: 'Automotive Services', slug: 'services-automotive' },
      { name: 'Childcare', slug: 'services-childcare' },
      { name: 'Consulting & Legal', slug: 'services-consulting' },
      { name: 'Education', slug: 'services-education' },
      { name: 'Insurance', slug: 'services-insurance' },
      { name: 'Postage & Shipping', slug: 'services-postage' },
      { name: 'Storage', slug: 'services-storage' },
      { name: 'Subscriptions', slug: 'services-subscriptions' },
      { name: 'Other Services', slug: 'services-other' },
    ],
  },
  {
    name: 'Government & Non-Profit',
    slug: 'government-and-non-profit',
    icon: 'landmark',
    color: '#3B82F6',
    description: 'Government fees, taxes, and charitable donations',
    subcategories: [
      { name: 'Donations & Charities', slug: 'government-donations' },
      { name: 'Government Agencies', slug: 'government-agencies' },
      { name: 'Tax Payments', slug: 'government-taxes' },
      { name: 'Court Fees & Fines', slug: 'government-fines' },
      { name: 'Other Government', slug: 'government-other' },
    ],
  },
  {
    name: 'Transportation',
    slug: 'transportation',
    icon: 'car',
    color: '#6366F1',
    description: 'All transportation and vehicle expenses',
    subcategories: [
      { name: 'Gas & Fuel', slug: 'transportation-gas' },
      { name: 'Parking', slug: 'transportation-parking' },
      { name: 'Public Transit', slug: 'transportation-public' },
      { name: 'Taxis & Ride-Shares', slug: 'transportation-taxi' },
      { name: 'Tolls', slug: 'transportation-tolls' },
      { name: 'Bike & Scooter Rentals', slug: 'transportation-bike' },
      { name: 'Vehicle Maintenance', slug: 'transportation-maintenance' },
      { name: 'Auto Insurance', slug: 'transportation-insurance' },
      { name: 'Other Transportation', slug: 'transportation-other' },
    ],
  },
  {
    name: 'Travel',
    slug: 'travel',
    icon: 'plane',
    color: '#0EA5E9',
    description: 'Travel and vacation expenses',
    subcategories: [
      { name: 'Flights', slug: 'travel-flights' },
      { name: 'Lodging', slug: 'travel-lodging' },
      { name: 'Rental Cars', slug: 'travel-rental-cars' },
      { name: 'Travel Activities', slug: 'travel-activities' },
      { name: 'Travel Insurance', slug: 'travel-insurance' },
      { name: 'Other Travel', slug: 'travel-other' },
    ],
  },
  {
    name: 'Rent & Utilities',
    slug: 'rent-and-utilities',
    icon: 'zap',
    color: '#EF4444',
    description: 'Housing costs and utility bills',
    subcategories: [
      { name: 'Rent', slug: 'utilities-rent' },
      { name: 'Electricity & Gas', slug: 'utilities-electricity' },
      { name: 'Internet & Cable', slug: 'utilities-internet' },
      { name: 'Telephone', slug: 'utilities-phone' },
      { name: 'Water', slug: 'utilities-water' },
      { name: 'Sewage & Waste Management', slug: 'utilities-sewage' },
      { name: 'HOA Fees', slug: 'utilities-hoa' },
      { name: 'Other Utilities', slug: 'utilities-other' },
    ],
  },
];

async function main() {
  const TOTAL_CATEGORIES = CATEGORIES.length;
  const TOTAL_SUBCATEGORIES = CATEGORIES.reduce(
    (sum, cat) => sum + cat.subcategories.length,
    0
  );

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
            userId: null,
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
          console.error(`❌ Error creating subcategory "${subcategoryData.name}":`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating category "${categoryData.name}":`, error.message);
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
