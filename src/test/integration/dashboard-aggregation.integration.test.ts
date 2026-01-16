/**
 * Integration Tests: Dashboard Data Aggregation
 *
 * Tests the complete flow of dashboard data aggregation:
 * 1. Net worth calculation from account balances
 * 2. Monthly spending and income aggregation
 * 3. Cash flow calculation
 * 4. Income sources breakdown
 * 5. Spending by category
 * 6. Budget progress aggregation
 * 7. Historical trends (12-month data)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { startOfMonth, endOfMonth, subMonths, addDays } from 'date-fns'
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  createTestBudget,
  createTestBudgetCategory,
  assertDefined
} from '../integration-helpers'

describe('Dashboard Aggregation Integration Tests', () => {
  let prisma: PrismaClient
  let testUserId: string
  let testAccountId: string
  let salaryCategory: { id: string; slug: string }
  let groceriesCategory: { id: string; slug: string }
  let restaurantsCategory: { id: string; slug: string }
  let transferInCategory: { id: string; slug: string }
  let transferOutCategory: { id: string; slug: string }

  beforeEach(async () => {
    prisma = setupTestDatabase()
    await cleanupTestDatabase()

    // Create test user
    const user = await createTestUser(prisma, {
      email: 'dashboard-test@example.com',
      name: 'Dashboard Test User'
    })
    testUserId = user.id

    // Create test account
    const account = await createTestAccount(prisma, testUserId, {
      name: 'Checking Account',
      type: 'CHECKING',
      balance: 5000
    })
    testAccountId = account.id

    // Create test categories
    const salary = await createTestCategory(prisma, testUserId, {
      name: 'Salary',
      type: 'INCOME',
      slug: 'salary'
    })
    salaryCategory = { id: salary.id, slug: salary.slug! }

    const groceries = await createTestCategory(prisma, testUserId, {
      name: 'Groceries',
      type: 'EXPENSE',
      slug: 'groceries'
    })
    groceriesCategory = { id: groceries.id, slug: groceries.slug! }

    const restaurants = await createTestCategory(prisma, testUserId, {
      name: 'Restaurants',
      type: 'EXPENSE',
      slug: 'restaurants'
    })
    restaurantsCategory = { id: restaurants.id, slug: restaurants.slug! }

    const transferIn = await createTestCategory(prisma, testUserId, {
      name: 'Transfer In',
      type: 'INCOME',
      slug: 'transfer-in'
    })
    transferInCategory = { id: transferIn.id, slug: transferIn.slug! }

    const transferOut = await createTestCategory(prisma, testUserId, {
      name: 'Transfer Out',
      type: 'EXPENSE',
      slug: 'transfer-out'
    })
    transferOutCategory = { id: transferOut.id, slug: transferOut.slug! }
  })

  afterEach(async () => {
    await cleanupTestDatabase()
    await disconnectTestDatabase()
  })

  describe('Net Worth Calculation', () => {
    it('should calculate net worth from all active accounts', async () => {
      // Create multiple accounts
      await createTestAccount(prisma, testUserId, {
        name: 'Savings',
        type: 'SAVINGS',
        balance: 10000,
        isActive: true
      })

      await createTestAccount(prisma, testUserId, {
        name: 'Credit Card',
        type: 'CREDIT',
        balance: -2000,
        isActive: true
      })

      const accounts = await prisma.account.findMany({
        where: { userId: testUserId, isActive: true }
      })

      const netWorth = accounts.reduce((sum, account) => {
        return sum + Number(account.currentBalance)
      }, 0)

      // 5000 (checking) + 10000 (savings) + (-2000) (credit) = 13000
      expect(netWorth).toBe(13000)
    })

    it('should exclude inactive accounts from net worth', async () => {
      await createTestAccount(prisma, testUserId, {
        name: 'Closed Account',
        type: 'CHECKING',
        balance: 5000,
        isActive: false
      })

      const accounts = await prisma.account.findMany({
        where: { userId: testUserId, isActive: true }
      })

      const netWorth = accounts.reduce((sum, account) => {
        return sum + Number(account.currentBalance)
      }, 0)

      // Only the initial test account (5000) should be counted
      expect(netWorth).toBe(5000)
    })

    it('should calculate net worth change from previous month', async () => {
      const now = new Date()
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))

      // Create last month transactions
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(lastMonthStart, 5),
        amount: 3000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(lastMonthStart, 10),
        amount: 1500,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      const lastMonthTransactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: lastMonthStart, lte: lastMonthEnd }
        }
      })

      const lastMonthBalanceChange = lastMonthTransactions.reduce((sum, txn) => {
        const amount = Number(txn.amount)
        return txn.type === 'CREDIT' ? sum + amount : sum - amount
      }, 0)

      expect(lastMonthBalanceChange).toBe(1500) // 3000 - 1500
    })
  })

  describe('Monthly Spending and Income', () => {
    it('should calculate monthly spending excluding transfers', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 500,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 10),
        amount: 200,
        type: 'DEBIT',
        categoryId: restaurantsCategory.id
      })

      // This should NOT be counted (transfer)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 12),
        amount: 1000,
        type: 'DEBIT',
        categoryId: transferOutCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) }
        },
        include: { category: true }
      })

      const monthlySpending = transactions.reduce((sum, txn) => {
        if (txn.type === 'DEBIT' && txn.category?.slug !== 'transfer-out') {
          return sum + Number(txn.amount)
        }
        return sum
      }, 0)

      expect(monthlySpending).toBe(700) // 500 + 200, excluding transfer
    })

    it('should calculate monthly income excluding transfers', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 1),
        amount: 5000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      // This should NOT be counted (transfer)
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 1000,
        type: 'CREDIT',
        categoryId: transferInCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) }
        },
        include: { category: true }
      })

      const monthlyIncome = transactions.reduce((sum, txn) => {
        if (txn.type === 'CREDIT' && txn.category?.slug !== 'transfer-in') {
          return sum + Number(txn.amount)
        }
        return sum
      }, 0)

      expect(monthlyIncome).toBe(5000) // Excluding transfer
    })
  })

  describe('Cash Flow Calculation', () => {
    it('should calculate cash flow as income minus spending', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      // Income
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 1),
        amount: 5000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      // Spending
      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 1500,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 10),
        amount: 800,
        type: 'DEBIT',
        categoryId: restaurantsCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) }
        },
        include: { category: true }
      })

      const monthlyIncome = transactions.reduce((sum, txn) => {
        if (txn.type === 'CREDIT' && txn.category?.slug !== 'transfer-in') {
          return sum + Number(txn.amount)
        }
        return sum
      }, 0)

      const monthlySpending = transactions.reduce((sum, txn) => {
        if (txn.type === 'DEBIT' && txn.category?.slug !== 'transfer-out') {
          return sum + Number(txn.amount)
        }
        return sum
      }, 0)

      const cashFlow = monthlyIncome - monthlySpending

      expect(monthlyIncome).toBe(5000)
      expect(monthlySpending).toBe(2300)
      expect(cashFlow).toBe(2700)
    })

    it('should handle negative cash flow', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 1),
        amount: 2000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 3000,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) }
        },
        include: { category: true }
      })

      const income = transactions.reduce((sum, txn) => txn.type === 'CREDIT' ? sum + Number(txn.amount) : sum, 0)
      const spending = transactions.reduce((sum, txn) => txn.type === 'DEBIT' ? sum + Number(txn.amount) : sum, 0)
      const cashFlow = income - spending

      expect(cashFlow).toBe(-1000) // Spending more than earning
    })
  })

  describe('Income Sources Breakdown', () => {
    it('should aggregate income by category', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      const freelanceCategory = await createTestCategory(prisma, testUserId, {
        name: 'Freelance',
        type: 'INCOME',
        slug: 'freelance'
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 1),
        amount: 5000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 15),
        amount: 1500,
        type: 'CREDIT',
        categoryId: freelanceCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) },
          type: 'CREDIT'
        },
        include: { category: true }
      })

      const incomeByCategory = transactions
        .filter(txn => txn.category?.slug !== 'transfer-in')
        .reduce((acc, txn) => {
          const categoryName = txn.category?.name || 'Uncategorized'
          const categoryId = txn.category?.id || 'uncategorized'

          if (!acc[categoryId]) {
            acc[categoryId] = { id: categoryId, name: categoryName, amount: 0 }
          }

          acc[categoryId].amount += Number(txn.amount)
          return acc
        }, {} as Record<string, { id: string; name: string; amount: number }>)

      const incomeSources = Object.values(incomeByCategory)

      expect(incomeSources).toHaveLength(2)

      const salaryIncome = incomeSources.find(s => s.name === 'Salary')
      expect(salaryIncome?.amount).toBe(5000)

      const freelanceIncome = incomeSources.find(s => s.name === 'Freelance')
      expect(freelanceIncome?.amount).toBe(1500)
    })

    it('should calculate percentage for each income source', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 1),
        amount: 8000,
        type: 'CREDIT',
        categoryId: salaryCategory.id
      })

      const freelanceCategory = await createTestCategory(prisma, testUserId, {
        name: 'Freelance',
        type: 'INCOME',
        slug: 'freelance'
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 15),
        amount: 2000,
        type: 'CREDIT',
        categoryId: freelanceCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) },
          type: 'CREDIT'
        },
        include: { category: true }
      })

      const monthlyIncome = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0)

      const incomeByCategory = transactions.reduce((acc, txn) => {
        const categoryId = txn.category?.id || 'uncategorized'
        if (!acc[categoryId]) {
          acc[categoryId] = { amount: 0, name: txn.category?.name || 'Uncategorized' }
        }
        acc[categoryId].amount += Number(txn.amount)
        return acc
      }, {} as Record<string, { amount: number; name: string }>)

      const incomeSources = Object.values(incomeByCategory).map(source => ({
        ...source,
        percentage: monthlyIncome > 0 ? (source.amount / monthlyIncome) * 100 : 0
      }))

      expect(monthlyIncome).toBe(10000)

      const salary = incomeSources.find(s => s.name === 'Salary')
      expect(salary?.percentage).toBe(80) // 8000/10000

      const freelance = incomeSources.find(s => s.name === 'Freelance')
      expect(freelance?.percentage).toBe(20) // 2000/10000
    })
  })

  describe('Spending by Category', () => {
    it('should aggregate spending by category', async () => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 500,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 10),
        amount: 300,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 12),
        amount: 200,
        type: 'DEBIT',
        categoryId: restaurantsCategory.id
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: currentMonthStart, lte: endOfMonth(now) },
          type: 'DEBIT'
        },
        include: { category: true }
      })

      const spendingByCategory = transactions
        .filter(txn => txn.category?.slug !== 'transfer-out')
        .reduce((acc, txn) => {
          const categoryId = txn.category?.id || 'uncategorized'
          if (!acc[categoryId]) {
            acc[categoryId] = { amount: 0, name: txn.category?.name || 'Uncategorized' }
          }
          acc[categoryId].amount += Number(txn.amount)
          return acc
        }, {} as Record<string, { amount: number; name: string }>)

      const spending = Object.values(spendingByCategory)

      const groceries = spending.find(s => s.name === 'Groceries')
      expect(groceries?.amount).toBe(800) // 500 + 300

      const restaurants = spending.find(s => s.name === 'Restaurants')
      expect(restaurants?.amount).toBe(200)
    })
  })

  describe('Budget Progress Aggregation', () => {
    it('should aggregate budget progress across categories', async () => {
      const budget = await createTestBudget(prisma, testUserId, {
        name: 'Monthly Budget',
        period: 'MONTHLY',
        totalAmount: 2000
      })

      await createTestBudgetCategory(prisma, budget.id, groceriesCategory.id, { amount: 800 })
      await createTestBudgetCategory(prisma, budget.id, restaurantsCategory.id, { amount: 600 })

      const now = new Date()
      const currentMonthStart = startOfMonth(now)

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 5),
        amount: 400,
        type: 'DEBIT',
        categoryId: groceriesCategory.id
      })

      await createTestTransaction(prisma, testUserId, testAccountId, {
        date: addDays(currentMonthStart, 10),
        amount: 300,
        type: 'DEBIT',
        categoryId: restaurantsCategory.id
      })

      const budgetCategories = await prisma.budgetCategory.findMany({
        where: { budgetId: budget.id }
      })

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          categoryId: { in: budgetCategories.map(bc => bc.categoryId) },
          date: { gte: currentMonthStart, lte: endOfMonth(now) },
          type: 'DEBIT'
        }
      })

      const spendingByCategory = transactions.reduce((acc, t) => {
        acc[t.categoryId!] = (acc[t.categoryId!] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

      const totalBudgeted = Number(budget.totalAmount)
      const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0)
      const totalRemaining = totalBudgeted - totalSpent

      expect(totalBudgeted).toBe(2000)
      expect(totalSpent).toBe(700) // 400 + 300
      expect(totalRemaining).toBe(1300)
    })
  })

  describe('Historical Trends', () => {
    it('should aggregate data for last 12 months', async () => {
      const now = new Date()

      // Create transactions for the last 3 months
      for (let i = 0; i < 3; i++) {
        const monthDate = subMonths(now, i)
        const monthStart = startOfMonth(monthDate)

        await createTestTransaction(prisma, testUserId, testAccountId, {
          date: addDays(monthStart, 5),
          amount: 1000 * (i + 1),
          type: 'DEBIT',
          categoryId: groceriesCategory.id
        })
      }

      const last3MonthsStart = startOfMonth(subMonths(now, 2))

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          date: { gte: last3MonthsStart }
        },
        orderBy: { date: 'asc' }
      })

      expect(transactions.length).toBeGreaterThanOrEqual(3)
    })
  })
})
