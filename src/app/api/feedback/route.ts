import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * Send feedback notification to team
 * In production, this should integrate with:
 * - Email service (SendGrid, AWS SES, Resend, etc.)
 * - Slack webhook
 * - PagerDuty for critical bugs
 */
async function notifyTeam(feedback: {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  userEmail: string;
}) {
  // Log to console (always)
  console.log('[FEEDBACK NOTIFICATION]', {
    id: feedback.id,
    type: feedback.type,
    priority: feedback.priority,
    title: feedback.title,
    userEmail: feedback.userEmail,
    timestamp: new Date().toISOString()
  });

  // In production, send actual notifications based on priority
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to Slack webhook if configured
      if (process.env.SLACK_FEEDBACK_WEBHOOK_URL) {
        const slackMessage = {
          text: `New ${feedback.type.toUpperCase()} feedback: ${feedback.title}`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🔔 New ${feedback.type} (${feedback.priority} priority)`
              }
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Title:*\n${feedback.title}` },
                { type: "mrkdwn", text: `*User:*\n${feedback.userEmail}` },
                { type: "mrkdwn", text: `*Type:*\n${feedback.type}` },
                { type: "mrkdwn", text: `*Priority:*\n${feedback.priority}` }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Description:*\n${feedback.description.substring(0, 500)}${feedback.description.length > 500 ? '...' : ''}`
              }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Feedback ID: ${feedback.id}`
                }
              ]
            }
          ]
        };

        await fetch(process.env.SLACK_FEEDBACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
      }

      // Example: Send email for critical/high priority items
      if ((feedback.priority === 'CRITICAL' || feedback.priority === 'HIGH') &&
          process.env.TEAM_EMAIL_WEBHOOK_URL) {
        await fetch(process.env.TEAM_EMAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: process.env.TEAM_EMAIL_ADDRESS || 'team@smartbudget.app',
            subject: `[${feedback.priority}] ${feedback.type}: ${feedback.title}`,
            html: `
              <h2>New ${feedback.type} (${feedback.priority} priority)</h2>
              <p><strong>From:</strong> ${feedback.userEmail}</p>
              <p><strong>Title:</strong> ${feedback.title}</p>
              <p><strong>Description:</strong></p>
              <p>${feedback.description}</p>
              <p><strong>Feedback ID:</strong> ${feedback.id}</p>
            `
          })
        });
      }
    } catch (notificationError) {
      // Don't fail the feedback submission if notification fails
      console.error('Failed to send team notification:', notificationError);
    }
  }
}

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

    // Send notification to team (async, non-blocking)
    notifyTeam({
      id: feedback.id,
      type: feedback.type,
      priority: feedback.priority,
      title: feedback.title,
      description: feedback.description,
      userEmail: session.user.email
    }).catch(err => {
      // Already logged in notifyTeam, just ensure it doesn't crash the request
      console.error('Notification error:', err);
    });

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
