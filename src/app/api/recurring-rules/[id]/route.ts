import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Frequency } from '@prisma/client';

// GET - Fetch a specific recurring rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringRule = await prisma.recurringRule.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { merchantName, frequency, amount, categoryId, nextDueDate } = body;

    // Validate frequency if provided
    if (frequency && !Object.values(Frequency).includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Update recurring rule
    const recurringRule = await prisma.recurringRule.update({
      where: { id: params.id },
      data: {
        ...(merchantName && { merchantName }),
        ...(frequency && { frequency }),
        ...(amount !== undefined && { amount }),
        ...(categoryId && { categoryId }),
        ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
      },
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
    return NextResponse.json(
      { error: 'Failed to update recurring rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a recurring rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, unlink all transactions from this rule
    await prisma.transaction.updateMany({
      where: { recurringRuleId: params.id },
      data: {
        isRecurring: false,
        recurringRuleId: null,
      },
    });

    // Then delete the rule
    await prisma.recurringRule.delete({
      where: { id: params.id },
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
