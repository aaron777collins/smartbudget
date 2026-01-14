import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addWeeks, addMonths } from 'date-fns';

// GET /api/budgets/:id/progress - Get budget progress with spending data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: budgetId } = await params;

    // Fetch budget with categories
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Calculate date range based on budget period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (budget.period) {
      case 'WEEKLY':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'BI_WEEKLY':
        // Calculate bi-weekly period from budget start date
        const weeksSinceStart = Math.floor((now.getTime() - budget.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biWeeklyPeriod = Math.floor(weeksSinceStart / 2);
        startDate = addWeeks(budget.startDate, biWeeklyPeriod * 2);
        endDate = addWeeks(startDate, 2);
        break;
      case 'MONTHLY':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'QUARTERLY':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'YEARLY':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    // Fetch actual spending for each category in this period
    const categoryIds = budget.categories.map(bc => bc.categoryId);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { in: categoryIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'DEBIT', // Only count spending (debits)
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Calculate spending per category
    const spendingByCategory = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.categoryId!;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Build progress data
    const categoryProgress = budget.categories.map(budgetCategory => {
      const spent = spendingByCategory[budgetCategory.categoryId] || 0;
      const budgeted = Number(budgetCategory.amount);
      const remaining = budgeted - spent;
      const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

      return {
        categoryId: budgetCategory.categoryId,
        category: budgetCategory.category,
        budgeted,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
        status: percentUsed >= 100 ? 'over' : percentUsed >= 90 ? 'warning' : percentUsed >= 80 ? 'caution' : 'good',
      };
    });

    // Calculate overall progress
    const totalBudgeted = Number(budget.totalAmount);
    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return NextResponse.json({
      budget: {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
      },
      period: {
        startDate,
        endDate,
      },
      overall: {
        budgeted: totalBudgeted,
        spent: totalSpent,
        remaining: totalRemaining,
        percentUsed: Math.round(overallPercentUsed * 100) / 100,
        status: overallPercentUsed >= 100 ? 'over' : overallPercentUsed >= 90 ? 'warning' : overallPercentUsed >= 80 ? 'caution' : 'good',
      },
      categories: categoryProgress,
    });
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget progress' },
      { status: 500 }
    );
  }
}
