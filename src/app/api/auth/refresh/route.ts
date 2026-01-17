/**
 * Refresh Token API Endpoint
 *
 * POST /api/auth/refresh
 *
 * Refreshes an expired access token using a valid refresh token.
 * Implements automatic token rotation for enhanced security.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateRefreshToken,
  rotateRefreshToken,
  revokeTokenFamily,
  REFRESH_TOKEN_CONFIG,
} from '@/lib/refresh-token';
import { logSecurityEvent } from '@/lib/audit-logger';
import { signJWT } from '@/lib/jwt-utils';

// ============================================================================
// TYPES
// ============================================================================

interface RefreshRequestBody {
  refreshToken: string;
}

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
// POST /api/auth/refresh
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as RefreshRequestBody;
    const { refreshToken } = body;

    // Validate input
    if (!refreshToken || typeof refreshToken !== 'string') {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Extract request context
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);
    const context = { ipAddress, userAgent };

    // Validate the refresh token
    const validation = await validateRefreshToken(refreshToken);

    if (!validation.valid) {
      // Handle different validation failure reasons
      if (validation.reason === 'theft_detected') {
        // CRITICAL: Token theft detected!
        // Token family already revoked by validateRefreshToken
        await logSecurityEvent({
          userId: validation.userId,
          eventType: 'SUSPICIOUS_ACTIVITY',
          severity: 'CRITICAL',
          description: 'Refresh token theft detected in /api/auth/refresh',
          success: false,
          failureReason: 'Revoked token reused',
          metadata: {
            tokenId: validation.tokenId,
          },
          context: { ipAddress, userAgent },
        });

        return NextResponse.json(
          {
            error: 'Invalid refresh token',
            message: 'Your session has been terminated for security reasons. Please sign in again.',
          },
          { status: 401 }
        );
      }

      if (validation.reason === 'expired') {
        // Token expired - user needs to re-authenticate
        await logSecurityEvent({
          userId: validation.userId,
          eventType: 'SESSION_EXPIRED',
          severity: 'INFO',
          description: 'Refresh token expired',
          success: false,
          failureReason: 'Token expired',
          metadata: {
            tokenId: validation.tokenId,
          },
          context: { ipAddress, userAgent },
        });

        return NextResponse.json(
          {
            error: 'Refresh token expired',
            message: 'Your session has expired. Please sign in again.',
          },
          { status: 401 }
        );
      }

      // Token not found or other error
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'MEDIUM',
        description: 'Invalid refresh token provided',
        success: false,
        failureReason: validation.reason || 'unknown',
        context: { ipAddress, userAgent },
      });

      return NextResponse.json(
        {
          error: 'Invalid refresh token',
          message: 'Please sign in again.',
        },
        { status: 401 }
      );
    }

    // Token is valid - rotate it!
    const newRefreshToken = await rotateRefreshToken(refreshToken, context);

    if (!newRefreshToken) {
      // Failed to rotate token
      await logSecurityEvent({
        userId: validation.userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: 'Failed to rotate refresh token',
        success: false,
        failureReason: 'Token rotation failed',
        context: { ipAddress, userAgent },
      });

      return NextResponse.json(
        { error: 'Failed to refresh token. Please sign in again.' },
        { status: 500 }
      );
    }

    // Generate new access token (JWT)
    const accessToken = await signJWT({
      userId: validation.userId!,
    });

    // Log successful refresh
    await logSecurityEvent({
      userId: validation.userId,
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      description: 'Access token refreshed successfully',
      success: true,
      metadata: {
        oldTokenId: validation.tokenId,
        newTokenId: newRefreshToken.id,
        tokenFamily: newRefreshToken.tokenFamily,
      },
      context: { ipAddress, userAgent },
    });

    // Return new tokens
    return NextResponse.json(
      {
        accessToken,
        refreshToken: newRefreshToken.token, // New refresh token
        expiresAt: newRefreshToken.expiresAt.toISOString(),
        message: 'Token refreshed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/auth/refresh:', error);

    // Log error
    await logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      description: 'Error during token refresh',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { error: 'An error occurred while refreshing your token' },
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
