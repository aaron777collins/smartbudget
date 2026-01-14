import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { createMockRequest, mockSession, parseJsonResponse } from '@/test/api-helpers'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/categories')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return categories for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Food & Drink',
        slug: 'food-and-drink',
        icon: 'utensils',
        color: '#F59E0B',
        description: 'Restaurants, groceries, coffee',
        parentId: null,
        isSystemCategory: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Transportation',
        slug: 'transportation',
        icon: 'car',
        color: '#6366F1',
        description: 'Gas, parking, transit',
        parentId: null,
        isSystemCategory: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories)

    const request = createMockRequest('/api/categories')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Food & Drink')
    expect(data[1].name).toBe('Transportation')

    // Verify query structure
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { isSystemCategory: true, userId: null },
          { userId: mockSession.user.id },
        ],
        parentId: null,
      },
      orderBy: {
        name: 'asc',
      },
    })
  })

  it('should return 500 if database query fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.category.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/categories')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch categories')
  })

  it('should include both system and user custom categories', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Food & Drink',
        slug: 'food-and-drink',
        icon: 'utensils',
        color: '#F59E0B',
        description: 'System category',
        parentId: null,
        isSystemCategory: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-custom',
        name: 'Custom Category',
        slug: 'custom-category',
        icon: 'star',
        color: '#000000',
        description: 'User custom category',
        parentId: null,
        isSystemCategory: false,
        userId: mockSession.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories)

    const request = createMockRequest('/api/categories')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data.some((c: any) => c.isSystemCategory)).toBe(true)
    expect(data.some((c: any) => !c.isSystemCategory)).toBe(true)
  })
})
