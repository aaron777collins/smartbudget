// Import prisma from lib/prisma.ts which has proper configuration
const bcrypt = require('bcryptjs');

const DEFAULT_USERNAME = 'aaron7c';
const DEFAULT_PASSWORD = 'KingOfKings12345!';
const DEFAULT_EMAIL = 'aaron@smartbudget.app';
const DEFAULT_NAME = 'Aaron Collins';

async function main() {
  console.log('🌱 Starting user seed...');

  // Dynamic import to use the app's configured Prisma client
  const { prisma } = await import('../src/lib/prisma.ts');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USERNAME },
    });

    if (existingUser) {
      console.log(`ℹ️  User "${DEFAULT_USERNAME}" already exists, skipping...`);
      console.log('✅ User seed completed (no changes needed)');
      return;
    }

    // Hash password with bcrypt (cost factor 12)
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Create default user
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_USERNAME,
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        name: DEFAULT_NAME,
      },
    });

    console.log(`✅ Default user created successfully!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Username: ${DEFAULT_USERNAME}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('❌ Error creating default user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
