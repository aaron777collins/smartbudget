const { PrismaClient } = require('@prisma/client');

console.log('Testing Prisma Client initialization...');

try {
  const prisma = new PrismaClient({
    log: ['error'],
  });
  console.log('✅ Prisma Client initialized successfully');
  prisma.$disconnect();
} catch (error) {
  console.error('❌ Prisma Client initialization failed:', error.message);
  process.exit(1);
}
