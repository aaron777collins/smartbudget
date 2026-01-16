#!/usr/bin/env node
/**
 * Data migration script to populate username field from email
 * This is needed because we're transitioning from email-based to username-based auth
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

// Create a direct connection using pg Pool
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

// Create PrismaClient with the pg adapter
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Checking for users without usernames...');

  // Find all users without usernames
  const usersWithoutUsername = await prisma.user.findMany({
    where: {
      username: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  console.log(`📊 Found ${usersWithoutUsername.length} users without usernames`);

  if (usersWithoutUsername.length === 0) {
    console.log('✅ All users already have usernames!');
    return;
  }

  // Update each user with a username derived from their email
  for (const user of usersWithoutUsername) {
    // Generate username from email (part before @)
    let username = user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`;

    // Ensure username is unique by checking if it exists
    let usernameExists = await prisma.user.findUnique({
      where: { username },
    });

    let counter = 1;
    const baseUsername = username;
    while (usernameExists) {
      username = `${baseUsername}${counter}`;
      usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      counter++;
    }

    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    console.log(`✓ Updated user ${user.id}: ${user.email || 'no-email'} → ${username}`);
  }

  console.log('✅ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
