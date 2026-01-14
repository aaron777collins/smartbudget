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

    // Get query parameters for timeframe (default to 6 months)
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '6', 10);

    const periodStart = startOfMonth(subMonths(now, months - 1));
    const periodEnd = endOfMonth(now);

    // Get all top-level categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystemCategory: true },
          { userId },
        ],
        parentId: null,
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

    // Filter out transfer categories
    const filteredCategories = categories.filter(
      cat => cat.slug !== 'transfer-in' && cat.slug !== 'transfer-out'
    );

    // Get all transactions in the period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        type: 'DEBIT',
        categoryId: {
          in: filteredCategories.map(c => c.id),
        },
      },
      select: {
        id: true,
        date: true,
        categoryId: true,
      },
    });

    // Group transactions by month
    const transactionsByMonth: Record<string, Set<string>> = {};

    transactions.forEach(txn => {
      const monthKey = format(txn.date, 'yyyy-MM');
      if (!transactionsByMonth[monthKey]) {
        transactionsByMonth[monthKey] = new Set();
      }
      if (txn.categoryId) {
        transactionsByMonth[monthKey].add(txn.categoryId);
      }
    });

    // Calculate co-occurrence matrix
    // For each pair of categories, count how many months they both appear in
    const cooccurrenceMatrix: number[][] = [];

    filteredCategories.forEach((cat1, i) => {
      cooccurrenceMatrix[i] = [];
      filteredCategories.forEach((cat2, j) => {
        if (i === j) {
          // Diagonal: count months where this category appears
          const count = Object.values(transactionsByMonth).filter(
            monthCats => monthCats.has(cat1.id)
          ).length;
          cooccurrenceMatrix[i][j] = count;
        } else {
          // Off-diagonal: count months where both categories appear
          const count = Object.values(transactionsByMonth).filter(
            monthCats => monthCats.has(cat1.id) && monthCats.has(cat2.id)
          ).length;
          cooccurrenceMatrix[i][j] = count;
        }
      });
    });

    // Calculate correlation coefficients (normalized co-occurrence)
    const correlationMatrix: number[][] = [];
    const maxCooccurrence = Math.max(...cooccurrenceMatrix.flat());

    filteredCategories.forEach((cat1, i) => {
      correlationMatrix[i] = [];
      filteredCategories.forEach((cat2, j) => {
        if (maxCooccurrence > 0) {
          // Normalize to 0-1 range
          correlationMatrix[i][j] = cooccurrenceMatrix[i][j] / maxCooccurrence;
        } else {
          correlationMatrix[i][j] = 0;
        }
      });
    });

    // Format data for visualization
    const matrixData: Array<{
      category1: string;
      category1Id: string;
      category1Color: string;
      category2: string;
      category2Id: string;
      category2Color: string;
      correlation: number;
      cooccurrence: number;
    }> = [];

    filteredCategories.forEach((cat1, i) => {
      filteredCategories.forEach((cat2, j) => {
        matrixData.push({
          category1: cat1.name,
          category1Id: cat1.id,
          category1Color: cat1.color,
          category2: cat2.name,
          category2Id: cat2.id,
          category2Color: cat2.color,
          correlation: correlationMatrix[i][j],
          cooccurrence: cooccurrenceMatrix[i][j],
        });
      });
    });

    return NextResponse.json({
      categories: filteredCategories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
      })),
      matrix: matrixData,
      metadata: {
        months,
        totalMonthsWithData: Object.keys(transactionsByMonth).length,
        maxCooccurrence,
      },
    });
  } catch (error) {
    console.error('Category correlation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch correlation data' },
      { status: 500 }
    );
  }
}
