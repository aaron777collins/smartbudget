import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  browserInfo: z.any().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = feedbackSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type: validatedData.type.toUpperCase() as any,
        priority: validatedData.priority.toUpperCase() as any,
        title: validatedData.title,
        description: validatedData.description,
        stepsToReproduce: validatedData.stepsToReproduce,
        expectedBehavior: validatedData.expectedBehavior,
        actualBehavior: validatedData.actualBehavior,
        browserInfo: validatedData.browserInfo,
        status: "NEW",
      },
    })

    // TODO: In production, also send notification to team (email, Slack, etc.)
    // This could be done via a background job or webhook

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        id: feedback.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting feedback:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid feedback data", errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Failed to submit feedback" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve feedback (for admin dashboard in future)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Get user's feedback submissions
    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json(
      { message: "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}
