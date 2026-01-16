import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get query parameters for timeframe (default to 12 months)
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '12', 10);

    // Get spending data for the last N months, grouped by category
    // OPTIMIZED: Single query instead of N queries
    const startDate = startOfMonth(subMonths(now, months - 1));
    const endDate = endOfMonth(now);

    // Fetch all transactions for the entire period in one query
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        date: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    // Group transactions by month in application code
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      // Filter transactions for this month
      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      // Group spending by category
      const categorySpending = monthTransactions.reduce((acc, txn) => {
        // Skip transfers
        if (txn.category?.slug === 'transfer-out') {
          return acc;
        }

        const categoryName = txn.category?.name || 'Uncategorized';
        const categoryId = txn.category?.id || 'uncategorized';
        const categoryColor = txn.category?.color || '#6B7280';

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            color: categoryColor,
            amount: 0,
          };
        }

        acc[categoryId].amount += Number(txn.amount);
        return acc;
      }, {} as Record<string, { id: string; name: string; color: string; amount: number }>);

      // Calculate total spending for this month
      const totalSpending = Object.values(categorySpending).reduce(
        (sum, cat) => sum + cat.amount,
        0
      );

      monthlyData.push({
        month: format(monthStart, 'MMM yyyy'),
        monthDate: monthStart.toISOString(),
        total: totalSpending,
        categories: Object.values(categorySpending),
      });
    }

    // Get unique categories across all months for consistent charting
    const allCategories = new Map<string, { name: string; color: string }>();
    monthlyData.forEach(month => {
      month.categories.forEach(cat => {
        if (!allCategories.has(cat.id)) {
          allCategories.set(cat.id, { name: cat.name, color: cat.color });
        }
      });
    });

    // Define type for chart data point
    interface ChartDataPoint {
      month: string;
      monthDate: string;
      total: number;
      [categoryName: string]: string | number; // Allow dynamic category names
    }

    // Format data for stacked area chart
    const chartData = monthlyData.map(month => {
      const dataPoint: ChartDataPoint = {
        month: month.month,
        monthDate: month.monthDate,
        total: month.total,
      };

      // Add each category as a separate field
      month.categories.forEach(cat => {
        dataPoint[cat.name] = cat.amount;
      });

      // Add zero values for categories not present in this month
      allCategories.forEach((info, catId) => {
        if (!month.categories.find(c => c.id === catId)) {
          dataPoint[info.name] = 0;
        }
      });

      return dataPoint;
    });

    // Get category metadata for the chart
    const categoryMetadata = Array.from(allCategories.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      color: info.color,
    }));

    return NextResponse.json({
      chartData,
      categories: categoryMetadata,
      summary: {
        totalMonths: months,
        averageMonthlySpending: monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length,
        highestMonth: monthlyData.reduce((max, m) => m.total > max.total ? m : max, monthlyData[0]),
        lowestMonth: monthlyData.reduce((min, m) => m.total < min.total ? m : min, monthlyData[0]),
      },
    });
  } catch (error) {
    console.error('Spending trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending trends data' },
      { status: 500 }
    );
  }
}
