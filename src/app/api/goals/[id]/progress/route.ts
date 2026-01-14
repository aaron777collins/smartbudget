import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/goals/[id]/progress - Get detailed progress information for a goal
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.goal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);

    // Calculate basic progress
    const progress =
      targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
    const remaining = Math.max(targetAmount - currentAmount, 0);
    const percentageComplete = Math.round(progress * 100) / 100;

    // Calculate time-based metrics if targetDate is set
    let daysRemaining = null;
    let dailyRequiredAmount = null;
    let weeklyRequiredAmount = null;
    let monthlyRequiredAmount = null;
    let projectedCompletionDate = null;
    let onTrack = null;

    if (goal.targetDate) {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const timeDiff = targetDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0 && remaining > 0) {
        // Calculate required amounts
        dailyRequiredAmount = remaining / daysRemaining;
        weeklyRequiredAmount = (remaining / daysRemaining) * 7;
        monthlyRequiredAmount = (remaining / daysRemaining) * 30;

        // Calculate historical progress rate (from creation to now)
        const goalCreated = new Date(goal.createdAt);
        const daysSinceCreation = Math.max(
          Math.ceil((now.getTime() - goalCreated.getTime()) / (1000 * 60 * 60 * 24)),
          1
        );
        const currentDailyRate = currentAmount / daysSinceCreation;

        // Project completion date based on current rate
        if (currentDailyRate > 0) {
          const daysToComplete = remaining / currentDailyRate;
          projectedCompletionDate = new Date(
            now.getTime() + daysToComplete * 24 * 60 * 60 * 1000
          );
        }

        // Determine if on track (current rate >= required rate)
        onTrack = currentDailyRate >= dailyRequiredAmount;
      } else if (daysRemaining <= 0 && !goal.isCompleted) {
        // Goal is overdue
        onTrack = false;
      } else if (goal.isCompleted) {
        onTrack = true;
      }
    }

    return NextResponse.json({
      goalId: goal.id,
      goalName: goal.name,
      type: goal.type,
      currentAmount,
      targetAmount,
      remaining,
      progress: percentageComplete,
      isCompleted: goal.isCompleted,
      targetDate: goal.targetDate,
      daysRemaining,
      dailyRequiredAmount: dailyRequiredAmount
        ? Math.round(dailyRequiredAmount * 100) / 100
        : null,
      weeklyRequiredAmount: weeklyRequiredAmount
        ? Math.round(weeklyRequiredAmount * 100) / 100
        : null,
      monthlyRequiredAmount: monthlyRequiredAmount
        ? Math.round(monthlyRequiredAmount * 100) / 100
        : null,
      projectedCompletionDate,
      onTrack,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal progress' },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id]/progress - Update goal progress (add to current amount)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.goal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const body = await request.json();
    const { amount } = body;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }

    // Calculate new current amount
    const newCurrentAmount = Number(goal.currentAmount) + amount;

    if (newCurrentAmount < 0) {
      return NextResponse.json(
        { error: 'Current amount cannot be negative' },
        { status: 400 }
      );
    }

    // Check if goal will be completed with this update
    const isCompleted = newCurrentAmount >= Number(goal.targetAmount);

    const updatedGoal = await prisma.goal.update({
      where: {
        id,
      },
      data: {
        currentAmount: newCurrentAmount,
        isCompleted,
      },
    });

    return NextResponse.json({
      ...updatedGoal,
      amountAdded: amount,
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to update goal progress' },
      { status: 500 }
    );
  }
}
