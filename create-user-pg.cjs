const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/smartbudget'
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user exists
    const checkResult = await client.query(
      'SELECT id, username FROM "User" WHERE username = $1',
      ['aaron7c']
    );

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  User aaron7c already exists!');
      console.log(`   ID: ${checkResult.rows[0].id}`);
      console.log(`   Username: ${checkResult.rows[0].username}`);
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('KingOfKings12345!', 12);

    // Generate ID (simple version)
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Insert user
    const insertResult = await client.query(
      `INSERT INTO "User" (id, username, email, password, name, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, username, email, name`,
      [userId, 'aaron7c', 'aaron@smartbudget.app', hashedPassword, 'Aaron Collins']
    );

    const user = insertResult.rows[0];
    console.log('');
    console.log('✅ Default user created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Username: aaron7c');
    console.log('   Password: KingOfKings12345!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
