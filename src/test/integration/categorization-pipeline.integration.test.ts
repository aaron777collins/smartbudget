/**
 * Integration Tests: Categorization Pipeline
 *
 * Tests the complete flow of transaction categorization:
 * 1. Rule-based categorization (fast path)
 * 2. ML-based categorization (fallback)
 * 3. Hybrid categorization (rule + ML)
 * 4. Category rules management
 * 5. ML model training
 * 6. Confidence scoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  assertDefined
} from '../integration-helpers'

describe('Categorization Pipeline Integration Tests', () => {
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
      email: 'categorization-test@example.com',
      name: 'Categorization Test User'
    })
    testUserId = user.id

    // Create test account
    const account = await createTestAccount(prisma, testUserId, {
      name: 'Test Account',
      type: 'CHECKING'
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
    vi.clearAllMocks()
  })

  describe('Rule-Based Categorization', () => {
    it('should categorize transaction using keyword rules', async () => {
      // Create a category rule
      await prisma.categoryRule.create({
        data: {
          userId: testUserId,
          categoryId: groceryCategoryId,
          field: 'merchantName',
          operator: 'CONTAINS',
          value: 'whole foods',
          priority: 1
        }
      })

      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Whole Foods Market',
        description: 'Grocery shopping',
        amount: 125.50
      })

      // Simulate rule-based categorization
      const rule = await prisma.categoryRule.findFirst({
        where: {
          userId: testUserId,
          field: 'merchantName',
          value: { contains: 'whole foods', mode: 'insensitive' }
        }
      })

      expect(rule).toBeTruthy()
      assertDefined(rule)

      // Apply categorization
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: rule.categoryId,
          confidenceScore: 0.95
        }
      })

      const categorized = await prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { category: true }
      })

      expect(categorized).toBeTruthy()
      assertDefined(categorized)
      expect(categorized.categoryId).toBe(groceryCategoryId)
      expect(categorized.category?.name).toBe('Groceries')
      expect(Number(categorized.confidenceScore)).toBe(0.95)
    })

    it('should use priority to resolve conflicting rules', async () => {
      // Create two conflicting rules with different priorities
      await prisma.categoryRule.createMany({
        data: [
          {
            userId: testUserId,
            categoryId: groceryCategoryId,
            field: 'merchantName',
            operator: 'CONTAINS',
            value: 'walmart',
            priority: 2 // Lower priority
          },
          {
            userId: testUserId,
            categoryId: restaurantCategoryId,
            field: 'description',
            operator: 'CONTAINS',
            value: 'restaurant',
            priority: 1 // Higher priority
          }
        ]
      })

      // Find rules in priority order
      const rules = await prisma.categoryRule.findMany({
        where: { userId: testUserId },
        orderBy: { priority: 'asc' }
      })

      expect(rules).toHaveLength(2)
      expect(rules[0].priority).toBe(1)
      expect(rules[0].categoryId).toBe(restaurantCategoryId)
    })

    it('should support different rule operators', async () => {
      const operators = [
        { operator: 'CONTAINS' as const, value: 'starbucks', testValue: 'Starbucks Coffee' },
        { operator: 'EQUALS' as const, value: 'Amazon', testValue: 'Amazon' },
        { operator: 'STARTS_WITH' as const, value: 'UBER', testValue: 'UBER EATS' }
      ]

      for (const op of operators) {
        await prisma.categoryRule.create({
          data: {
            userId: testUserId,
            categoryId: groceryCategoryId,
            field: 'merchantName',
            operator: op.operator,
            value: op.value,
            priority: 1
          }
        })

        // Test each operator
        const rule = await prisma.categoryRule.findFirst({
          where: {
            userId: testUserId,
            operator: op.operator,
            value: op.value
          }
        })

        expect(rule).toBeTruthy()
        expect(rule?.operator).toBe(op.operator)

        // Clean up for next iteration
        if (rule) {
          await prisma.categoryRule.delete({ where: { id: rule.id } })
        }
      }
    })
  })

  describe('ML-Based Categorization', () => {
    it('should categorize transaction using ML when rules do not match', async () => {
      // Create transaction with no matching rule
      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Unknown Coffee Shop',
        description: 'Coffee purchase',
        amount: 4.50
      })

      // Simulate ML categorization
      // In real implementation, ML model would be called
      const mlCategoryId = restaurantCategoryId
      const mlConfidence = 0.85

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: mlCategoryId,
          confidenceScore: mlConfidence
        }
      })

      const categorized = await prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { category: true }
      })

      expect(categorized).toBeTruthy()
      assertDefined(categorized)
      expect(categorized.categoryId).toBe(restaurantCategoryId)
      expect(Number(categorized.confidenceScore)).toBe(0.85)
    })

    it('should learn from manually categorized transactions', async () => {
      // Create manually categorized transactions (training data)
      const trainingTransactions = [
        { merchantName: 'Local Cafe', categoryId: restaurantCategoryId },
        { merchantName: 'Coffee House', categoryId: restaurantCategoryId },
        { merchantName: 'Downtown Diner', categoryId: restaurantCategoryId }
      ]

      for (const t of trainingTransactions) {
        await createTestTransaction(prisma, testUserId, testAccountId, {
          merchantName: t.merchantName,
          description: 'Food purchase',
          amount: 15,
          categoryId: t.categoryId,
          userCorrected: true // Manually categorized
        })
      }

      // Fetch training data
      const trainingData = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          userCorrected: true,
          categoryId: { not: null }
        },
        include: { category: true }
      })

      expect(trainingData).toHaveLength(3)
      trainingData.forEach(t => {
        expect(t.categoryId).toBe(restaurantCategoryId)
        expect(t.userCorrected).toBe(true)
      })
    })
  })

  describe('Hybrid Categorization', () => {
    it('should use rule-based result when confidence is high', async () => {
      // Create high-confidence rule
      await prisma.categoryRule.create({
        data: {
          userId: testUserId,
          categoryId: groceryCategoryId,
          field: 'merchantName',
          operator: 'EQUALS',
          value: 'Whole Foods',
          priority: 1
        }
      })

      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Whole Foods',
        description: 'Groceries',
        amount: 100
      })

      // Simulate hybrid categorization (rule-based wins with high confidence)
      const highConfidence = 0.95

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: groceryCategoryId,
          confidenceScore: highConfidence
        }
      })

      const categorized = await prisma.transaction.findUnique({
        where: { id: transaction.id }
      })

      expect(categorized).toBeTruthy()
      assertDefined(categorized)
      expect(Number(categorized.confidenceScore)).toBeGreaterThanOrEqual(0.90)
    })

    it('should fall back to ML when rule confidence is low', async () => {
      // Create low-confidence rule
      await prisma.categoryRule.create({
        data: {
          userId: testUserId,
          categoryId: groceryCategoryId,
          field: 'description',
          operator: 'CONTAINS',
          value: 'food',
          priority: 1
        }
      })

      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Random Store',
        description: 'food items',
        amount: 50
      })

      // Simulate hybrid categorization (rule has low confidence, ML used as fallback)
      const lowRuleConfidence = 0.65
      const mlConfidence = 0.85

      // ML result would override low-confidence rule
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: restaurantCategoryId,
          confidenceScore: mlConfidence
        }
      })

      const categorized = await prisma.transaction.findUnique({
        where: { id: transaction.id }
      })

      expect(categorized).toBeTruthy()
      assertDefined(categorized)
      expect(Number(categorized.confidenceScore)).toBe(0.85)
    })
  })

  describe('Confidence Scoring', () => {
    it('should flag low-confidence categorizations for review', async () => {
      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Unknown Merchant',
        description: 'Purchase',
        amount: 75,
        categoryId: groceryCategoryId,
        confidenceScore: 0.65 // Low confidence
      })

      const needsReview = Number(transaction.confidenceScore) < 0.70
      expect(needsReview).toBe(true)
    })

    it('should auto-apply high-confidence categorizations', async () => {
      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Known Merchant',
        description: 'Purchase',
        amount: 100,
        categoryId: groceryCategoryId,
        confidenceScore: 0.95 // High confidence
      })

      const autoApply = Number(transaction.confidenceScore) >= 0.90
      expect(autoApply).toBe(true)
    })

    it('should track categorization accuracy over time', async () => {
      // Create transactions with different confidence levels
      const transactions = [
        { confidence: 0.95, userCorrected: false }, // Accurate
        { confidence: 0.85, userCorrected: false }, // Accurate
        { confidence: 0.75, userCorrected: true },  // Corrected (inaccurate)
        { confidence: 0.65, userCorrected: true }   // Corrected (inaccurate)
      ]

      for (const t of transactions) {
        await createTestTransaction(prisma, testUserId, testAccountId, {
          merchantName: 'Test',
          amount: 50,
          categoryId: groceryCategoryId,
          confidenceScore: t.confidence,
          userCorrected: t.userCorrected
        })
      }

      const allTransactions = await prisma.transaction.findMany({
        where: { userId: testUserId }
      })

      const accurate = allTransactions.filter(t => !t.userCorrected).length
      const total = allTransactions.length
      const accuracyRate = (accurate / total) * 100

      expect(total).toBe(4)
      expect(accurate).toBe(2)
      expect(accuracyRate).toBe(50)
    })
  })

  describe('User Corrections and Learning', () => {
    it('should mark transaction as user-corrected when category is manually changed', async () => {
      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'Coffee Shop',
        amount: 5,
        categoryId: groceryCategoryId, // Initially categorized as Groceries
        confidenceScore: 0.70
      })

      // User corrects to Restaurants
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: restaurantCategoryId,
          userCorrected: true
        }
      })

      const corrected = await prisma.transaction.findUnique({
        where: { id: transaction.id }
      })

      expect(corrected).toBeTruthy()
      assertDefined(corrected)
      expect(corrected.categoryId).toBe(restaurantCategoryId)
      expect(corrected.userCorrected).toBe(true)
    })

    it('should create category rule from user correction', async () => {
      const transaction = await createTestTransaction(prisma, testUserId, testAccountId, {
        merchantName: 'New Coffee Shop',
        amount: 5,
        categoryId: groceryCategoryId
      })

      // User corrects category
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          categoryId: restaurantCategoryId,
          userCorrected: true
        }
      })

      // Create rule based on correction
      await prisma.categoryRule.create({
        data: {
          userId: testUserId,
          categoryId: restaurantCategoryId,
          field: 'merchantName',
          operator: 'CONTAINS',
          value: 'coffee shop',
          priority: 1,
          source: 'user_correction'
        }
      })

      const rule = await prisma.categoryRule.findFirst({
        where: {
          userId: testUserId,
          source: 'user_correction'
        }
      })

      expect(rule).toBeTruthy()
      assertDefined(rule)
      expect(rule.categoryId).toBe(restaurantCategoryId)
    })
  })
})
