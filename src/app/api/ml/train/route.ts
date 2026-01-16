/**
 * ML Training API Endpoint
 *
 * Triggers training from user corrections to improve categorization accuracy
 * Rate limited (EXPENSIVE tier): 10 requests per hour
 */

import { NextResponse } from 'next/server';
import { withExpensiveOp, withAuth } from '@/lib/api-middleware';
import { trainFromUserCorrections } from '@/lib/ml-training';
import { invalidateMLCache } from '@/lib/redis-cache';

export const POST = withExpensiveOp(async (req, context) => {
  // Parse request body (optional: train for specific user or all users)
  const body = await req.json().catch(() => ({}));
  const { allUsers } = body;

  // Train from user corrections
  const stats = await trainFromUserCorrections(allUsers ? undefined : context.userId);

  // Invalidate ML cache after training (affects all users if allUsers=true)
  if (allUsers) {
    // Invalidate global ML cache
    await invalidateMLCache('*');
  } else {
    // Invalidate only this user's ML cache
    await invalidateMLCache(context.userId);
  }

  return NextResponse.json({
    success: true,
    ...stats
  });
});

export const GET = withAuth(async (req, context) => {
  // Get training stats without running training
  const { getTrainingStats } = await import('@/lib/ml-training');
  const stats = await getTrainingStats();

  return NextResponse.json({
    success: true,
    ...stats
  });
});
