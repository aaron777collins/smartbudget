/**
 * Refresh Token Management Library
 *
 * Provides secure JWT refresh token functionality with rotation,
 * theft detection, and comprehensive security features.
 */

import { prisma } from './prisma';
import crypto from 'crypto';
import { logSecurityEvent } from './audit-logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const REFRESH_TOKEN_CONFIG = {
  // Refresh token lifetime: 7 days (in milliseconds)
  EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000,

  // Maximum refresh tokens per user (prevents accumulation)
  MAX_TOKENS_PER_USER: 5,

  // Token length in bytes (will be hex encoded, so 64 bytes = 128 char string)
  TOKEN_LENGTH_BYTES: 64,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface RefreshTokenData {
  id: string;
  token: string; // Raw token (unhashed) - only returned on creation
  tokenFamily: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenValidationResult {
  valid: boolean;
  userId?: string;
  tokenId?: string;
  reason?: 'expired' | 'revoked' | 'not_found' | 'theft_detected';
}

export interface RefreshTokenContext {
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generates a cryptographically secure random token
 * @returns Hex-encoded random token string
 */
function generateSecureToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_CONFIG.TOKEN_LENGTH_BYTES).toString('hex');
}

/**
 * Generates a unique token family identifier
 * Used for detecting token theft through rotation tracking
 * @returns UUID-style family identifier
 */
function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/**
 * Hashes a refresh token for secure storage
 * @param token Raw token string
 * @returns SHA-256 hash of the token
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// TOKEN CREATION
// ============================================================================

/**
 * Creates a new refresh token for a user
 *
 * @param userId User ID to create token for
 * @param context Request context (IP address, user agent)
 * @returns Token data with raw token (only time it's available unhashed)
 */
export async function createRefreshToken(
  userId: string,
  context: RefreshTokenContext = {}
): Promise<RefreshTokenData> {
  // Generate raw token and hash it
  const rawToken = generateSecureToken();
  const hashedToken = hashToken(rawToken);
  const tokenFamily = generateTokenFamily();

  // Calculate expiration
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_CONFIG.EXPIRATION_MS);

  // Clean up old tokens if user has too many
  await cleanupOldTokens(userId);

  // Store hashed token in database
  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId,
      token: hashedToken,
      tokenFamily,
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });

  // Log token creation
  await logSecurityEvent({
    userId,
    eventType: 'LOGIN_SUCCESS',
    severity: 'INFO',
    description: 'Refresh token created',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    success: true,
    metadata: {
      tokenId: refreshToken.id,
      tokenFamily,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // Return token data with RAW token (only time it's available)
  return {
    id: refreshToken.id,
    token: rawToken, // RAW token - must be sent to client immediately
    tokenFamily,
    userId,
    expiresAt,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  };
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validates a refresh token and checks for theft detection
 *
 * This implements automatic token rotation with theft detection:
 * - If valid token used: Return success
 * - If expired token used: Return expired
 * - If revoked token used: Check for theft (someone reused old token)
 * - If not found: Return not_found
 *
 * @param rawToken Raw token from client
 * @returns Validation result with userId if valid
 */
export async function validateRefreshToken(
  rawToken: string
): Promise<RefreshTokenValidationResult> {
  const hashedToken = hashToken(rawToken);

  // Find the token in database
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  // Token doesn't exist
  if (!tokenRecord) {
    return {
      valid: false,
      reason: 'not_found',
    };
  }

  // Check if token is revoked (THEFT DETECTION)
  if (tokenRecord.isRevoked) {
    // Someone is trying to use a revoked token!
    // This could indicate token theft - revoke entire token family
    await revokeTokenFamily(tokenRecord.tokenFamily, 'token_theft');

    // Log critical security event
    await logSecurityEvent({
      userId: tokenRecord.userId,
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'CRITICAL',
      description: 'Attempted reuse of revoked refresh token - possible token theft',
      success: false,
      failureReason: 'Revoked token reused',
      metadata: {
        tokenId: tokenRecord.id,
        tokenFamily: tokenRecord.tokenFamily,
        revokedAt: tokenRecord.revokedAt,
        revokedReason: tokenRecord.revokedReason,
      },
    });

    return {
      valid: false,
      userId: tokenRecord.userId,
      reason: 'theft_detected',
    };
  }

  // Check if token is expired
  if (tokenRecord.expiresAt < new Date()) {
    return {
      valid: false,
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      reason: 'expired',
    };
  }

  // Token is valid!
  // Update last used timestamp
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    userId: tokenRecord.userId,
    tokenId: tokenRecord.id,
  };
}

// ============================================================================
// TOKEN ROTATION
// ============================================================================

/**
 * Rotates a refresh token (creates new token, revokes old one)
 *
 * This is used when refreshing an access token. The old refresh token
 * is revoked and a new one is issued in the same token family.
 *
 * @param oldToken Old refresh token to rotate
 * @param context Request context
 * @returns New refresh token data
 */
export async function rotateRefreshToken(
  oldToken: string,
  context: RefreshTokenContext = {}
): Promise<RefreshTokenData | null> {
  const hashedOldToken = hashToken(oldToken);

  // Find the old token
  const oldTokenRecord = await prisma.refreshToken.findUnique({
    where: { token: hashedOldToken },
  });

  if (!oldTokenRecord) {
    return null;
  }

  // Revoke the old token
  await prisma.refreshToken.update({
    where: { id: oldTokenRecord.id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: 'rotation',
    },
  });

  // Create new token in same family
  const rawNewToken = generateSecureToken();
  const hashedNewToken = hashToken(rawNewToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_CONFIG.EXPIRATION_MS);

  const newTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: oldTokenRecord.userId,
      token: hashedNewToken,
      tokenFamily: oldTokenRecord.tokenFamily, // Same family!
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });

  // Log rotation
  await logSecurityEvent({
    userId: oldTokenRecord.userId,
    eventType: 'LOGIN_SUCCESS',
    severity: 'INFO',
    description: 'Refresh token rotated',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    success: true,
    metadata: {
      oldTokenId: oldTokenRecord.id,
      newTokenId: newTokenRecord.id,
      tokenFamily: oldTokenRecord.tokenFamily,
    },
  });

  return {
    id: newTokenRecord.id,
    token: rawNewToken, // RAW token
    tokenFamily: oldTokenRecord.tokenFamily,
    userId: oldTokenRecord.userId,
    expiresAt,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  };
}

// ============================================================================
// TOKEN REVOCATION
// ============================================================================

/**
 * Revokes a specific refresh token
 * @param tokenId Token ID to revoke
 * @param reason Reason for revocation
 */
export async function revokeRefreshToken(
  tokenId: string,
  reason: string = 'manual_revocation'
): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

/**
 * Revokes all refresh tokens for a user
 * Used when user logs out from all devices or changes password
 *
 * @param userId User ID
 * @param reason Reason for revocation
 */
export async function revokeAllUserTokens(
  userId: string,
  reason: string = 'logout_all'
): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  // Log mass revocation
  await logSecurityEvent({
    userId,
    eventType: 'LOGOUT',
    severity: 'INFO',
    description: `All refresh tokens revoked: ${reason}`,
    success: true,
    metadata: { reason },
  });
}

/**
 * Revokes all tokens in a token family
 * Used when token theft is detected
 *
 * @param tokenFamily Token family to revoke
 * @param reason Reason for revocation
 */
export async function revokeTokenFamily(
  tokenFamily: string,
  reason: string = 'token_theft'
): Promise<void> {
  const tokens = await prisma.refreshToken.findMany({
    where: { tokenFamily, isRevoked: false },
  });

  if (tokens.length === 0) return;

  await prisma.refreshToken.updateMany({
    where: {
      tokenFamily,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  // Log family revocation with critical severity
  const userId = tokens[0]?.userId;
  if (userId) {
    await logSecurityEvent({
      userId,
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'CRITICAL',
      description: `Token family revoked due to ${reason}`,
      success: true,
      metadata: {
        tokenFamily,
        reason,
        tokensRevoked: tokens.length,
      },
    });
  }
}

// ============================================================================
// TOKEN CLEANUP
// ============================================================================

/**
 * Removes old tokens if user has too many
 * Keeps only the most recent tokens
 *
 * @param userId User ID
 */
async function cleanupOldTokens(userId: string): Promise<void> {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // If user has more than max allowed, delete oldest ones
  if (tokens.length >= REFRESH_TOKEN_CONFIG.MAX_TOKENS_PER_USER) {
    const tokensToDelete = tokens.slice(REFRESH_TOKEN_CONFIG.MAX_TOKENS_PER_USER - 1);
    const tokenIds = tokensToDelete.map(t => t.id);

    await prisma.refreshToken.deleteMany({
      where: { id: { in: tokenIds } },
    });
  }
}

/**
 * Cleans up expired and old revoked tokens
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  // Delete tokens that expired more than 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } }, // Expired tokens
        {
          isRevoked: true,
          revokedAt: { lt: thirtyDaysAgo }, // Old revoked tokens
        },
      ],
    },
  });

  return result.count;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Gets all active refresh tokens for a user
 * @param userId User ID
 * @returns List of active tokens (without raw token values)
 */
export async function getUserActiveTokens(userId: string) {
  return await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tokenFamily: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
}

/**
 * Counts active tokens for a user
 * @param userId User ID
 * @returns Number of active tokens
 */
export async function countUserActiveTokens(userId: string): Promise<number> {
  return await prisma.refreshToken.count({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });
}
