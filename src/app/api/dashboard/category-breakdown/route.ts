import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get query parameters for timeframe (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // 'month', 'quarter', 'year', or 'custom'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let periodStart: Date;
    let periodEnd: Date;

    // Determine date range based on period
    switch (period) {
      case 'year':
        periodStart = startOfYear(now);
        periodEnd = endOfYear(now);
        break;
      case 'quarter':
        periodStart = startOfMonth(subMonths(now, 2));
        periodEnd = endOfMonth(now);
        break;
      case 'custom':
        if (startDate && endDate) {
          periodStart = new Date(startDate);
          periodEnd = new Date(endDate);
        } else {
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
        }
        break;
      default: // 'month'
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
    }

    // Get all spending transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        categoryId: true,
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
    });

    // Group by category and calculate totals
    const categoryBreakdown = transactions.reduce((acc, txn) => {
      // Skip transfers
      if (txn.category?.slug === 'transfer-out') {
        return acc;
      }

      const categoryId = txn.category?.id || 'uncategorized';
      const categoryName = txn.category?.name || 'Uncategorized';
      const categoryColor = txn.category?.color || '#6B7280';
      const categoryIcon = txn.category?.icon || 'help-circle';

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          color: categoryColor,
          icon: categoryIcon,
          amount: 0,
          transactionCount: 0,
        };
      }

      acc[categoryId].amount += Number(txn.amount);
      acc[categoryId].transactionCount += 1;
      return acc;
    }, {} as Record<string, { id: string; name: string; color: string; icon: string; amount: number; transactionCount: number }>);

    // Calculate total spending (excluding transfers)
    const totalSpending = Object.values(categoryBreakdown).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    // Convert to array and add percentages
    const categoryData = Object.values(categoryBreakdown)
      .map(cat => ({
        ...cat,
        percentage: totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    // Get top 5 categories for quick summary
    const topCategories = categoryData.slice(0, 5);

    // Group smaller categories into "Other" if more than 8 categories
    let chartData = categoryData;
    if (categoryData.length > 8) {
      const topEight = categoryData.slice(0, 7);
      const otherCategories = categoryData.slice(7);
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      const otherCount = otherCategories.reduce((sum, cat) => sum + cat.transactionCount, 0);

      chartData = [
        ...topEight,
        {
          id: 'other',
          name: 'Other',
          color: '#9CA3AF',
          icon: 'more-horizontal',
          amount: otherTotal,
          transactionCount: otherCount,
          percentage: totalSpending > 0 ? (otherTotal / totalSpending) * 100 : 0,
        },
      ];
    }

    return NextResponse.json({
      period: {
        type: period,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      totalSpending,
      chartData,
      allCategories: categoryData,
      topCategories,
      summary: {
        categoryCount: Object.keys(categoryBreakdown).length,
        averagePerCategory: Object.keys(categoryBreakdown).length > 0
          ? totalSpending / Object.keys(categoryBreakdown).length
          : 0,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('Category breakdown error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category breakdown data' },
      { status: 500 }
    );
  }
}
