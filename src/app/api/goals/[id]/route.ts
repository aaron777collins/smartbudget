import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GoalType } from '@prisma/client';
import { updateGoalSchema } from '@/lib/validations';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/goals/[id] - Get a specific goal
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
        userId: session.user.id, // Ensure user owns this goal
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Calculate progress percentage
    const progress =
      Number(goal.targetAmount) > 0
        ? Math.min(
            (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
            100
          )
        : 0;

    return NextResponse.json({
      ...goal,
      progress: Math.round(progress * 100) / 100,
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - Update a goal
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

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateGoalSchema.parse(body);

    // Build update data object (only include fields that are provided)
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.targetAmount !== undefined) updateData.targetAmount = validatedData.targetAmount;
    if (validatedData.currentAmount !== undefined) updateData.currentAmount = validatedData.currentAmount;
    if (validatedData.targetDate !== undefined) updateData.targetDate = validatedData.targetDate;
    if (validatedData.icon !== undefined) updateData.icon = validatedData.icon;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;
    if (validatedData.isCompleted !== undefined) updateData.isCompleted = validatedData.isCompleted;

    const updatedGoal = await prisma.goal.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.goal.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
