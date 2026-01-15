#!/bin/bash

# Seed script using docker exec to connect to PostgreSQL

DEFAULT_USERNAME="aaron7c"
DEFAULT_PASSWORD="KingOfKings12345!"
DEFAULT_EMAIL="aaron@smartbudget.app"
DEFAULT_NAME="Aaron Collins"

echo "🌱 Starting user seed..."

# Hash password using node and bcryptjs
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$DEFAULT_PASSWORD', 12).then(hash => console.log(hash))")

echo "🔐 Password hashed"
echo "📝 Creating user in database..."

# Execute SQL in the database
docker exec aiceo-postgres psql -U postgres -d smartbudget -c "
  INSERT INTO \"User\" (id, username, email, password, name, \"createdAt\", \"updatedAt\")
  VALUES (gen_random_uuid(), '$DEFAULT_USERNAME', '$DEFAULT_EMAIL', '$HASHED_PASSWORD', '$DEFAULT_NAME', NOW(), NOW())
  ON CONFLICT (username) DO NOTHING
  RETURNING id, username, email, name;
" 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ User seed completed successfully!"
  echo "🔑 Login credentials:"
  echo "   Username: $DEFAULT_USERNAME"
  echo "   Password: $DEFAULT_PASSWORD"
else
  echo "❌ Failed to seed user"
  exit 1
fi
