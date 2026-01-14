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

    // Get all categories first
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystemCategory: true },
          { userId },
        ],
        parentId: null, // Only top-level categories
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build heat map data: categories x months
    // OPTIMIZED: Single query instead of (categories × months) queries
    const startDate = startOfMonth(subMonths(now, months - 1));
    const endDate = endOfMonth(now);

    // Get category IDs excluding transfers
    const categoryIds = categories
      .filter(cat => cat.slug !== 'transfer-in' && cat.slug !== 'transfer-out')
      .map(cat => cat.id);

    // Fetch all transactions for all categories in one query
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { in: categoryIds },
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
      },
    });

    // Build heat map data by grouping in application code
    const heatmapData: Array<{
      category: string;
      categoryId: string;
      color: string;
      months: Array<{
        month: string;
        monthDate: string;
        amount: number;
      }>;
    }> = [];

    for (const category of categories) {
      // Skip transfer categories
      if (category.slug === 'transfer-in' || category.slug === 'transfer-out') {
        continue;
      }

      const monthlyAmounts: Array<{
        month: string;
        monthDate: string;
        amount: number;
      }> = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));

        // Filter transactions for this category and month
        const categoryTransactions = allTransactions.filter(txn => {
          const txnDate = new Date(txn.date);
          return txn.categoryId === category.id &&
                 txnDate >= monthStart &&
                 txnDate <= monthEnd;
        });

        const totalAmount = categoryTransactions.reduce(
          (sum, txn) => sum + Number(txn.amount),
          0
        );

        monthlyAmounts.push({
          month: format(monthStart, 'MMM yyyy'),
          monthDate: monthStart.toISOString(),
          amount: totalAmount,
        });
      }

      // Only include categories that have some spending
      const hasSpending = monthlyAmounts.some(m => m.amount > 0);
      if (hasSpending) {
        heatmapData.push({
          category: category.name,
          categoryId: category.id,
          color: category.color,
          months: monthlyAmounts,
        });
      }
    }

    // Calculate min and max values for color scale
    let minValue = Infinity;
    let maxValue = 0;

    heatmapData.forEach(cat => {
      cat.months.forEach(month => {
        if (month.amount > 0 && month.amount < minValue) {
          minValue = month.amount;
        }
        if (month.amount > maxValue) {
          maxValue = month.amount;
        }
      });
    });

    // If no data, set sensible defaults
    if (minValue === Infinity) minValue = 0;

    return NextResponse.json({
      data: heatmapData,
      scale: {
        min: minValue,
        max: maxValue,
      },
      period: {
        months,
      },
    });
  } catch (error) {
    console.error('Category heatmap error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}
