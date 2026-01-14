import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

    // Get this week's transactions
    const thisWeekTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: thisWeekStart,
          lte: thisWeekEnd,
        },
      },
      select: {
        amount: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Get last week's transactions for comparison
    const lastWeekTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: lastWeekStart,
          lte: lastWeekEnd,
        },
      },
      select: {
        amount: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Calculate totals
    const thisWeekIncome = thisWeekTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const thisWeekExpenses = thisWeekTransactions
      .filter(t => t.type === 'DEBIT' && t.category?.slug !== 'transfer-out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastWeekIncome = lastWeekTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastWeekExpenses = lastWeekTransactions
      .filter(t => t.type === 'DEBIT' && t.category?.slug !== 'transfer-out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow = thisWeekIncome - thisWeekExpenses;

    // Calculate changes
    const expenseChange = lastWeekExpenses > 0
      ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100
      : 0;

    const incomeChange = lastWeekIncome > 0
      ? ((thisWeekIncome - lastWeekIncome) / lastWeekIncome) * 100
      : 0;

    // Top spending categories this week
    const categorySpending = thisWeekTransactions
      .filter(t => t.type === 'DEBIT' && t.category?.slug !== 'transfer-out')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: thisWeekExpenses > 0 ? Math.round((amount / thisWeekExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Transaction count
    const transactionCount = thisWeekTransactions.length;
    const avgTransactionSize = transactionCount > 0
      ? thisWeekExpenses / thisWeekTransactions.filter(t => t.type === 'DEBIT').length
      : 0;

    // Generate insights
    const insights = [];

    if (expenseChange > 20) {
      insights.push({
        type: 'warning',
        message: `Your spending increased by ${Math.round(expenseChange)}% this week compared to last week`,
      });
    } else if (expenseChange < -20) {
      insights.push({
        type: 'positive',
        message: `Great job! Your spending decreased by ${Math.round(Math.abs(expenseChange))}% this week`,
      });
    }

    if (netCashFlow < 0) {
      insights.push({
        type: 'warning',
        message: `You spent $${Math.round(Math.abs(netCashFlow) * 100) / 100} more than you earned this week`,
      });
    } else if (netCashFlow > 0) {
      insights.push({
        type: 'positive',
        message: `You saved $${Math.round(netCashFlow * 100) / 100} this week!`,
      });
    }

    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      insights.push({
        type: 'info',
        message: `${topCategory.category} was your top spending category at $${topCategory.amount} (${topCategory.percentage}% of spending)`,
      });
    }

    return NextResponse.json({
      period: {
        start: thisWeekStart.toISOString(),
        end: thisWeekEnd.toISOString(),
        label: `Week of ${format(thisWeekStart, 'MMM d')}`,
      },
      summary: {
        income: Math.round(thisWeekIncome * 100) / 100,
        expenses: Math.round(thisWeekExpenses * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        transactionCount,
        avgTransactionSize: Math.round(avgTransactionSize * 100) / 100,
      },
      comparison: {
        incomeChange: Math.round(incomeChange * 10) / 10,
        expenseChange: Math.round(expenseChange * 10) / 10,
        lastWeekIncome: Math.round(lastWeekIncome * 100) / 100,
        lastWeekExpenses: Math.round(lastWeekExpenses * 100) / 100,
      },
      topCategories,
      insights,
    });
  } catch (error) {
    console.error('Weekly digest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly digest' },
      { status: 500 }
    );
  }
}
