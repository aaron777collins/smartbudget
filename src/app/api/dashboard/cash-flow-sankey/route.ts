import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
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

    // Get query parameters for period (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '1', 10);

    // Check cache first
    const cacheKey = generateCacheKey(CACHE_KEYS.DASHBOARD_CASH_FLOW, userId, { months });
    const cached = await getCached<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const periodStart = startOfMonth(subMonths(now, months - 1));
    const periodEnd = endOfMonth(now);

    // Get income transactions (CREDIT type)
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        type: 'CREDIT',
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
          },
        },
      },
    });

    // Get expense transactions (DEBIT type)
    const expenseTransactions = await prisma.transaction.findMany({
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
          },
        },
      },
    });

    // Group income by category
    const incomeByCategory = incomeTransactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Other Income';
      const categoryId = txn.category?.id || 'other-income';
      const categoryColor = txn.category?.color || '#10B981';

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

    // Group expenses by category
    const expensesByCategory = expenseTransactions.reduce((acc, txn) => {
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

    // Calculate totals
    const totalIncome = Object.values(incomeByCategory).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    // Build nodes for Sankey diagram
    const nodes: Array<{ id: string; name: string; color?: string }> = [];
    const nodeMap = new Map<string, number>();

    // Add income source nodes
    Object.values(incomeByCategory).forEach((cat) => {
      const index = nodes.length;
      nodeMap.set(`income-${cat.id}`, index);
      nodes.push({ id: `income-${cat.id}`, name: cat.name, color: cat.color });
    });

    // Add "Total Income" middle node
    const totalIncomeIndex = nodes.length;
    nodeMap.set('total-income', totalIncomeIndex);
    nodes.push({ id: 'total-income', name: 'Total Income', color: '#10B981' });

    // Add expense category nodes
    Object.values(expensesByCategory).forEach((cat) => {
      const index = nodes.length;
      nodeMap.set(`expense-${cat.id}`, index);
      nodes.push({ id: `expense-${cat.id}`, name: cat.name, color: cat.color });
    });

    // Add "Savings/Other" node if income > expenses
    if (totalIncome > totalExpenses) {
      const savingsIndex = nodes.length;
      nodeMap.set('savings', savingsIndex);
      nodes.push({ id: 'savings', name: 'Savings/Other', color: '#14B8A6' });
    }

    // Build links for Sankey diagram
    const links: Array<{ source: number; target: number; value: number }> = [];

    // Links from income sources to "Total Income"
    Object.values(incomeByCategory).forEach((cat) => {
      const sourceIndex = nodeMap.get(`income-${cat.id}`);
      if (sourceIndex !== undefined) {
        links.push({
          source: sourceIndex,
          target: totalIncomeIndex,
          value: cat.amount,
        });
      }
    });

    // Links from "Total Income" to expense categories
    Object.values(expensesByCategory).forEach((cat) => {
      const targetIndex = nodeMap.get(`expense-${cat.id}`);
      if (targetIndex !== undefined) {
        links.push({
          source: totalIncomeIndex,
          target: targetIndex,
          value: cat.amount,
        });
      }
    });

    // Link to savings if applicable
    if (totalIncome > totalExpenses) {
      const savingsIndex = nodeMap.get('savings');
      if (savingsIndex !== undefined) {
        links.push({
          source: totalIncomeIndex,
          target: savingsIndex,
          value: totalIncome - totalExpenses,
        });
      }
    }

    const responseData = {
      nodes,
      links,
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          months,
        },
      },
    };

    // Cache the response
    await setCached(cacheKey, responseData, CACHE_TTL.DASHBOARD);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Cash flow Sankey error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' },
      { status: 500 }
    );
  }
}
