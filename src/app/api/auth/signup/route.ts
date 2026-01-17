import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signupLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimit(signupLimiter, identifier)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { username, email, password, name } = await req.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        name: name || null,
      },
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    )
  }
}
