import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { createMockRequest, mockSession, parseJsonResponse } from '@/test/api-helpers'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    budget: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/validation', () => ({
  getBudgetsQuerySchema: {},
  validateQueryParams: vi.fn((_, searchParams) => ({
    success: true,
    data: {
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      type: searchParams.get('type'),
      period: searchParams.get('period'),
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    },
  })),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/budgets')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return budgets for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockBudgets = [
      {
        id: 'budget-1',
        userId: mockSession.user.id,
        name: 'Monthly Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: null,
        totalAmount: 3000,
        isActive: true,
        rollover: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [
          {
            id: 'bc-1',
            budgetId: 'budget-1',
            categoryId: 'cat-1',
            amount: 500,
            spent: 200,
            category: {
              id: 'cat-1',
              name: 'Food & Drink',
              slug: 'food-and-drink',
              color: '#F59E0B',
              icon: 'utensils',
            },
          },
        ],
        _count: {
          categories: 1,
        },
      },
    ]

    vi.mocked(prisma.budget.findMany).mockResolvedValue(mockBudgets)

    const request = createMockRequest('/api/budgets')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Monthly Budget')
    expect(data[0].categories).toHaveLength(1)

    // Verify query structure
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: { userId: mockSession.user.id },
      orderBy: { name: 'asc' },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true,
              },
            },
          },
        },
        _count: {
          select: { categories: true },
        },
      },
    })
  })

  it('should filter budgets by active status', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])

    const request = createMockRequest('/api/budgets', {
      searchParams: { active: 'true' },
    })
    await GET(request)

    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockSession.user.id,
          isActive: true,
        }),
      })
    )
  })

  it('should filter budgets by type', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])

    const request = createMockRequest('/api/budgets', {
      searchParams: { type: 'FIXED_AMOUNT' },
    })
    await GET(request)

    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'FIXED_AMOUNT',
        }),
      })
    )
  })

  it('should return 500 if database query fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.budget.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/budgets')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch budgets')
  })
})

describe('POST /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'Test Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        categories: [{ categoryId: 'cat-1', amount: 500 }],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'Test Budget',
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('type is required')
  })

  it('should return 400 if no categories provided', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'Test Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        categories: [],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('At least one budget category is required')
  })

  it('should return 400 if invalid budget type', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'Test Budget',
        type: 'INVALID_TYPE',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        categories: [{ categoryId: 'cat-1', amount: 500 }],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid budget type')
  })

  it('should return 400 if categories do not exist', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.category.findMany).mockResolvedValue([])

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'Test Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        categories: [{ categoryId: 'cat-invalid', amount: 500 }],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('One or more categories do not exist')
  })

  it('should create budget and return 201', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Food & Drink',
        slug: 'food-and-drink',
        icon: 'utensils',
        color: '#F59E0B',
        description: 'Food',
        parentId: null,
        isSystemCategory: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    vi.mocked(prisma.budget.updateMany).mockResolvedValue({ count: 0 })

    const mockBudget = {
      id: 'budget-new',
      userId: mockSession.user.id,
      name: 'New Budget',
      type: 'FIXED_AMOUNT',
      period: 'MONTHLY',
      startDate: new Date('2024-01-01'),
      endDate: null,
      totalAmount: 3000,
      isActive: true,
      rollover: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      categories: [
        {
          id: 'bc-1',
          budgetId: 'budget-new',
          categoryId: 'cat-1',
          amount: 500,
          spent: 0,
          category: {
            id: 'cat-1',
            name: 'Food & Drink',
            slug: 'food-and-drink',
            color: '#F59E0B',
            icon: 'utensils',
          },
        },
      ],
    }

    vi.mocked(prisma.budget.create).mockResolvedValue(mockBudget)

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'New Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        isActive: true,
        categories: [{ categoryId: 'cat-1', amount: 500 }],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(201)
    expect(data.id).toBe('budget-new')
    expect(data.name).toBe('New Budget')
    expect(data.categories).toHaveLength(1)

    // Verify other active budgets were deactivated
    expect(prisma.budget.updateMany).toHaveBeenCalledWith({
      where: { userId: mockSession.user.id, isActive: true },
      data: { isActive: false },
    })
  })

  it('should return 500 if database create fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Food & Drink',
        slug: 'food-and-drink',
        icon: 'utensils',
        color: '#F59E0B',
        description: 'Food',
        parentId: null,
        isSystemCategory: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    vi.mocked(prisma.budget.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.budget.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/budgets', {
      method: 'POST',
      body: {
        name: 'New Budget',
        type: 'FIXED_AMOUNT',
        period: 'MONTHLY',
        startDate: '2024-01-01',
        totalAmount: 3000,
        categories: [{ categoryId: 'cat-1', amount: 500 }],
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create budget')
  })
})
