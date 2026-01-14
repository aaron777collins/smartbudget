/**
 * Job Processor API
 *
 * Processes pending jobs from the queue.
 * Can be called manually or via a cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPendingJobs } from '@/lib/job-queue';

/**
 * POST /api/jobs/process
 * Process pending jobs
 *
 * This endpoint should be called:
 * 1. After creating a new job (to start processing immediately)
 * 2. Periodically via a cron job (e.g., every minute)
 * 3. Manually by an admin
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for production
    // For now, allow any authenticated user to trigger processing
    // In production, you might want to:
    // 1. Use a secret token (Bearer auth)
    // 2. Use Vercel Cron with a secret header
    // 3. Restrict to admin users only

    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 5;

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
