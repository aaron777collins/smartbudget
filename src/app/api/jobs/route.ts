/**
 * Jobs API - List and create background jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listJobs, createJob, JobType, JobStatus } from '@/lib/job-queue';

/**
 * GET /api/jobs
 * List user's jobs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as JobStatus | undefined;
    const type = searchParams.get('type') as JobType | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await listJobs(session.user.id, {
      status,
      type,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new background job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, payload, total } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: 'type and payload are required' },
        { status: 400 }
      );
    }

    // Validate job type
    if (!Object.values(JobType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      );
    }

    const job = await createJob({
      userId: session.user.id,
      type,
      payload,
      total,
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
