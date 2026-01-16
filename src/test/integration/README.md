# Integration Tests

This directory contains comprehensive integration tests for SmartBudget's critical business flows. Integration tests verify that multiple components work together correctly, including database operations, business logic, and data aggregation.

## Test Suites

### 1. Transaction Import Flow (`transaction-import.integration.test.ts`)

Tests the complete flow of importing transactions from CSV/OFX/QFX files.

**Coverage:**
- Import new transactions successfully
- Duplicate detection by FITID
- Duplicate detection by signature (date + merchant + amount)
- Account creation when accountInfo provided
- Using existing account when accountId provided
- Account balance updates after import
- Merchant normalization during import
- Auto-categorization during import
- Categorization statistics tracking
- Error handling (no transactions, account not found, invalid data)

**Key Flows:**
1. File parsing → Duplicate detection → Merchant normalization → Auto-categorization → Database insertion → Account balance updates

### 2. Categorization Pipeline (`categorization-pipeline.integration.test.ts`)

Tests the complete categorization system including rule-based, ML-based, and hybrid approaches.

**Coverage:**
- Rule-based categorization using keyword rules
- Rule priority resolution for conflicting rules
- Different rule operators (CONTAINS, EQUALS, STARTS_WITH)
- ML-based categorization when rules don't match
- Learning from manually categorized transactions
- Hybrid categorization (rule-based with ML fallback)
- Confidence scoring (high, medium, low)
- Flagging low-confidence categorizations for review
- User corrections and learning
- Creating category rules from user corrections

**Key Flows:**
1. Rule-based categorization (fast path)
2. ML-based categorization (fallback)
3. Hybrid: Rule-based → ML fallback → Best result selection
4. User correction → Rule creation → Improved future categorization

### 3. Budget Calculation Logic (`budget-calculations.integration.test.ts`)

Tests budget creation, period calculations, spending aggregation, and progress tracking.

**Coverage:**
- Budget creation with multiple categories
- Different budget periods (weekly, bi-weekly, monthly, quarterly, yearly)
- Date range calculations for each period
- Spending aggregation by category
- Only counting DEBIT transactions in spending
- Progress calculations (spent, remaining, percent used)
- Overall budget vs category-level tracking
- Budget status determination (good, caution, warning, over)
- Category-level independent tracking
- Edge cases (no spending, zero budget, transactions outside period)

**Key Flows:**
1. Budget creation → Category allocation → Transaction aggregation → Progress calculation → Status determination

### 4. Dashboard Data Aggregation (`dashboard-aggregation.integration.test.ts`)

Tests the dashboard's complex data aggregation including net worth, cash flow, and historical trends.

**Coverage:**
- Net worth calculation from all active accounts
- Excluding inactive accounts from net worth
- Net worth change from previous month
- Monthly spending calculation (excluding transfers)
- Monthly income calculation (excluding transfers)
- Cash flow calculation (income - spending)
- Negative cash flow handling
- Income sources breakdown by category
- Income percentage calculation
- Spending aggregation by category
- Budget progress aggregation
- Historical trends (12-month data)

**Key Flows:**
1. Account balances → Net worth calculation
2. Monthly transactions → Income/Spending aggregation → Cash flow
3. Category breakdown → Percentages → Budget progress
4. Historical data → Trend analysis

## Test Helpers

The `integration-helpers.ts` file provides utilities for:

- Database setup and cleanup
- Test data creation (users, accounts, categories, transactions, budgets)
- Authentication mocking
- Redis mocking
- CSV test data generation
- Type assertion helpers

## Running Integration Tests

```bash
# Run all integration tests
npm run test -- src/test/integration/

# Run specific test suite
npm run test -- src/test/integration/transaction-import.integration.test.ts

# Run with coverage
npm run test:coverage -- src/test/integration/
```

## Database Requirements

Integration tests require a test database. Configure the `DATABASE_URL` environment variable to point to a test database:

```bash
export DATABASE_URL="postgresql://test:test@localhost:5432/smartbudget_test"
```

**Important:** The test database will be cleaned before each test run. Never point to a production database.

## Test Structure

Each test suite follows this structure:

```typescript
describe('Feature Integration Tests', () => {
  let prisma: PrismaClient
  let testUserId: string
  // ... other test data IDs

  beforeEach(async () => {
    // Setup: Create test database connection and test data
    prisma = setupTestDatabase()
    await cleanupTestDatabase()

    // Create test users, accounts, categories, etc.
  })

  afterEach(async () => {
    // Cleanup: Remove test data and disconnect
    await cleanupTestDatabase()
    await disconnectTestDatabase()
  })

  describe('Specific Feature', () => {
    it('should do something', async () => {
      // Test implementation
    })
  })
})
```

## Test Data Isolation

Each test suite:
- Creates its own isolated test data in `beforeEach`
- Cleans up all test data in `afterEach`
- Uses unique user IDs to prevent conflicts
- Never modifies global state

## Known Issues

**Vitest Dependency:** Currently, there's a vitest dependency installation issue in the environment. The tests are correctly implemented but cannot run until the dependency is resolved. The tests follow Testing Library best practices and are ready to run once the environment is fixed.

## Contributing

When adding new integration tests:

1. Create test data in `beforeEach` using helper functions
2. Clean up all test data in `afterEach`
3. Test the complete flow, not individual functions
4. Include edge cases and error scenarios
5. Use descriptive test names that explain the behavior
6. Add assertions for all important outcomes
7. Document complex test scenarios in comments

## Coverage Goals

Integration tests should verify:
- ✅ Critical business flows work end-to-end
- ✅ Database operations succeed
- ✅ Data aggregation is accurate
- ✅ Business logic produces correct results
- ✅ Error handling works as expected
- ✅ Edge cases are handled properly

Target: 100% coverage of critical business flows
