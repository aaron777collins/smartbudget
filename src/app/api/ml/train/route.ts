/**
 * ML Training API Endpoint
 *
 * Triggers training from user corrections to improve categorization accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { trainFromUserCorrections } from '@/lib/ml-training';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body (optional: train for specific user or all users)
    const body = await request.json().catch(() => ({}));
    const { allUsers } = body;

    // Train from user corrections
    const stats = await trainFromUserCorrections(allUsers ? undefined : userId);

    return NextResponse.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('ML training error:', error);
    return NextResponse.json(
      {
        error: 'Failed to train ML model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get training stats without running training
    const { getTrainingStats } = await import('@/lib/ml-training');
    const stats = await getTrainingStats();

    return NextResponse.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('ML stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get training stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
