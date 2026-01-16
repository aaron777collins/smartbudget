import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logLoginSuccess, logLoginFailure } from "@/lib/audit-log"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
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
          // Log failed login attempt - missing credentials
          await logLoginFailure(
            credentials?.username as string || "unknown",
            "Missing credentials"
          )
          return null
        }

        // Check rate limit for this username
        const username = credentials.username as string
        const rateLimitResult = checkRateLimit(`auth:${username}`)

        if (!rateLimitResult.success) {
          // Rate limit exceeded
          await logLoginFailure(
            username,
            `Rate limit exceeded - ${rateLimitResult.remaining} attempts remaining`
          )
          // NextAuth doesn't support custom error messages easily,
          // but returning null will trigger a generic error
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            username: username,
          },
        })

        if (!user || !user.passwordHash) {
          // Log failed login attempt - user not found or no password hash
          await logLoginFailure(
            username,
            user ? "No password hash" : "User not found"
          )
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          // Log failed login attempt - invalid password
          await logLoginFailure(
            username,
            "Invalid password"
          )
          return null
        }

        // Login successful - reset rate limit for this username
        resetRateLimit(`auth:${username}`)

        // Log successful login
        await logLoginSuccess(user.id, user.username)

        return {
          id: user.id,
          username: user.username,
          email: user.email || "",
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
