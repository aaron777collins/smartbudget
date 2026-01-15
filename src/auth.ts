import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
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

          const updateData: any = {
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

          if (newFailedAttempts >= maxAttempts) {
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

        return {
          id: user.id,
          email: user.email!,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
