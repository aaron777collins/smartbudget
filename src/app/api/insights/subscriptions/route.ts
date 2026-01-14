import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, differenceInDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // Get last 6 months of transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
          lte: now,
        },
        type: 'DEBIT',
      },
      select: {
        id: true,
        amount: true,
        merchantName: true,
        date: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by merchant and analyze patterns
    const merchantData = transactions.reduce((acc, txn) => {
      const merchant = txn.merchantName;
      if (!acc[merchant]) {
        acc[merchant] = {
          merchant,
          transactions: [],
          category: txn.category?.name || 'Uncategorized',
        };
      }
      acc[merchant].transactions.push({
        id: txn.id,
        amount: Number(txn.amount),
        date: txn.date,
      });
      return acc;
    }, {} as Record<string, { merchant: string; transactions: Array<{ id: string; amount: number; date: Date }>; category: string }>);

    const subscriptions = [];

    // Analyze each merchant for subscription patterns
    for (const data of Object.values(merchantData)) {
      const { merchant, transactions: txns, category } = data;

      if (txns.length < 3) continue; // Need at least 3 transactions

      // Calculate average amount
      const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;

      // Calculate standard deviation
      const variance = txns.reduce((sum, t) => sum + Math.pow(t.amount - avgAmount, 2), 0) / txns.length;
      const stdDev = Math.sqrt(variance);

      // Check if amounts are consistent (subscription indicator)
      const isConsistentAmount = stdDev < avgAmount * 0.15; // 15% variance threshold

      // Calculate average interval between transactions
      const intervals = [];
      for (let i = 1; i < txns.length; i++) {
        const daysDiff = differenceInDays(txns[i].date, txns[i - 1].date);
        intervals.push(daysDiff);
      }

      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

      // Check if intervals are consistent (subscription indicator)
      const intervalVariance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const intervalStdDev = Math.sqrt(intervalVariance);
      const isConsistentInterval = intervalStdDev < avgInterval * 0.3; // 30% variance threshold

      // Determine if this looks like a subscription
      const isSubscription = isConsistentAmount && isConsistentInterval;

      if (isSubscription) {
        // Determine frequency
        let frequency = 'monthly';
        if (avgInterval < 10) frequency = 'weekly';
        else if (avgInterval < 20) frequency = 'bi-weekly';
        else if (avgInterval > 80 && avgInterval < 100) frequency = 'quarterly';
        else if (avgInterval > 350) frequency = 'yearly';

        // Check for recent activity
        const lastTransaction = txns[txns.length - 1];
        const daysSinceLastCharge = differenceInDays(now, lastTransaction.date);
        const isActive = daysSinceLastCharge < avgInterval * 1.5;

        // Determine expected next charge
        const expectedNextCharge = isActive
          ? new Date(lastTransaction.date.getTime() + avgInterval * 24 * 60 * 60 * 1000)
          : null;

        subscriptions.push({
          merchant,
          category,
          amount: Math.round(avgAmount * 100) / 100,
          frequency,
          avgInterval: Math.round(avgInterval),
          isActive,
          lastCharge: lastTransaction.date.toISOString(),
          nextExpectedCharge: expectedNextCharge?.toISOString() || null,
          transactionCount: txns.length,
          totalSpent: Math.round(txns.reduce((sum, t) => sum + t.amount, 0) * 100) / 100,
          monthlyEquivalent: Math.round((avgAmount / avgInterval) * 30 * 100) / 100,
        });
      }
    }

    // Sort by monthly equivalent cost
    const sortedSubscriptions = subscriptions.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);

    // Calculate summary
    const activeSubscriptions = sortedSubscriptions.filter(s => s.isActive);
    const inactiveSubscriptions = sortedSubscriptions.filter(s => !s.isActive);
    const totalMonthlySpend = activeSubscriptions.reduce((sum, s) => sum + s.monthlyEquivalent, 0);

    // Generate recommendations
    const recommendations = [];

    // Inactive subscriptions
    if (inactiveSubscriptions.length > 0) {
      recommendations.push({
        type: 'inactive',
        title: 'Inactive subscriptions detected',
        description: `You have ${inactiveSubscriptions.length} subscription(s) that haven't charged recently. Consider canceling if no longer needed.`,
        subscriptions: inactiveSubscriptions.slice(0, 3).map(s => s.merchant),
      });
    }

    // Expensive subscriptions
    const expensiveSubscriptions = activeSubscriptions.filter(s => s.monthlyEquivalent > 50);
    if (expensiveSubscriptions.length > 0) {
      recommendations.push({
        type: 'expensive',
        title: 'Review expensive subscriptions',
        description: `${expensiveSubscriptions.length} subscription(s) cost over $50/month. Consider if you're getting value.`,
        subscriptions: expensiveSubscriptions.slice(0, 3).map(s => ({ merchant: s.merchant, cost: s.monthlyEquivalent })),
      });
    }

    // Too many subscriptions
    if (activeSubscriptions.length > 10) {
      recommendations.push({
        type: 'too_many',
        title: 'High number of subscriptions',
        description: `You have ${activeSubscriptions.length} active subscriptions. Consider consolidating or canceling unused ones.`,
      });
    }

    return NextResponse.json({
      subscriptions: sortedSubscriptions,
      summary: {
        total: sortedSubscriptions.length,
        active: activeSubscriptions.length,
        inactive: inactiveSubscriptions.length,
        totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
      },
      recommendations,
    });
  } catch (error) {
    console.error('Subscriptions audit error:', error);
    return NextResponse.json(
      { error: 'Failed to audit subscriptions' },
      { status: 500 }
    );
  }
}
