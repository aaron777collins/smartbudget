import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withAuth, withAdmin, withMiddleware } from './api-middleware'
import { createMockRequest, mockSession, parseJsonResponse } from '@/test/api-helpers'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

describe('withAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const handler = vi.fn()
    const wrappedHandler = withAuth(handler)

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should call handler if user is authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockResponse = NextResponse.json({ success: true })
    const handler = vi.fn().mockResolvedValue(mockResponse)
    const wrappedHandler = withAuth(handler)

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        userId: mockSession.user.id,
        userEmail: mockSession.user.email,
      })
    )
    expect(response.status).toBe(200)
  })

  it('should return 500 if handler throws error', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)

    const handler = vi.fn().mockRejectedValue(new Error('Handler error'))
    const wrappedHandler = withAuth(handler)

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})

describe('withAdmin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const handler = vi.fn()
    const wrappedHandler = withAdmin(handler)

    const request = createMockRequest('/api/admin/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should return 403 if user is not an admin', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockSession.user.id,
      email: mockSession.user.email,
      name: mockSession.user.name,
      emailVerified: null,
      image: null,
      role: 'USER', // Not an admin
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const handler = vi.fn()
    const wrappedHandler = withAdmin(handler)

    const request = createMockRequest('/api/admin/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(403)
    expect(data.error).toBe('Admin access required')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should call handler if user is an admin', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockSession.user.id,
      email: mockSession.user.email,
      name: mockSession.user.name,
      emailVerified: null,
      image: null,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const mockResponse = NextResponse.json({ success: true })
    const handler = vi.fn().mockResolvedValue(mockResponse)
    const wrappedHandler = withAdmin(handler)

    const request = createMockRequest('/api/admin/test')
    const response = await wrappedHandler(request)

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        userId: mockSession.user.id,
        userEmail: mockSession.user.email,
      })
    )
    expect(response.status).toBe(200)
  })
})

describe('withMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should apply authentication when requireAuth is true', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const handler = vi.fn()
    const wrappedHandler = withMiddleware(handler, { requireAuth: true })

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should apply admin check when requireAdmin is true', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockSession.user.id,
      email: mockSession.user.email,
      name: mockSession.user.name,
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const handler = vi.fn()
    const wrappedHandler = withMiddleware(handler, { requireAuth: true, requireAdmin: true })

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(403)
    expect(data.error).toBe('Admin access required')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should skip middleware when no options are set', async () => {
    const mockResponse = NextResponse.json({ success: true })
    const handler = vi.fn().mockResolvedValue(mockResponse)
    const wrappedHandler = withMiddleware(handler, {})

    const request = createMockRequest('/api/test')
    const response = await wrappedHandler(request)

    expect(handler).toHaveBeenCalledWith(request, {})
    expect(response.status).toBe(200)
  })
})
