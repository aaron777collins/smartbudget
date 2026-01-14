/**
 * Jobs API - Get, cancel individual job
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getJob, cancelJob } from '@/lib/job-queue';

/**
 * GET /api/jobs/:id
 * Get job details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJob(id, session.user.id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/:id
 * Cancel a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await cancelJob(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Job not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
