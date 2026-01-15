/**
 * JWT Utility Functions
 *
 * Provides JWT signing and verification utilities for access tokens.
 * Works alongside NextAuth for manual token management.
 */

import { SignJWT, jwtVerify } from 'jose';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
const JWT_ACCESS_TOKEN_EXPIRATION = '15m'; // 15 minutes

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET or JWT_SECRET must be defined in environment variables');
}

// Convert secret to Uint8Array for jose library
const secretKey = new TextEncoder().encode(JWT_SECRET);

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
  userId: string;
  sessionCreatedAt?: number;
}

export interface VerifiedJWT {
  userId: string;
  sessionCreatedAt?: number;
  iat: number;
  exp: number;
}

// ============================================================================
// SIGNING
// ============================================================================

/**
 * Signs a JWT access token
 *
 * @param payload Token payload (userId required)
 * @param expiresIn Expiration time (default: 15m)
 * @returns Signed JWT token string
 */
export async function signJWT(
  payload: JWTPayload,
  expiresIn: string = JWT_ACCESS_TOKEN_EXPIRATION
): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer('smartbudget')
    .setAudience('smartbudget-api')
    .sign(secretKey);

  return token;
}

// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Verifies and decodes a JWT token
 *
 * @param token JWT token string to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(token: string): Promise<VerifiedJWT> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'smartbudget',
      audience: 'smartbudget-api',
    });

    return {
      userId: payload.userId as string,
      sessionCreatedAt: payload.sessionCreatedAt as number | undefined,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
    throw new Error('JWT verification failed');
  }
}

/**
 * Checks if a JWT token is expired
 *
 * @param token JWT token string
 * @returns true if expired, false if valid
 */
export async function isJWTExpired(token: string): Promise<boolean> {
  try {
    await verifyJWT(token);
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('exp')) {
      return true;
    }
    // Other errors (invalid signature, etc.) are not expiration
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decodes a JWT without verifying it (useful for expired tokens)
 * WARNING: Do not trust this data - use only for debugging/logging
 *
 * @param token JWT token string
 * @returns Decoded payload (unverified)
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Failed to decode JWT');
  }
}

/**
 * Gets time until JWT expiration in seconds
 *
 * @param token JWT token string
 * @returns Seconds until expiration, or 0 if expired
 */
export async function getTimeUntilExpiration(token: string): Promise<number> {
  try {
    const verified = await verifyJWT(token);
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = verified.exp - now;
    return Math.max(0, timeRemaining);
  } catch (error) {
    return 0; // Expired or invalid
  }
}
