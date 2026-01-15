import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Frequency } from '@prisma/client';
import { updateRecurringRuleSchema } from '@/lib/validations';
import { z } from 'zod';

// GET - Fetch a specific recurring rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const recurringRule = await prisma.recurringRule.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!recurringRule) {
      return NextResponse.json({ error: 'Recurring rule not found' }, { status: 404 });
    }

    return NextResponse.json({ recurringRule });
  } catch (error) {
    console.error('Error fetching recurring rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring rule' },
      { status: 500 }
    );
  }
}

// PATCH - Update a recurring rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateRecurringRuleSchema.parse(body);

    // Build update data
    const updateData: any = {};
    if (validatedData.merchantName !== undefined) updateData.merchantName = validatedData.merchantName;
    if (validatedData.frequency !== undefined) updateData.frequency = validatedData.frequency;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;
    if (validatedData.nextDueDate !== undefined) updateData.nextDueDate = validatedData.nextDueDate;

    // Update recurring rule
    const recurringRule = await prisma.recurringRule.update({
      where: { id },
      data: updateData,
      include: {
        transactions: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ recurringRule });
  } catch (error) {
    console.error('Error updating recurring rule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update recurring rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a recurring rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // First, unlink all transactions from this rule
    await prisma.transaction.updateMany({
      where: { recurringRuleId: id },
      data: {
        isRecurring: false,
        recurringRuleId: null,
      },
    });

    // Then delete the rule
    await prisma.recurringRule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Recurring rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring rule' },
      { status: 500 }
    );
  }
}
