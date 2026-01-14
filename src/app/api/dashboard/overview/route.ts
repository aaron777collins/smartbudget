import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

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

    // Fetch all accounts for the user
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        currentBalance: true,
        accountType: true,
      },
    });

    // Calculate net worth (sum of all account balances)
    const netWorth = accounts.reduce((sum, account) => {
      return sum + Number(account.currentBalance);
    }, 0);

    // Get last month's balance history for comparison
    // For now, we'll calculate from transactions since we don't have balance history yet
    const lastMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    const lastMonthBalanceChange = lastMonthTransactions.reduce((sum, txn) => {
      const amount = Number(txn.amount);
      return txn.type === 'CREDIT' ? sum + amount : sum - amount;
    }, 0);

    const previousNetWorth = netWorth - lastMonthBalanceChange;
    const netWorthChange = netWorth - previousNetWorth;
    const netWorthChangePercentage = previousNetWorth !== 0
      ? (netWorthChange / previousNetWorth) * 100
      : 0;

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        amount: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Calculate monthly spending (debits only, excluding transfers)
    const monthlySpending = currentMonthTransactions.reduce((sum, txn) => {
      if (txn.type === 'DEBIT' && txn.category?.slug !== 'transfer-out') {
        return sum + Number(txn.amount);
      }
      return sum;
    }, 0);

    // Calculate monthly income (credits only, excluding transfers)
    const monthlyIncome = currentMonthTransactions.reduce((sum, txn) => {
      if (txn.type === 'CREDIT' && txn.category?.slug !== 'transfer-in') {
        return sum + Number(txn.amount);
      }
      return sum;
    }, 0);

    // Get income sources breakdown
    const incomeByCategory = currentMonthTransactions
      .filter(txn => txn.type === 'CREDIT' && txn.category?.slug !== 'transfer-in')
      .reduce((acc, txn) => {
        const categoryName = txn.category?.name || 'Uncategorized';
        const categoryId = txn.category?.id || 'uncategorized';

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            amount: 0,
          };
        }

        acc[categoryId].amount += Number(txn.amount);
        return acc;
      }, {} as Record<string, { id: string; name: string; amount: number }>);

    const incomeSources = Object.values(incomeByCategory).map(source => ({
      ...source,
      percentage: monthlyIncome > 0 ? (source.amount / monthlyIncome) * 100 : 0,
    }));

    // Calculate cash flow
    const cashFlow = monthlyIncome - monthlySpending;

    // Get last 12 months data for sparkline - OPTIMIZED: Single query instead of 12
    const last12MonthsStart = startOfMonth(subMonths(now, 11));

    // Fetch all transactions for 12 months in one query
    const allMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: last12MonthsStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    // Group transactions by month in application code
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      // Filter transactions for this month
      const monthTransactions = allMonthTransactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      const income = monthTransactions.reduce((sum, txn) => {
        if (txn.type === 'CREDIT' && txn.category?.slug !== 'transfer-in') {
          return sum + Number(txn.amount);
        }
        return sum;
      }, 0);

      const spending = monthTransactions.reduce((sum, txn) => {
        if (txn.type === 'DEBIT' && txn.category?.slug !== 'transfer-out') {
          return sum + Number(txn.amount);
        }
        return sum;
      }, 0);

      monthlyData.push({
        month: monthStart.toISOString(),
        income,
        spending,
        netChange: income - spending,
      });
    }

    // Get budget data (if exists)
    const activeBudget = await prisma.budget.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        categories: {
          select: {
            amount: true,
          },
        },
      },
    });

    const budgetTotal = activeBudget
      ? Number(activeBudget.totalAmount)
      : null;

    const budgetUsed = budgetTotal !== null
      ? (monthlySpending / budgetTotal) * 100
      : null;

    // Calculate average monthly income from last 12 months
    const avgMonthlyIncome = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length
      : 0;

    const incomeVsAverage = avgMonthlyIncome > 0
      ? ((monthlyIncome - avgMonthlyIncome) / avgMonthlyIncome) * 100
      : 0;

    // Days remaining in month
    const daysInMonth = endOfMonth(now).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;

    return NextResponse.json({
      netWorth: {
        current: netWorth,
        change: netWorthChange,
        changePercentage: netWorthChangePercentage,
        sparklineData: monthlyData.map(m => ({
          month: m.month,
          value: m.netChange,
        })),
      },
      monthlySpending: {
        current: monthlySpending,
        budget: budgetTotal,
        budgetUsedPercentage: budgetUsed,
        daysRemaining,
      },
      monthlyIncome: {
        current: monthlyIncome,
        average: avgMonthlyIncome,
        vsAveragePercentage: incomeVsAverage,
        sources: incomeSources,
      },
      cashFlow: {
        current: cashFlow,
        trend: cashFlow > 0 ? 'positive' : cashFlow < 0 ? 'negative' : 'neutral',
        projectedEndOfMonth: monthlyIncome - monthlySpending,
      },
      monthlyData,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
