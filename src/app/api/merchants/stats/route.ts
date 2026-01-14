/**
 * Merchant Statistics API Endpoint
 *
 * GET /api/merchants/stats
 * - Returns merchant knowledge base statistics
 *
 * Part of Task 3.3: Merchant Normalization Pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMerchantStats } from '@/lib/merchant-normalizer';

/**
 * GET /api/merchants/stats
 * Get merchant knowledge base statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getMerchantStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Merchant stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get merchant statistics', details: error.message },
      { status: 500 }
    );
  }
}
