import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { createMockRequest, mockSession, parseJsonResponse } from '@/test/api-helpers'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis-cache', () => ({
  invalidateDashboardCache: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
  getTransactionsQuerySchema: {},
  validateQueryParams: vi.fn((_, searchParams) => {
    // Simple mock validation
    return {
      success: true,
      data: {
        accountId: searchParams.get('accountId'),
        categoryId: searchParams.get('categoryId'),
        subcategoryId: searchParams.get('subcategoryId'),
        type: searchParams.get('type'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
        maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
        search: searchParams.get('search'),
        tags: searchParams.get('tags'),
        excludeTags: searchParams.get('excludeTags'),
        uncategorizedOnly: searchParams.get('uncategorizedOnly') === 'true',
        sortBy: searchParams.get('sortBy') || 'date',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
      },
    }
  }),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { invalidateDashboardCache } from '@/lib/redis-cache'

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/transactions')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return paginated transactions for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockTransactions = [
      {
        id: 'txn-1',
        userId: mockSession.user.id,
        accountId: 'acc-1',
        date: new Date('2024-01-15'),
        description: 'Grocery Store',
        merchantName: 'Grocery Store',
        amount: -50.00,
        type: 'DEBIT',
        categoryId: 'cat-1',
        subcategoryId: null,
        notes: null,
        isReconciled: false,
        isRecurring: false,
        userCorrected: false,
        account: {
          id: 'acc-1',
          name: 'Checking',
          institution: 'Bank',
          color: '#3B82F6',
          icon: 'building-columns',
        },
        category: {
          id: 'cat-1',
          name: 'Food & Drink',
          slug: 'food-and-drink',
          icon: 'utensils',
          color: '#F59E0B',
        },
        subcategory: null,
        tags: [],
      },
    ]

    vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions)
    vi.mocked(prisma.transaction.count).mockResolvedValue(1)

    const request = createMockRequest('/api/transactions')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data.transactions).toHaveLength(1)
    expect(data.total).toBe(1)
    expect(data.limit).toBe(50)
    expect(data.offset).toBe(0)
    expect(data.hasMore).toBe(false)
  })

  it('should filter transactions by accountId', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.count).mockResolvedValue(0)

    const request = createMockRequest('/api/transactions', {
      searchParams: { accountId: 'acc-1' },
    })
    await GET(request)

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockSession.user.id,
          accountId: 'acc-1',
        }),
      })
    )
  })

  it('should filter transactions by date range', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.count).mockResolvedValue(0)

    const request = createMockRequest('/api/transactions', {
      searchParams: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
    })
    await GET(request)

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        }),
      })
    )
  })

  it('should filter transactions by search term', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.count).mockResolvedValue(0)

    const request = createMockRequest('/api/transactions', {
      searchParams: { search: 'grocery' },
    })
    await GET(request)

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { description: { contains: 'grocery', mode: 'insensitive' } },
            { merchantName: { contains: 'grocery', mode: 'insensitive' } },
            { notes: { contains: 'grocery', mode: 'insensitive' } },
          ]),
        }),
      })
    )
  })

  it('should return 500 if database query fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.transaction.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/transactions')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch transactions')
  })
})

describe('POST /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: {
        accountId: 'acc-1',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Test Transaction',
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 404 if account does not belong to user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)

    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: {
        accountId: 'acc-1',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(404)
    expect(data.error).toBe('Account not found')
  })

  it('should create transaction and return 201', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findFirst).mockResolvedValue({
      id: 'acc-1',
      userId: mockSession.user.id,
      name: 'Checking',
      institution: 'Bank',
      accountNumber: '****1234',
      type: 'CHECKING',
      balance: 1000,
      currency: 'USD',
      color: '#3B82F6',
      icon: 'building-columns',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const mockTransaction = {
      id: 'txn-1',
      userId: mockSession.user.id,
      accountId: 'acc-1',
      date: new Date('2024-01-15'),
      postedDate: null,
      description: 'Test Transaction',
      merchantName: 'Test Transaction',
      amount: -50.00,
      type: 'DEBIT',
      categoryId: null,
      subcategoryId: null,
      notes: null,
      isReconciled: false,
      isRecurring: false,
      userCorrected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      account: {
        id: 'acc-1',
        name: 'Checking',
        institution: 'Bank',
        color: '#3B82F6',
        icon: 'building-columns',
      },
      category: null,
      subcategory: null,
    }

    vi.mocked(prisma.transaction.create).mockResolvedValue(mockTransaction)

    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: {
        accountId: 'acc-1',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(201)
    expect(data.id).toBe('txn-1')
    expect(data.description).toBe('Test Transaction')
    expect(data.amount).toBe(-50.00)
    expect(invalidateDashboardCache).toHaveBeenCalledWith(mockSession.user.id)
  })

  it('should return 500 if database create fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findFirst).mockResolvedValue({
      id: 'acc-1',
      userId: mockSession.user.id,
      name: 'Checking',
      institution: 'Bank',
      accountNumber: '****1234',
      type: 'CHECKING',
      balance: 1000,
      currency: 'USD',
      color: '#3B82F6',
      icon: 'building-columns',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.transaction.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: {
        accountId: 'acc-1',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create transaction')
  })
})
