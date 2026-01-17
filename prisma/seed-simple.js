const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

const DEFAULT_USERNAME = 'aaron7c';
const DEFAULT_PASSWORD = 'KingOfKings12345!';
const DEFAULT_EMAIL = 'aaron@smartbudget.app';
const DEFAULT_NAME = 'Aaron Collins';

async function main() {
  console.log('🌱 Starting user seed...');

  try {
    // Hash password with bcrypt (cost factor 12)
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Create SQL to insert user
    const sql = `
      INSERT INTO "User" (id, username, email, password, name, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), '${DEFAULT_USERNAME}', '${DEFAULT_EMAIL}', '${hashedPassword}', '${DEFAULT_NAME}', NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, email, name;
    `;

    console.log('📝 Executing SQL...');

    // Use psql to execute the query
    const result = execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -d smartbudget -c "${sql.replace(/\n/g, ' ')}"`,
      { encoding: 'utf-8' }
    );

    if (result.includes('0 rows')) {
      console.log(`ℹ️  User "${DEFAULT_USERNAME}" already exists, skipping...`);
      console.log('✅ User seed completed (no changes needed)');
    } else {
      console.log('✅ Default user created successfully!');
      console.log(result);
      console.log('');
      console.log('🔑 Login credentials:');
      console.log(`   Username: ${DEFAULT_USERNAME}`);
      console.log(`   Password: ${DEFAULT_PASSWORD}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
