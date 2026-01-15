import { type NextRequest } from "next/server"
import { handlers } from "@/auth"
import { loginLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limit"

// Wrap POST handler with rate limiting for login attempts
const originalPost = handlers.POST

async function POST(req: NextRequest) {
  // Apply rate limiting only for signin/callback requests
  const url = new URL(req.url)
  const isSignIn = url.pathname.includes('/signin') || url.pathname.includes('/callback')

  if (isSignIn) {
    const identifier = getClientIdentifier(req as unknown as Request)
    const rateLimitResult = await checkRateLimit(loginLimiter, identifier)
    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  return originalPost(req)
}

export { POST }
export const GET = handlers.GET
