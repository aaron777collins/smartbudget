#!/bin/bash
# Database Credential Rotation Script for SmartBudget
# This script assists with rotating database credentials
#
# SECURITY NOTICE:
# - Run this script in a secure environment
# - Never log or echo passwords
# - Rotate credentials every 90 days (recommended)
# - Rotate immediately after security incidents or team departures
#
# Usage: ./scripts/rotate-db-credentials.sh [environment]
# Example: ./scripts/rotate-db-credentials.sh production

set -e  # Exit on error

ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "SmartBudget Credential Rotation"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate new password
echo "Step 1: Generating new secure password..."
NEW_PASSWORD=$(openssl rand -base64 32)
echo -e "${GREEN}✓${NC} Password generated (32 characters)"
echo ""

# Step 2: Display instructions for database update
echo "Step 2: Update database user password"
echo "--------------------------------------"
echo "Connect to your PostgreSQL database and run:"
echo ""
echo -e "${YELLOW}ALTER USER your_db_user WITH PASSWORD '${NEW_PASSWORD}';${NC}"
echo ""
echo "Replace 'your_db_user' with your actual database username."
echo ""
read -p "Press Enter after you've updated the database password..."
echo ""

# Step 3: Update DATABASE_URL
echo "Step 3: Update DATABASE_URL"
echo "--------------------------------------"
echo "Update your DATABASE_URL environment variable with the new password."
echo ""
echo "The new password is: ${NEW_PASSWORD}"
echo ""
echo "Example DATABASE_URL format:"
echo "postgresql://USER:${NEW_PASSWORD}@HOST:PORT/DATABASE?sslmode=require"
echo ""

if [ "$ENVIRONMENT" = "development" ]; then
  echo "For local development:"
  echo "  1. Update .env.local with new DATABASE_URL"
  echo "  2. Restart your development server"
elif [ "$ENVIRONMENT" = "production" ]; then
  echo "For production:"
  echo "  1. Update environment variables in your hosting platform:"
  echo "     - Vercel: Dashboard > Settings > Environment Variables"
  echo "     - AWS: Systems Manager Parameter Store or Secrets Manager"
  echo "     - Heroku: heroku config:set DATABASE_URL='...' --app your-app"
  echo "  2. Deploy/restart your application"
  echo "  3. Verify connections are working"
fi
echo ""
read -p "Press Enter after you've updated the environment variable..."
echo ""

# Step 4: Verify connection
echo "Step 4: Verify database connection"
echo "--------------------------------------"
echo "Testing database connection..."
echo ""

if command -v npm &> /dev/null; then
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    echo "Running: npx prisma db execute --stdin <<< 'SELECT 1;'"
    cd "$PROJECT_ROOT"
    echo "SELECT 1;" | npx prisma db execute --stdin && \
      echo -e "${GREEN}✓${NC} Database connection successful!" || \
      echo -e "${RED}✗${NC} Database connection failed. Please check your DATABASE_URL."
  fi
else
  echo "Node.js/npm not found. Please manually verify database connection."
fi
echo ""

# Step 5: Update related systems
echo "Step 5: Update related systems"
echo "--------------------------------------"
echo "Don't forget to update:"
echo "  - Backup scripts"
echo "  - Monitoring tools"
echo "  - CI/CD pipelines"
echo "  - Database administration tools"
echo "  - Team documentation"
echo ""

# Step 6: Document rotation
echo "Step 6: Document the rotation"
echo "--------------------------------------"
ROTATION_LOG="$PROJECT_ROOT/credential-rotation.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - $ENVIRONMENT - Database password rotated by $(whoami)" >> "$ROTATION_LOG"
echo -e "${GREEN}✓${NC} Rotation logged to: credential-rotation.log"
echo ""

# Schedule next rotation
NEXT_ROTATION=$(date -d "+90 days" '+%Y-%m-%d' 2>/dev/null || date -v+90d '+%Y-%m-%d' 2>/dev/null || echo "90 days from now")
echo "========================================"
echo -e "${GREEN}Rotation complete!${NC}"
echo "========================================"
echo ""
echo "Next rotation scheduled for: $NEXT_ROTATION"
echo ""
echo "IMPORTANT:"
echo "  - Store the new password securely"
echo "  - Delete this terminal history"
echo "  - Monitor application logs for connection errors"
echo "  - Set a calendar reminder for next rotation"
echo ""

# Security cleanup
unset NEW_PASSWORD
