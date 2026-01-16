import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
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

vi.mock('@/lib/job-queue', () => ({
  processPendingJobs: vi.fn(),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { processPendingJobs } from '@/lib/job-queue'

describe('POST /api/jobs/process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
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

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(403)
    expect(data.error).toBe('Admin access required')
  })

  it('should process jobs for admin user with default limit', async () => {
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
    vi.mocked(processPendingJobs).mockResolvedValue(undefined)

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('5 pending jobs')
    expect(data.processedBy).toBe(mockSession.user.email)
    expect(processPendingJobs).toHaveBeenCalledWith(5)
  })

  it('should process jobs with custom limit', async () => {
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
    vi.mocked(processPendingJobs).mockResolvedValue(undefined)

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
      body: { limit: 10 },
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('10 pending jobs')
    expect(processPendingJobs).toHaveBeenCalledWith(10)
  })

  it('should return 400 if limit is invalid', async () => {
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

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
      body: { limit: 150 }, // Exceeds max of 100
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request parameters')
  })

  it('should return 500 if job processing fails', async () => {
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
    vi.mocked(processPendingJobs).mockRejectedValue(new Error('Job processing failed'))

    const request = createMockRequest('/api/jobs/process', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await parseJsonResponse(response)

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process jobs')
    expect(data.details).toBe('Job processing failed')
  })
})
