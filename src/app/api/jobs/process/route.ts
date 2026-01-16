/**
 * Job Processor API
 *
 * Processes pending jobs from the queue.
 * Can be called manually or via a cron job.
 *
 * SECURITY: Admin-only access required (using RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin, MiddlewareContext } from '@/lib/api-middleware';
import { processPendingJobs } from '@/lib/job-queue';

/**
 * Input validation schema
 */
const processJobsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(5),
});

/**
 * POST /api/jobs/process
 * Process pending jobs
 *
 * This endpoint should be called:
 * 1. Periodically via a cron job (e.g., every minute)
 * 2. Manually by an admin user
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN role in database
 */
async function handleProcessJobs(
  request: Request,
  context: MiddlewareContext
): Promise<Response> {
  try {
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
      processedBy: context.userEmail,
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

// Export with admin middleware that checks database role
export const POST = withAdmin(handleProcessJobs);
