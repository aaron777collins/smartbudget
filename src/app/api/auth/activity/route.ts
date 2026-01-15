import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { updateLastActivity, getSessionStatus } from "@/lib/session-manager"

/**
 * POST /api/auth/activity
 *
 * Updates the user's last activity timestamp to extend their session.
 * Called by the client-side useSessionTimeout hook to track user activity.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Update the last activity timestamp
    await updateLastActivity(session.user.id)

    // Return the current session status
    const status = await getSessionStatus(session.user.id)

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/activity
 *
 * Returns the current session status without updating activity.
 * Useful for checking session state without extending it.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the current session status without updating activity
    const status = await getSessionStatus(session.user.id)

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error getting session status:", error)
    return NextResponse.json(
      { error: "Failed to get session status" },
      { status: 500 }
    )
  }
}
