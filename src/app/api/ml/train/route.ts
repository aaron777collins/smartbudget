/**
 * ML Training API Endpoint
 *
 * Triggers training from user corrections to improve categorization accuracy
 * Rate limited (EXPENSIVE tier): 10 requests per hour
 */

import { NextResponse } from 'next/server';
import { withExpensiveOp, withAuth } from '@/lib/api-middleware';
import { trainFromUserCorrections } from '@/lib/ml-training';

export const POST = withExpensiveOp(async (req, context) => {
  // Parse request body (optional: train for specific user or all users)
  const body = await req.json().catch(() => ({}));
  const { allUsers } = body;

  // Train from user corrections
  const stats = await trainFromUserCorrections(allUsers ? undefined : context.userId);

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
