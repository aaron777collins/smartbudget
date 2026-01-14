import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GoalType } from '@prisma/client';

// GET /api/goals - Get all goals for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isCompleted: 'asc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate progress percentage for each goal
    const goalsWithProgress = goals.map((goal) => {
      const progress =
        Number(goal.targetAmount) > 0
          ? Math.min(
              (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
              100
            )
          : 0;

      return {
        ...goal,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
      };
    });

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, targetAmount, currentAmount, targetDate, icon, color } =
      body;

    // Validation
    if (!name || !type || !targetAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, targetAmount' },
        { status: 400 }
      );
    }

    if (!Object.values(GoalType).includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid goal type. Must be one of: ${Object.values(GoalType).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be greater than 0' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name,
        type,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        icon: icon || 'target',
        color: color || '#10B981',
        isCompleted: false,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
