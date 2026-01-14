import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Frequency } from '@prisma/client';

// GET - Fetch all recurring rules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringRules = await prisma.recurringRule.findMany({
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    return NextResponse.json({ recurringRules });
  } catch (error) {
    console.error('Error fetching recurring rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring rules' },
      { status: 500 }
    );
  }
}

// POST - Create a new recurring rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { merchantName, frequency, amount, categoryId, nextDueDate, transactionIds } = body;

    // Validate required fields
    if (!merchantName || !frequency || !amount || !categoryId || !nextDueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!Object.values(Frequency).includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Create recurring rule
    const recurringRule = await prisma.recurringRule.create({
      data: {
        merchantName,
        frequency,
        amount,
        categoryId,
        nextDueDate: new Date(nextDueDate),
      },
      include: {
        transactions: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    // If transaction IDs provided, link them to this rule
    if (transactionIds && Array.isArray(transactionIds) && transactionIds.length > 0) {
      await prisma.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          userId, // Ensure user owns these transactions
        },
        data: {
          isRecurring: true,
          recurringRuleId: recurringRule.id,
        },
      });
    }

    return NextResponse.json({ recurringRule }, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring rule:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring rule' },
      { status: 500 }
    );
  }
}
