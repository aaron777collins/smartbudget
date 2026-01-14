/**
 * ML Statistics API Endpoint
 *
 * Returns ML model statistics and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMLStats } from '@/lib/ml-categorizer';
import { getAllCategorizationStats } from '@/lib/hybrid-categorizer';

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

    // Get all categorization statistics
    const stats = await getAllCategorizationStats();

    return NextResponse.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('ML stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get ML statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
