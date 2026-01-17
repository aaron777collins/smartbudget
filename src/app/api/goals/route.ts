import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GoalType } from '@prisma/client';
import { createGoalSchema } from '@/lib/validations';
import { z } from 'zod';

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

    // Validate request body
    const validatedData = createGoalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        type: validatedData.type,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount,
        targetDate: validatedData.targetDate,
        icon: validatedData.icon,
        color: validatedData.color,
        isCompleted: validatedData.isCompleted,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
