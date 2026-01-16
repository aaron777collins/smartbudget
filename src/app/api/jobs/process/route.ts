/**
 * Job Processor API
 *
 * Processes pending jobs from the queue.
 * Can be called manually or via a cron job.
 *
 * SECURITY: Admin-only access required
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { processPendingJobs } from '@/lib/job-queue';

/**
 * Input validation schema
 */
const processJobsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(5),
});

/**
 * Check if user is an admin
 * Admins are defined via ADMIN_EMAILS environment variable (comma-separated)
 */
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}

/**
 * POST /api/jobs/process
 * Process pending jobs
 *
 * This endpoint should be called:
 * 1. Periodically via a cron job (e.g., every minute)
 * 2. Manually by an admin user
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must be an admin (defined in ADMIN_EMAILS env var)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - admin only
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json().catch(() => ({}));
    const validationResult = processJobsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { limit } = validationResult.data;

    // Process pending jobs
    await processPendingJobs(limit);

    return NextResponse.json({
      success: true,
      message: `Processing up to ${limit} pending jobs`,
    });
  } catch (error) {
    console.error('Process jobs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
