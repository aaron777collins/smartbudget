const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createUser() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/smartbudget?schema=public'
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    const hash = await bcrypt.hash('KingOfKings12345!', 12);
    console.log('🔐 Password hashed');

    const result = await client.query(
      `INSERT INTO "User" (id, username, email, name, password, "createdAt", "updatedAt", "failedLoginAttempts")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), 0)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
       RETURNING id, username, email, name`,
      ['aaron7c', 'aaron@smartbudget.app', 'Aaron Collins', hash]
    );

    if (result.rows.length > 0) {
      console.log('✅ User created/updated successfully:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('');
      console.log('🔑 Login credentials:');
      console.log('   Username: aaron7c');
      console.log('   Password: KingOfKings12345!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createUser();
