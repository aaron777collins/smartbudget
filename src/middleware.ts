import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { validateSession } from "@/lib/session-manager"

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/error"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If accessing a protected route without authentication, redirect to signin
  if (!isPublicRoute && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If authenticated, validate session for inactivity/expiration
  if (isAuthenticated && !isPublicRoute && req.auth?.user?.id) {
    const context = {
      ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    }

    const validation = await validateSession(req.auth.user.id, context)

    // If session is invalid, force logout and redirect to signin
    if (!validation.valid) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      signInUrl.searchParams.set("session_expired", "true")
      return NextResponse.redirect(signInUrl)
    }
  }

  // If accessing auth pages while authenticated, redirect to dashboard
  if (
    isAuthenticated &&
    (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
