import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { createMockRequest, mockSession, parseJsonResponse } from '@/test/api-helpers'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/validation', () => ({
  getAccountsQuerySchema: {},
  createAccountSchema: {
    safeParse: vi.fn(),
  },
  validateQueryParams: vi.fn((_, searchParams) => ({
    success: true,
    data: {
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    },
  })),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAccountSchema } from '@/lib/validation'

describe('GET /api/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/accounts')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return accounts for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockAccounts = [
      {
        id: 'acc-1',
        userId: mockSession.user.id,
        name: 'Checking Account',
        institution: 'Bank of Test',
        accountNumber: '****1234',
        type: 'CHECKING',
        balance: 1000.00,
        currency: 'USD',
        color: '#3B82F6',
        icon: 'building-columns',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          transactions: 50,
        },
      },
      {
        id: 'acc-2',
        userId: mockSession.user.id,
        name: 'Savings Account',
        institution: 'Bank of Test',
        accountNumber: '****5678',
        type: 'SAVINGS',
        balance: 5000.00,
        currency: 'USD',
        color: '#10B981',
        icon: 'piggy-bank',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          transactions: 10,
        },
      },
    ]

    vi.mocked(prisma.account.findMany).mockResolvedValue(mockAccounts)

    const request = createMockRequest('/api/accounts')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Checking Account')
    expect(data[1].name).toBe('Savings Account')

    // Verify query structure
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { userId: mockSession.user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })
  })

  it('should filter accounts by active status', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findMany).mockResolvedValue([])

    const request = createMockRequest('/api/accounts', {
      searchParams: { active: 'true' },
    })
    await GET(request)

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockSession.user.id,
          isActive: true,
        }),
      })
    )
  })

  it('should filter accounts by search term', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findMany).mockResolvedValue([])

    const request = createMockRequest('/api/accounts', {
      searchParams: { search: 'checking' },
    })
    await GET(request)

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'checking', mode: 'insensitive' } },
            { institution: { contains: 'checking', mode: 'insensitive' } },
          ]),
        }),
      })
    )
  })

  it('should return 500 if database query fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.account.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/accounts')
    const response = await GET(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch accounts')
  })
})

describe('POST /api/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/accounts', {
      method: 'POST',
      body: {
        name: 'Test Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        currentBalance: 1000,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if validation fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(createAccountSchema.safeParse).mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          fieldErrors: { name: ['Name is required'] },
          formErrors: [],
        }),
      },
    } as any)

    const request = createMockRequest('/api/accounts', {
      method: 'POST',
      body: {
        institution: 'Test Bank',
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should return 409 if duplicate account exists', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(createAccountSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        name: 'Test Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        accountNumber: '1234',
        currentBalance: 1000,
        isActive: true,
      },
    } as any)

    vi.mocked(prisma.account.findFirst).mockResolvedValue({
      id: 'existing-acc',
      userId: mockSession.user.id,
      name: 'Test Account',
      institution: 'Test Bank',
      accountNumber: '1234',
      type: 'CHECKING',
      balance: 1000,
      currency: 'USD',
      color: '#3B82F6',
      icon: 'building-columns',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest('/api/accounts', {
      method: 'POST',
      body: {
        name: 'Test Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        accountNumber: '1234',
        currentBalance: 1000,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(409)
    expect(data.error).toContain('already exists')
  })

  it('should create account and return 201', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(createAccountSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        name: 'New Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        accountNumber: '1234',
        currentBalance: 1000,
        color: '#3B82F6',
        icon: 'building-columns',
        isActive: true,
      },
    } as any)

    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)

    const mockAccount = {
      id: 'acc-new',
      userId: mockSession.user.id,
      name: 'New Account',
      institution: 'Test Bank',
      accountNumber: '1234',
      type: 'CHECKING',
      balance: 1000,
      currency: 'CAD',
      color: '#3B82F6',
      icon: 'building-columns',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.account.create).mockResolvedValue(mockAccount)

    const request = createMockRequest('/api/accounts', {
      method: 'POST',
      body: {
        name: 'New Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        accountNumber: '1234',
        currentBalance: 1000,
        color: '#3B82F6',
        icon: 'building-columns',
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(201)
    expect(data.id).toBe('acc-new')
    expect(data.name).toBe('New Account')
    expect(data.currency).toBe('CAD')
  })

  it('should return 500 if database create fails', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(createAccountSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        name: 'New Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        currentBalance: 1000,
        isActive: true,
      },
    } as any)

    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.account.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('/api/accounts', {
      method: 'POST',
      body: {
        name: 'New Account',
        institution: 'Test Bank',
        accountType: 'CHECKING',
        currentBalance: 1000,
      },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create account')
  })
})
