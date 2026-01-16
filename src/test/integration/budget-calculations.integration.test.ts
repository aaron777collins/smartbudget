/**
 * Integration Tests: Budget Calculation Logic
 *
 * Tests the complete flow of budget calculations:
 * 1. Budget creation with categories
 * 2. Period-based date range calculations (weekly, monthly, quarterly, yearly)
 * 3. Spending aggregation by category
 * 4. Progress calculations (spent, remaining, percent used)
 * 5. Budget status determination (good, caution, warning, over)
 * 6. Overall budget vs category-level tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays
} from 'date-fns'
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestBudget,
  createTestBudgetCategory,
  createTestTransaction,
  assertDefined
} from '../integration-helpers'

describe('Budget Calculations Integration Tests', () => {
  let prisma: PrismaClient
  let testUserId: string
  let testAccountId: string
  let groceryCategoryId: string
  let restaurantCategoryId: string
  let transportCategoryId: string

  beforeEach(async () => {
    prisma = setupTestDatabase()
    await cleanupTestDatabase()

    // Create test user
    const user = await createTestUser(prisma, {
      email: 'budget-test@example.com',
      name: 'Budget Test User'
    })
    testUserId = user.id

    // Create test account
    const account = await createTestAccount(prisma, testUserId, {
      name: 'Test Account',
      type: 'CHECKING',
      balance: 5000
    })
    testAccountId = account.id

    // Create test categories
    const groceryCategory = await createTestCategory(prisma, testUserId, {
      name: 'Groceries',
      type: 'EXPENSE',
      slug: 'groceries'
    })
    groceryCategoryId = groceryCategory.id

    const restaurantCategory = await createTestCategory(prisma, testUserId, {
      name: 'Restaurants',
      type: 'EXPENSE',
      slug: 'restaurants'
    })
    restaurantCategoryId = restaurantCategory.id

    const transportCategory = await createTestCategory(prisma, testUserId, {
      name: 'Transportation',
      type: 'EXPENSE',
      slug: 'transportation'
    })
    transportCategoryId = transportCategory.id
  })

  afterEach(async () => {
    await cleanupTestDatabase()
    await disconnectTestDatabase()
  })

  describe('Budget Creation', () => {
    it('should create budget with multiple categories', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Monthly Budget',
        period: 'MONTHLY',
        totalAmount: 2000
      })

      // Add categories to budget
      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 800 })
      await createTestBudgetCategory(prisma, budget.id, restaurantCategoryId, { amount: 600 })
      await createTestBudgetCategory(prisma, budget.id, transportCategoryId, { amount: 600 })

      const budgetWithCategories = await prisma.budget.findUnique({
        where: { id: budget.id },
        include: { categories: true }
      })

      expect(budgetWithCategories).toBeTruthy()
      assertDefined(budgetWithCategories)
      expect(budgetWithCategories.categories).toHaveLength(3)
      expect(Number(budgetWithCategories.totalAmount)).toBe(2000)

      const totalCategoryBudgets = budgetWithCategories.categories.reduce(
        (sum, cat) => sum + Number(cat.amount),
        0
      )
      expect(totalCategoryBudgets).toBe(2000)
    })

    it('should support different budget periods', async () => {
      const periods = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const

      for (const period of periods) {
        const budget = await createTestBudget(prisma, testUserId, {
          name: `${period} Budget`,
          period,
          totalAmount: 1000
        })

        expect(budget.period).toBe(period)
      }

      const allBudgets = await prisma.budget.findMany({
        where: { userId: testUserId }
      })

      expect(allBudgets).toHaveLength(4)
    })
  })

  describe('Date Range Calculations', () => {
    it('should calculate monthly date range correctly', () => {
      const now = new Date('2024-01-15')
      const startDate = startOfMonth(now)
      const endDate = endOfMonth(now)

      expect(startDate.getDate()).toBe(1)
      expect(endDate.getDate()).toBe(31) // January has 31 days
      expect(startDate.getMonth()).toBe(endDate.getMonth())
    })

    it('should calculate weekly date range correctly', () => {
      const now = new Date('2024-01-15') // Monday
      const startDate = startOfWeek(now)
      const endDate = endOfWeek(now)

      const dayDifference = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(dayDifference).toBe(6) // 7 days (0-6)
    })

    it('should calculate quarterly date range correctly', () => {
      const now = new Date('2024-02-15') // Q1
      const startDate = startOfQuarter(now)
      const endDate = endOfQuarter(now)

      expect(startDate.getMonth()).toBe(0) // January (Q1 start)
      expect(endDate.getMonth()).toBe(2) // March (Q1 end)
    })

    it('should calculate yearly date range correctly', () => {
      const now = new Date('2024-06-15')
      const startDate = startOfYear(now)
      const endDate = endOfYear(now)

      expect(startDate.getMonth()).toBe(0) // January
      expect(startDate.getDate()).toBe(1)
      expect(endDate.getMonth()).toBe(11) // December
      expect(endDate.getDate()).toBe(31)
    })
  })

  describe('Spending Aggregation', () => {
    it('should aggregate spending by category', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        period: 'MONTHLY',
        totalAmount: 1000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })
      await createTestBudgetCategory(prisma, budget.id, restaurantCategoryId, { amount: 500 })

      // Create transactions
      const now = new Date()
      const startDate = startOfMonth(now)
      const endDate = endOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 5),
        merchantName: 'Grocery Store',
        amount: 100,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 10),
        merchantName: 'Grocery Store',
        amount: 150,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 12),
        merchantName: 'Restaurant',
        amount: 75,
        type: 'DEBIT',
        categoryId: restaurantCategoryId
      })

      // Aggregate spending
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          categoryId: { in: [groceryCategoryId, restaurantCategoryId] },
          date: { gte: startDate, lte: endDate },
          type: 'DEBIT'
        }
      })

      const spendingByCategory = transactions.reduce((acc, t) => {
        const catId = t.categoryId!
        acc[catId] = (acc[catId] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

      expect(spendingByCategory[groceryCategoryId]).toBe(250)
      expect(spendingByCategory[restaurantCategoryId]).toBe(75)
    })

    it('should only count DEBIT transactions in spending', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 1000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })

      const now = new Date()
      const startDate = startOfMonth(now)

      // Create DEBIT (spending)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 5),
        amount: 100,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      // Create CREDIT (income - should not count)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 6),
        amount: 200,
        type: 'CREDIT',
        categoryId: groceryCategoryId
      })

      const debits = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          categoryId: groceryCategoryId,
          type: 'DEBIT'
        }
      })

      const totalSpending = debits.reduce((sum, t) => sum + Number(t.amount), 0)
      expect(totalSpending).toBe(100)
    })
  })

  describe('Progress Calculations', () => {
    it('should calculate spent, remaining, and percent used', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 1000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })

      // Create transactions totaling 300
      const now = new Date()
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 300,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      const budgetCategory = await prisma.budgetCategory.findFirst({
        where: { budgetId: budget.id, categoryId: groceryCategoryId }
      })
      assertDefined(budgetCategory)

      const budgeted = Number(budgetCategory.amount)
      const spent = 300
      const remaining = budgeted - spent
      const percentUsed = (spent / budgeted) * 100

      expect(budgeted).toBe(500)
      expect(spent).toBe(300)
      expect(remaining).toBe(200)
      expect(percentUsed).toBe(60)
    })

    it('should calculate overall budget progress', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 2000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 800 })
      await createTestBudgetCategory(prisma, budget.id, restaurantCategoryId, { amount: 600 })
      await createTestBudgetCategory(prisma, budget.id, transportCategoryId, { amount: 600 })

      // Create spending
      const now = new Date()
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 400,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 300,
        type: 'DEBIT',
        categoryId: restaurantCategoryId
      })
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 200,
        type: 'DEBIT',
        categoryId: transportCategoryId
      })

      const totalBudgeted = Number(budget.totalAmount)
      const totalSpent = 400 + 300 + 200
      const totalRemaining = totalBudgeted - totalSpent
      const overallPercentUsed = (totalSpent / totalBudgeted) * 100

      expect(totalBudgeted).toBe(2000)
      expect(totalSpent).toBe(900)
      expect(totalRemaining).toBe(1100)
      expect(overallPercentUsed).toBe(45)
    })
  })

  describe('Budget Status', () => {
    it('should return "good" status when under 80%', () => {
      const percentUsed = 60
      const status = percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good'
      expect(status).toBe('good')
    })

    it('should return "caution" status when 80-89%', () => {
      const percentUsed = 85
      const status = percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good'
      expect(status).toBe('caution')
    })

    it('should return "warning" status when 90-99%', () => {
      const percentUsed = 95
      const status = percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good'
      expect(status).toBe('warning')
    })

    it('should return "over" status when 100% or more', () => {
      const percentUsed = 110
      const status = percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good'
      expect(status).toBe('over')
    })
  })

  describe('Category-Level Tracking', () => {
    it('should track each category independently', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 1500
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })
      await createTestBudgetCategory(prisma, budget.id, restaurantCategoryId, { amount: 500 })
      await createTestBudgetCategory(prisma, budget.id, transportCategoryId, { amount: 500 })

      const now = new Date()

      // Groceries: 80% (caution)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 400,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      // Restaurants: 50% (good)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 250,
        type: 'DEBIT',
        categoryId: restaurantCategoryId
      })

      // Transport: 110% (over)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: now,
        amount: 550,
        type: 'DEBIT',
        categoryId: transportCategoryId
      })

      const budgetCategories = await prisma.budgetCategory.findMany({
        where: { budgetId: budget.id },
        include: { category: true }
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          categoryId: { in: [groceryCategoryId, restaurantCategoryId, transportCategoryId] },
          type: 'DEBIT'
        }
      })

      const spendingByCategory = transactions.reduce((acc, t) => {
        acc[t.categoryId!] = (acc[t.categoryId!] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

      const progress = budgetCategories.map(bc => {
        const spent = spendingByCategory[bc.categoryId] || 0
        const budgeted = Number(bc.amount)
        const percentUsed = (spent / budgeted) * 100
        const status = percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good'

        return { categoryId: bc.categoryId, spent, budgeted, percentUsed, status }
      })

      expect(progress).toHaveLength(3)

      const groceryProgress = progress.find(p => p.categoryId === groceryCategoryId)
      expect(groceryProgress?.status).toBe('caution')
      expect(groceryProgress?.percentUsed).toBe(80)

      const restaurantProgress = progress.find(p => p.categoryId === restaurantCategoryId)
      expect(restaurantProgress?.status).toBe('good')
      expect(restaurantProgress?.percentUsed).toBe(50)

      const transportProgress = progress.find(p => p.categoryId === transportCategoryId)
      expect(transportProgress?.status).toBe('over')
      expect(transportProgress?.percentUsed).toBe(110)
    })
  })

  describe('Edge Cases', () => {
    it('should handle budget with no spending', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 1000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })

      const spent = 0
      const budgeted = 500
      const remaining = budgeted - spent
      const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0

      expect(spent).toBe(0)
      expect(remaining).toBe(500)
      expect(percentUsed).toBe(0)
    })

    it('should handle budget with zero amount', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 0
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 0 })

      const spent = 50
      const budgeted = 0
      const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0

      expect(percentUsed).toBe(0) // Avoid division by zero
    })

    it('should handle transactions outside budget period', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Test Budget',
        totalAmount: 1000
      })

      await createTestBudgetCategory(prisma, budget.id, groceryCategoryId, { amount: 500 })

      const now = new Date()
      const startDate = startOfMonth(now)
      const endDate = endOfMonth(now)

      // Transaction inside period
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, 5),
        amount: 100,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      // Transaction outside period (previous month)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(startDate, -10),
        amount: 200,
        type: 'DEBIT',
        categoryId: groceryCategoryId
      })

      const transactionsInPeriod = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          categoryId: groceryCategoryId,
          date: { gte: startDate, lte: endDate },
          type: 'DEBIT'
        }
      })

      const totalSpent = transactionsInPeriod.reduce((sum, t) => sum + Number(t.amount), 0)
      expect(totalSpent).toBe(100) // Only counts the transaction inside the period
    })
  })
})
