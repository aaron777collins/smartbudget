import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format, getDay, startOfWeek, endOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const threeMonthsAgo = subMonths(now, 3);

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        date: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Get last month transactions for comparison
    const lastMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get last 3 months for pattern analysis
    const last3MonthsTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: threeMonthsAgo,
          lte: now,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        date: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate day of week spending patterns
    const dayOfWeekSpending = Array(7).fill(0).map((_, i) => ({
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      total: 0,
      count: 0,
    }));

    last3MonthsTransactions.forEach(txn => {
      const dayIndex = getDay(txn.date);
      dayOfWeekSpending[dayIndex].total += Number(txn.amount);
      dayOfWeekSpending[dayIndex].count += 1;
    });

    dayOfWeekSpending.forEach(day => {
      day.total = Math.round(day.total * 100) / 100;
    });

    // Find highest spending day
    const highestSpendingDay = dayOfWeekSpending.reduce((max, day) =>
      day.total > max.total ? day : max
    , dayOfWeekSpending[0]);

    // Calculate weekend vs weekday spending
    const weekendTotal = dayOfWeekSpending[0].total + dayOfWeekSpending[6].total;
    const weekdayTotal = dayOfWeekSpending.slice(1, 6).reduce((sum, day) => sum + day.total, 0);
    const weekendPercentage = (weekendTotal / (weekendTotal + weekdayTotal)) * 100;

    // Calculate category spending changes
    const currentMonthByCategory = currentMonthTransactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    const lastMonthByCategory = lastMonthTransactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    // Find categories with significant changes (>20%)
    const categoryChanges = Object.keys({ ...currentMonthByCategory, ...lastMonthByCategory }).map(category => {
      const current = currentMonthByCategory[category] || 0;
      const previous = lastMonthByCategory[category] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return {
        category,
        currentSpending: Math.round(current * 100) / 100,
        previousSpending: Math.round(previous * 100) / 100,
        changePercent: Math.round(change * 10) / 10,
        changeAmount: Math.round((current - previous) * 100) / 100,
      };
    }).filter(c => Math.abs(c.changePercent) > 20)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    // Calculate average transaction size
    const avgTransactionSize = last3MonthsTransactions.length > 0
      ? last3MonthsTransactions.reduce((sum, txn) => sum + Number(txn.amount), 0) / last3MonthsTransactions.length
      : 0;

    // Top spending categories (current month)
    const topCategories = Object.entries(currentMonthByCategory)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Generate insights
    const insights = [];

    // Day of week insight
    if (highestSpendingDay.total > 0) {
      const percentage = Math.round((highestSpendingDay.total / dayOfWeekSpending.reduce((sum, d) => sum + d.total, 0)) * 100);
      insights.push({
        type: 'pattern',
        title: `${highestSpendingDay.day} is your highest spending day`,
        description: `You spend ${percentage}% of your weekly total on ${highestSpendingDay.day}s`,
        impact: 'medium',
        data: { day: highestSpendingDay.day, percentage },
      });
    }

    // Weekend spending insight
    if (weekendPercentage > 40) {
      insights.push({
        type: 'pattern',
        title: 'High weekend spending detected',
        description: `${Math.round(weekendPercentage)}% of your spending occurs on weekends`,
        impact: 'medium',
        data: { percentage: Math.round(weekendPercentage) },
      });
    }

    // Category changes insights
    categoryChanges.slice(0, 3).forEach(change => {
      const direction = change.changePercent > 0 ? 'increased' : 'decreased';
      const absChange = Math.abs(change.changePercent);
      insights.push({
        type: 'trend',
        title: `${change.category} spending ${direction}`,
        description: `Your ${change.category} spending ${direction} by ${absChange}% this month (${direction === 'increased' ? '+' : ''}$${Math.abs(change.changeAmount)})`,
        impact: absChange > 50 ? 'high' : 'medium',
        data: change,
      });
    });

    // Top category insight
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      const totalSpending = Object.values(currentMonthByCategory).reduce((sum, amt) => sum + amt, 0);
      const percentage = totalSpending > 0 ? Math.round((topCategory.amount / totalSpending) * 100) : 0;

      insights.push({
        type: 'category',
        title: `${topCategory.category} is your top spending category`,
        description: `You've spent $${topCategory.amount} on ${topCategory.category} this month (${percentage}% of total)`,
        impact: 'high',
        data: { ...topCategory, percentage },
      });
    }

    return NextResponse.json({
      insights,
      patterns: {
        dayOfWeekSpending,
        weekendPercentage: Math.round(weekendPercentage * 10) / 10,
        avgTransactionSize: Math.round(avgTransactionSize * 100) / 100,
        topCategories,
        categoryChanges: categoryChanges.slice(0, 5),
      },
      summary: {
        currentMonthTotal: Math.round(Object.values(currentMonthByCategory).reduce((sum, amt) => sum + amt, 0) * 100) / 100,
        lastMonthTotal: Math.round(Object.values(lastMonthByCategory).reduce((sum, amt) => sum + amt, 0) * 100) / 100,
        transactionCount: currentMonthTransactions.length,
      },
    });
  } catch (error) {
    console.error('Spending patterns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending patterns' },
      { status: 500 }
    );
  }
}
