/**
 * Edge-compatible auth configuration for middleware
 *
 * This file provides a minimal NextAuth configuration for use in Edge Runtime (middleware).
 * It does NOT import Prisma or any database-dependent code, making it safe for Edge Runtime.
 *
 * The actual authentication logic with database access is in src/auth.ts
 */

import NextAuth from "next-auth"

export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours in seconds
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Providers configuration is not needed for middleware - it only checks JWT token existence
  providers: [],
})
