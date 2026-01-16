/**
 * Integration Test Helpers
 *
 * Provides utilities for setting up and tearing down test databases,
 * creating test data, and mocking external dependencies for integration tests.
 */

import { PrismaClient } from '@prisma/client'
import { vi } from 'vitest'

// Create a separate Prisma client for testing
let prisma: PrismaClient

/**
 * Initialize the test database connection
 */
export function setupTestDatabase() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/smartbudget_test'
        }
      }
    })
  }
  return prisma
}

/**
 * Clean up all test data from the database
 */
export async function cleanupTestDatabase() {
  if (!prisma) return

  // Delete in order of dependencies
  await prisma.split.deleteMany()
  await prisma.transactionTag.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.budgetCategory.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.recurringTransaction.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.categoryRule.deleteMany()
  await prisma.account.deleteMany()
  await prisma.category.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.merchant.deleteMany()
  await prisma.job.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}

/**
 * Disconnect from the test database
 */
export async function disconnectTestDatabase() {
  if (prisma) {
    await prisma.$disconnect()
  }
}

/**
 * Create a test user
 */
export async function createTestUser(db: PrismaClient, overrides?: Partial<any>) {
  return await db.user.create({
    data: {
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      role: overrides?.role || 'USER',
      ...overrides
    }
  })
}

/**
 * Create a test account
 */
export async function createTestAccount(db: PrismaClient, userId: string, overrides?: Partial<any>) {
  return await db.account.create({
    data: {
      userId,
      name: overrides?.name || 'Test Account',
      type: overrides?.type || 'CHECKING',
      balance: overrides?.balance || 1000,
      currency: overrides?.currency || 'USD',
      icon: overrides?.icon || 'Wallet',
      color: overrides?.color || '#3b82f6',
      ...overrides
    }
  })
}

/**
 * Create a test category
 */
export async function createTestCategory(db: PrismaClient, userId: string, overrides?: Partial<any>) {
  return await db.category.create({
    data: {
      userId,
      name: overrides?.name || 'Test Category',
      type: overrides?.type || 'EXPENSE',
      icon: overrides?.icon || 'Tag',
      color: overrides?.color || '#3b82f6',
      ...overrides
    }
  })
}

/**
 * Create a test transaction
 */
export async function createTestTransaction(
  db: PrismaClient,
  userId: string,
  accountId: string,
  overrides?: Partial<any>
) {
  return await db.transaction.create({
    data: {
      userId,
      accountId,
      date: overrides?.date || new Date(),
      description: overrides?.description || 'Test Transaction',
      amount: overrides?.amount || 100,
      type: overrides?.type || 'EXPENSE',
      categoryId: overrides?.categoryId || null,
      merchantId: overrides?.merchantId || null,
      ...overrides
    }
  })
}

/**
 * Create a test budget
 */
export async function createTestBudget(
  db: PrismaClient,
  userId: string,
  overrides?: Partial<any>
) {
  return await db.budget.create({
    data: {
      userId,
      name: overrides?.name || 'Test Budget',
      startDate: overrides?.startDate || new Date(),
      endDate: overrides?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: overrides?.totalAmount || 1000,
      ...overrides
    }
  })
}

/**
 * Create a test budget category
 */
export async function createTestBudgetCategory(
  db: PrismaClient,
  budgetId: string,
  categoryId: string,
  overrides?: Partial<any>
) {
  return await db.budgetCategory.create({
    data: {
      budgetId,
      categoryId,
      amount: overrides?.amount || 500,
      ...overrides
    }
  })
}

/**
 * Create a test merchant
 */
export async function createTestMerchant(db: PrismaClient, overrides?: Partial<any>) {
  return await db.merchant.create({
    data: {
      name: overrides?.name || 'Test Merchant',
      normalizedName: overrides?.normalizedName || 'test merchant',
      website: overrides?.website || null,
      logo: overrides?.logo || null,
      category: overrides?.category || null,
      ...overrides
    }
  })
}

/**
 * Mock authentication for API route testing
 */
export function mockAuth(user: any) {
  vi.mock('@/lib/auth', () => ({
    getServerSession: vi.fn().mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  }))
}

/**
 * Mock Redis for caching tests
 */
export function mockRedis() {
  const cache = new Map()

  return {
    get: vi.fn(async (key: string) => cache.get(key)),
    set: vi.fn(async (key: string, value: any, options?: any) => {
      cache.set(key, value)
      return 'OK'
    }),
    del: vi.fn(async (...keys: string[]) => {
      keys.forEach(key => cache.delete(key))
      return keys.length
    }),
    clear: () => cache.clear(),
    cache
  }
}

/**
 * Create CSV content for transaction import testing
 */
export function createTestCSV(transactions: Array<{
  date: string
  description: string
  amount: number
  type?: string
}>): string {
  const headers = 'Date,Description,Amount,Type'
  const rows = transactions.map(t =>
    `${t.date},"${t.description}",${t.amount},${t.type || 'EXPENSE'}`
  )
  return [headers, ...rows].join('\n')
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Assert that a value is defined (TypeScript helper)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined')
  }
}
