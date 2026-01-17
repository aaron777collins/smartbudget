import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import {
  logLoginSuccess,
  logLoginFailure,
  logAccountLocked,
} from "@/lib/audit-logger"
import { initializeSession, SESSION_CONFIG } from "@/lib/session-manager"
import { Prisma } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_CONFIG.MAX_SESSION_AGE / 1000, // Convert ms to seconds (4 hours)
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username as string,
          },
        })

        if (!user || !user.password) {
          // Log failed login attempt for non-existent user
          await logLoginFailure(
            credentials.username as string,
            'User not found or invalid credentials',
            { ipAddress: 'unknown', userAgent: 'unknown' }
          )
          return null
        }

        // Check if account is locked
        if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
          const lockTimeRemaining = Math.ceil(
            (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60
          )
          throw new Error(
            `Account is locked. Please try again in ${lockTimeRemaining} minute${lockTimeRemaining !== 1 ? 's' : ''}.`
          )
        }

        // If lock period has expired, reset the failed attempts
        if (user.accountLockedUntil && new Date() >= user.accountLockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastFailedLoginAt: null,
            },
          })
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          // Increment failed login attempts
          const newFailedAttempts = user.failedLoginAttempts + 1
          const maxAttempts = 5
          const lockDurationMinutes = 15

          const updateData: Prisma.UserUpdateInput = {
            failedLoginAttempts: newFailedAttempts,
            lastFailedLoginAt: new Date(),
          }

          // Lock account if max attempts reached
          if (newFailedAttempts >= maxAttempts) {
            updateData.accountLockedUntil = new Date(
              Date.now() + lockDurationMinutes * 60 * 1000
            )
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          // Log failed login attempt
          await logLoginFailure(
            credentials.username as string,
            'Invalid password',
            { ipAddress: 'unknown', userAgent: 'unknown' }
          )

          if (newFailedAttempts >= maxAttempts) {
            // Log account lockout
            await logAccountLocked(
              user.id,
              { ipAddress: 'unknown', userAgent: 'unknown' }
            )
            throw new Error(
              `Account locked due to too many failed login attempts. Please try again in ${lockDurationMinutes} minutes.`
            )
          }

          return null
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastFailedLoginAt: null,
            },
          })
        }

        // Initialize session tracking
        await initializeSession(user.id)

        // Log successful login
        await logLoginSuccess(
          user.id,
          { ipAddress: 'unknown', userAgent: 'unknown' }
        )

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }

      // On token creation or update, add timestamp
      if (trigger === 'signIn' || trigger === 'signUp') {
        token.sessionCreatedAt = Date.now()
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }

      // Add session creation timestamp to session
      if (token.sessionCreatedAt) {
        session.sessionCreatedAt = token.sessionCreatedAt as number
      }

      return session
    },
  },
})
