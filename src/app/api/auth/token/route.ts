/**
 * Token Generation API Endpoint
 *
 * POST /api/auth/token
 *
 * Generates refresh token after successful NextAuth authentication.
 * This endpoint should be called after NextAuth sign-in to obtain a refresh token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRefreshToken } from '@/lib/refresh-token';
import { logSecurityEvent } from '@/lib/audit-logger';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Extracts user agent from request
 */
function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

// ============================================================================
// POST /api/auth/token
// ============================================================================

/**
 * Generates a refresh token for the authenticated user
 * Called after successful NextAuth sign-in
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    // Extract request context
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);
    const context = { ipAddress, userAgent };

    // Create refresh token
    const refreshToken = await createRefreshToken(session.user.id, context);

    // Log token creation
    await logSecurityEvent({
      userId: session.user.id,
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      description: 'Refresh token generated via /api/auth/token',
      ipAddress,
      userAgent,
      success: true,
      metadata: {
        tokenId: refreshToken.id,
        tokenFamily: refreshToken.tokenFamily,
        expiresAt: refreshToken.expiresAt.toISOString(),
      },
    });

    // Return refresh token
    return NextResponse.json(
      {
        refreshToken: refreshToken.token,
        expiresAt: refreshToken.expiresAt.toISOString(),
        message: 'Refresh token created successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/auth/token:', error);

    // Log error
    await logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      description: 'Error during refresh token generation',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { error: 'Failed to generate refresh token' },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS (CORS preflight)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
