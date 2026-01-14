import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '30');

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Fetch recurring rules with next due date within the specified range
    const upcomingRules = await prisma.recurringRule.findMany({
      where: {
        nextDueDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 1, // Get most recent transaction
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    // Calculate days until due for each rule
    const upcomingExpenses = upcomingRules.map((rule) => {
      const daysUntil = Math.ceil(
        (new Date(rule.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...rule,
        daysUntil,
        isOverdue: daysUntil < 0,
        isDueToday: daysUntil === 0,
        isDueSoon: daysUntil > 0 && daysUntil <= 7,
      };
    });

    // Calculate summary statistics
    const totalAmount = upcomingExpenses.reduce(
      (sum, rule) => sum + parseFloat(rule.amount.toString()),
      0
    );
    const overdueCount = upcomingExpenses.filter((e) => e.isOverdue).length;
    const dueTodayCount = upcomingExpenses.filter((e) => e.isDueToday).length;
    const dueSoonCount = upcomingExpenses.filter((e) => e.isDueSoon).length;

    return NextResponse.json({
      upcomingExpenses,
      summary: {
        total: upcomingExpenses.length,
        totalAmount,
        overdue: overdueCount,
        dueToday: dueTodayCount,
        dueSoon: dueSoonCount,
        daysAhead,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming expenses' },
      { status: 500 }
    );
  }
}
