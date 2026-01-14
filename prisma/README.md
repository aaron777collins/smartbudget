# Database Setup and Seeding

## Prerequisites

1. **PostgreSQL Database**: Ensure you have a PostgreSQL database running
   - Local: `postgresql://postgres:postgres@localhost:5432/smartbudget`
   - Or update `DATABASE_URL` in `.env`

2. **Prisma Client Generated**: Run `npm run db:generate`

## Initial Setup

### 1. Create Database and Run Migrations

```bash
# Push the schema to the database (creates tables)
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

### 2. Seed Categories

```bash
npm run db:seed
```

This will populate the database with:
- **16 Primary Categories** (Plaid PFCv2 taxonomy)
- **126 Subcategories**

Categories include:
- Income
- Transfer In/Out
- Loan Payments
- Bank Fees
- Entertainment
- Food & Drink
- General Merchandise
- Home Improvement
- Medical
- Personal Care
- General Services
- Government & Non-Profit
- Transportation
- Travel
- Rent & Utilities

## Known Issues

### Prisma 7 Compatibility

The project uses Prisma 7.2.0 with `engineType = "binary"` which has some compatibility issues with the client engine in certain environments. If you encounter errors about "adapter" or "accelerateUrl" when running the seed script:

**Option 1: Run seed script directly with database connection**
```bash
# Ensure DATABASE_URL is set in .env
DATABASE_URL="postgresql://user:password@localhost:5432/smartbudget" node prisma/seed.js
```

**Option 2: Use Prisma Studio to verify**
```bash
npm run db:studio
```

## Verification

After seeding, verify the data:

```bash
# Open Prisma Studio
npm run db:studio
```

Or query directly:
```sql
SELECT COUNT(*) FROM "Category";  -- Should return 16
SELECT COUNT(*) FROM "Subcategory";  -- Should return 126
```

## Re-seeding

The seed script is idempotent - it will skip categories and subcategories that already exist. You can safely run it multiple times.

```bash
npm run db:seed
```

## Manual Category Management

Categories are system-managed by default (`isSystemCategory: true`). Users can also create custom categories which will have `isSystemCategory: false` and a `userId` reference.
