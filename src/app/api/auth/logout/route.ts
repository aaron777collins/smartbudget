import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { clearSession } from '@/lib/session-manager'
import { logLogout } from '@/lib/audit-logger'
import { revokeAllUserTokens } from '@/lib/refresh-token'

/**
 * POST /api/auth/logout
 *
 * Clears session data on logout and revokes all refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Extract request context
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Clear session tracking data
    await clearSession(session.user.id)

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(session.user.id, 'logout')

    // Log the logout event
    await logLogout(session.user.id, {
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
