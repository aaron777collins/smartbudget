import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

    // Get last 6 months of transactions for baseline
    const sixMonthsAgo = subMonths(now, 6);
    const oneMonthAgo = subMonths(now, 1);

    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
          lt: currentMonthStart,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        categoryId: true,
        merchantName: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

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
        id: true,
        amount: true,
        date: true,
        merchantName: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (historicalTransactions.length === 0) {
      return NextResponse.json({
        anomalies: [],
        summary: {
          totalAnomalies: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0,
        },
      });
    }

    // Calculate category averages and standard deviations
    const categoryStats = historicalTransactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = { amounts: [], total: 0, count: 0 };
      }
      acc[categoryName].amounts.push(Number(txn.amount));
      acc[categoryName].total += Number(txn.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { amounts: number[]; total: number; count: number }>);

    // Calculate averages and standard deviations
    const categoryBaselines = Object.entries(categoryStats).reduce((acc, [category, stats]) => {
      const avg = stats.total / stats.count;
      const variance = stats.amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / stats.count;
      const stdDev = Math.sqrt(variance);

      acc[category] = {
        average: avg,
        stdDev: stdDev,
        monthlyTotal: (stats.total / 6), // Average monthly spending
      };
      return acc;
    }, {} as Record<string, { average: number; stdDev: number; monthlyTotal: number }>);

    // Calculate merchant baseline
    const merchantStats = historicalTransactions.reduce((acc, txn) => {
      const merchant = txn.merchantName;
      if (!acc[merchant]) {
        acc[merchant] = { amounts: [], total: 0, count: 0 };
      }
      acc[merchant].amounts.push(Number(txn.amount));
      acc[merchant].total += Number(txn.amount);
      acc[merchant].count += 1;
      return acc;
    }, {} as Record<string, { amounts: number[]; total: number; count: number }>);

    const merchantBaselines = Object.entries(merchantStats).reduce((acc, [merchant, stats]) => {
      const avg = stats.total / stats.count;
      const variance = stats.amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / stats.count;
      const stdDev = Math.sqrt(variance);

      acc[merchant] = {
        average: avg,
        stdDev: stdDev,
        count: stats.count,
      };
      return acc;
    }, {} as Record<string, { average: number; stdDev: number; count: number }>);

    const anomalies = [];

    // Detect unusual transactions
    for (const txn of currentMonthTransactions) {
      const amount = Number(txn.amount);
      const categoryName = txn.category?.name || 'Uncategorized';
      const merchant = txn.merchantName;

      // Check for unusually large transactions in category
      const categoryBaseline = categoryBaselines[categoryName];
      if (categoryBaseline && amount > categoryBaseline.average + (2 * categoryBaseline.stdDev)) {
        const severity = amount > categoryBaseline.average + (3 * categoryBaseline.stdDev) ? 'high' : 'medium';
        const percentAboveAvg = Math.round(((amount - categoryBaseline.average) / categoryBaseline.average) * 100);

        anomalies.push({
          type: 'unusual_amount',
          severity,
          title: `Unusually large ${categoryName} transaction`,
          description: `$${amount} at ${merchant} is ${percentAboveAvg}% above your typical ${categoryName} spending`,
          transactionId: txn.id,
          amount,
          merchant,
          category: categoryName,
          date: txn.date.toISOString(),
          data: {
            amount,
            average: Math.round(categoryBaseline.average * 100) / 100,
            percentAboveAvg,
          },
        });
      }

      // Check for unusual amount at known merchant
      const merchantBaseline = merchantBaselines[merchant];
      if (merchantBaseline && merchantBaseline.count >= 3) {
        if (amount > merchantBaseline.average + (2 * merchantBaseline.stdDev)) {
          const percentAboveAvg = Math.round(((amount - merchantBaseline.average) / merchantBaseline.average) * 100);

          anomalies.push({
            type: 'unusual_merchant_amount',
            severity: 'medium',
            title: `Higher than usual charge at ${merchant}`,
            description: `$${amount} is ${percentAboveAvg}% more than you typically spend at ${merchant}`,
            transactionId: txn.id,
            amount,
            merchant,
            category: categoryName,
            date: txn.date.toISOString(),
            data: {
              amount,
              average: Math.round(merchantBaseline.average * 100) / 100,
              percentAboveAvg,
            },
          });
        }
      }
    }

    // Check for category spending anomalies (month-over-month)
    const currentMonthByCategory = currentMonthTransactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    Object.entries(currentMonthByCategory).forEach(([category, currentTotal]) => {
      const baseline = categoryBaselines[category];
      if (baseline && currentTotal > baseline.monthlyTotal * 1.5) {
        const percentAbove = Math.round(((currentTotal - baseline.monthlyTotal) / baseline.monthlyTotal) * 100);
        anomalies.push({
          type: 'category_overspending',
          severity: percentAbove > 100 ? 'high' : 'medium',
          title: `${category} spending significantly elevated`,
          description: `You've spent $${Math.round(currentTotal * 100) / 100} on ${category} this month, ${percentAbove}% above your average`,
          amount: currentTotal,
          category,
          data: {
            currentTotal: Math.round(currentTotal * 100) / 100,
            averageMonthly: Math.round(baseline.monthlyTotal * 100) / 100,
            percentAbove,
          },
        });
      }
    });

    // Sort by severity and limit
    const sortedAnomalies = anomalies
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
      })
      .slice(0, 10);

    const summary = {
      totalAnomalies: sortedAnomalies.length,
      highSeverity: sortedAnomalies.filter(a => a.severity === 'high').length,
      mediumSeverity: sortedAnomalies.filter(a => a.severity === 'medium').length,
      lowSeverity: sortedAnomalies.filter(a => a.severity === 'low').length,
    };

    return NextResponse.json({
      anomalies: sortedAnomalies,
      summary,
    });
  } catch (error) {
    console.error('Anomalies detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}
