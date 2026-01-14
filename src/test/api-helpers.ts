/**
 * API Testing Helpers
 * Utilities for testing Next.js API routes
 */

import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body, searchParams } = options

  const urlObj = new URL(url, 'http://localhost:3000')

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit)
}

/**
 * Mock authentication session
 */
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

/**
 * Mock unauthenticated session
 */
export const mockUnauthenticatedSession = null

/**
 * Parse JSON response from NextResponse
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
