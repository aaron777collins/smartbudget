import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import {
  getCached,
  setCached,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/redis-cache';

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

    // Check cache first
    const cacheKey = generateCacheKey(CACHE_KEYS.DASHBOARD_SPENDING_TRENDS, userId, { months });
    const cached = await getCached<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

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

    // Optimize: Single-pass aggregation using nested Maps (from O(n×m) to O(n+m))
    // monthKey -> categoryId -> amount
    const monthCategoryMap = new Map<string, Map<string, { name: string; color: string; amount: number }>>();

    // Pre-populate all months
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthKey = monthStart.toISOString();
      monthCategoryMap.set(monthKey, new Map());
    }

    // Single-pass aggregation
    for (const txn of allTransactions) {
      // Skip transfers
      if (txn.category?.slug === 'transfer-out') {
        continue;
      }

      const txnDate = new Date(txn.date);
      const monthStart = startOfMonth(txnDate);
      const monthKey = monthStart.toISOString();

      const categoryMap = monthCategoryMap.get(monthKey);
      if (!categoryMap) continue;

      const categoryId = txn.category?.id || 'uncategorized';
      const categoryName = txn.category?.name || 'Uncategorized';
      const categoryColor = txn.category?.color || '#6B7280';

      const existing = categoryMap.get(categoryId);
      if (existing) {
        existing.amount += Number(txn.amount);
      } else {
        categoryMap.set(categoryId, {
          name: categoryName,
          color: categoryColor,
          amount: Number(txn.amount),
        });
      }
    }

    // Convert to output format
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthKey = monthStart.toISOString();
      const categoryMap = monthCategoryMap.get(monthKey);

      const categories = categoryMap
        ? Array.from(categoryMap.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            color: data.color,
            amount: data.amount,
          }))
        : [];

      const totalSpending = categories.reduce((sum, cat) => sum + cat.amount, 0);

      monthlyData.push({
        month: format(monthStart, 'MMM yyyy'),
        monthDate: monthKey,
        total: totalSpending,
        categories,
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

    const responseData = {
      chartData,
      categories: categoryMetadata,
      summary: {
        totalMonths: months,
        averageMonthlySpending: monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length,
        highestMonth: monthlyData.reduce((max, m) => m.total > max.total ? m : max, monthlyData[0]),
        lowestMonth: monthlyData.reduce((min, m) => m.total < min.total ? m : min, monthlyData[0]),
      },
    };

    // Cache the response
    await setCached(cacheKey, responseData, CACHE_TTL.DASHBOARD);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Spending trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending trends data' },
      { status: 500 }
    );
  }
}
