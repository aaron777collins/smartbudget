import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { clearSession } from '@/lib/session-manager'
import { logLogout } from '@/lib/audit-logger'

/**
 * POST /api/auth/logout
 *
 * Clears session data on logout
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Clear session tracking data
    await clearSession(session.user.id)

    // Log the logout event
    await logLogout(session.user.id, {
      ipAddress: 'unknown',
      userAgent: 'unknown',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
