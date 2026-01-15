import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const DEFAULT_USERNAME = 'aaron7c'
    const DEFAULT_PASSWORD = 'KingOfKings12345!'
    const DEFAULT_EMAIL = 'aaron@smartbudget.app'
    const DEFAULT_NAME = 'Aaron Collins'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USERNAME },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists",
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            name: existingUser.name,
          },
        },
        { status: 200 }
      )
    }

    // Hash password
    const hashedPassword = await hash(DEFAULT_PASSWORD, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_USERNAME,
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        name: DEFAULT_NAME,
      },
    })

    return NextResponse.json(
      {
        message: "Default user created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        credentials: {
          username: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "An error occurred while seeding the default user" },
      { status: 500 }
    )
  }
}
