const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartbudget?schema=public';

const DEFAULT_USERNAME = 'aaron7c';
const DEFAULT_PASSWORD = 'KingOfKings12345!';
const DEFAULT_EMAIL = 'aaron@smartbudget.app';
const DEFAULT_NAME = 'Aaron Collins';

async function main() {
  console.log('🌱 Starting user seed (direct PostgreSQL)...');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user exists
    const checkResult = await client.query(
      'SELECT * FROM "User" WHERE username = $1',
      [DEFAULT_USERNAME]
    );

    if (checkResult.rows.length > 0) {
      console.log(`ℹ️  User "${DEFAULT_USERNAME}" already exists, skipping...`);
      console.log('✅ User seed completed (no changes needed)');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Insert user
    const insertResult = await client.query(
      `INSERT INTO "User" (id, username, email, password, name, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, username, email, name`,
      [DEFAULT_USERNAME, DEFAULT_EMAIL, hashedPassword, DEFAULT_NAME]
    );

    const user = insertResult.rows[0];
    console.log('✅ Default user created successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Username: ${DEFAULT_USERNAME}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
