import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * Historical performance data for a month
 */
interface HistoricalPerformance {
  month: string;
  date: Date;
  budgetId: string;
  budgetName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  variance: number;
  percentUsed: number;
  underBudget: boolean;
  status: 'over' | 'near' | 'good';
}

/**
 * Category trend data point
 */
interface CategoryTrendDataPoint {
  month: string;
  budgeted: number;
  spent: number;
  percentUsed: number;
}

/**
 * Category trend with metadata
 */
interface CategoryTrend {
  categoryInfo: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
  };
  data: CategoryTrendDataPoint[];
}

/**
 * Insight generated from analytics
 */
interface BudgetInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// GET /api/budgets/analytics - Get historical budget performance analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '6', 10);

    // Fetch all user's budgets
    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      include: {
        categories: {
          include: {
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
        },
      },
      orderBy: { startDate: 'desc' },
    });

    if (budgets.length === 0) {
      return NextResponse.json({
        message: 'No budgets found',
        budgets: [],
        historicalPerformance: [],
        categoryTrends: [],
        insights: [],
      });
    }

    // Calculate historical performance for each month
    const historicalPerformance: HistoricalPerformance[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yyyy');

      // Find budget active during this month
      const activeBudget = budgets.find(b => {
        const budgetStart = new Date(b.startDate);
        const budgetEnd = b.endDate ? new Date(b.endDate) : new Date();
        return monthStart >= budgetStart && monthStart <= budgetEnd;
      });

      if (!activeBudget) {
        continue;
      }

      // Get all transactions in this month
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          type: 'DEBIT',
        },
        select: {
          categoryId: true,
          amount: true,
        },
      });

      const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalBudget = Number(activeBudget.totalAmount);
      const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      const variance = totalSpent - totalBudget;
      const underBudget = variance < 0;

      historicalPerformance.push({
        month: monthLabel,
        date: monthDate,
        budgetId: activeBudget.id,
        budgetName: activeBudget.name,
        budgeted: totalBudget,
        spent: Math.round(totalSpent * 100) / 100,
        remaining: Math.max(0, totalBudget - totalSpent),
        variance: Math.round(variance * 100) / 100,
        percentUsed: Math.round(percentUsed * 100) / 100,
        underBudget,
        status: percentUsed > 100 ? 'over' : percentUsed > 90 ? 'near' : 'good',
      });
    }

    // Calculate category trends (spending patterns by category over time)
    const categoryTrends: Record<string, CategoryTrend> = {};
    const allCategories = new Set<string>();

    // Collect all categories from all budgets
    budgets.forEach(b => {
      b.categories.forEach(bc => {
        allCategories.add(bc.categoryId);
      });
    });

    for (const categoryId of allCategories) {
      const categoryData = [];

      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, 'MMM yyyy');

        // Find budget for this month that includes this category
        const activeBudget = budgets.find(b => {
          const budgetStart = new Date(b.startDate);
          const budgetEnd = b.endDate ? new Date(b.endDate) : new Date();
          return monthStart >= budgetStart && monthStart <= budgetEnd &&
                 b.categories.some(bc => bc.categoryId === categoryId);
        });

        if (!activeBudget) {
          continue;
        }

        const budgetCategory = activeBudget.categories.find(bc => bc.categoryId === categoryId);
        if (!budgetCategory) {
          continue;
        }

        // Get transactions for this category in this month
        const transactions = await prisma.transaction.findMany({
          where: {
            userId,
            categoryId,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
            type: 'DEBIT',
          },
          select: {
            amount: true,
          },
        });

        const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const budgeted = Number(budgetCategory.amount);
        const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

        categoryData.push({
          month: monthLabel,
          date: monthDate,
          spent: Math.round(spent * 100) / 100,
          budgeted,
          percentUsed: Math.round(percentUsed * 100) / 100,
        });
      }

      if (categoryData.length > 0) {
        // Get category info
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, name: true, slug: true, color: true, icon: true },
        });

        if (category) {
          categoryTrends[categoryId] = {
            categoryInfo: category,
            data: categoryData.reverse(), // Oldest to newest for charts
          };
        }
      }
    }

    // Generate insights
    const insights = generateInsights(historicalPerformance, categoryTrends);

    return NextResponse.json({
      budgets: budgets.map(b => ({
        id: b.id,
        name: b.name,
        type: b.type,
        period: b.period,
        startDate: b.startDate,
        totalAmount: Number(b.totalAmount),
      })),
      historicalPerformance: historicalPerformance.reverse(), // Oldest to newest
      categoryTrends: Object.values(categoryTrends),
      insights,
    });
  } catch (error) {
    console.error('Error generating budget analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget analytics' },
      { status: 500 }
    );
  }
}

// Generate actionable insights from analytics data
function generateInsights(
  historicalPerformance: HistoricalPerformance[],
  categoryTrends: Record<string, CategoryTrend>
): BudgetInsight[] {
  const insights: BudgetInsight[] = [];

  if (historicalPerformance.length === 0) {
    return [];
  }

  // Insight 1: Overall budget performance trend
  const overBudgetMonths = historicalPerformance.filter(p => !p.underBudget).length;
  const totalMonths = historicalPerformance.length;
  const overBudgetPercent = (overBudgetMonths / totalMonths) * 100;

  if (overBudgetPercent > 50) {
    insights.push({
      type: 'warning',
      title: 'Budget Management Needs Attention',
      description: `You've exceeded your budget in ${overBudgetMonths} of the last ${totalMonths} months. Consider reviewing your spending patterns or adjusting budget amounts.`,
      priority: 'high',
    });
  } else if (overBudgetPercent === 0) {
    insights.push({
      type: 'success',
      title: 'Excellent Budget Management',
      description: `You've stayed under budget for all of the last ${totalMonths} months. Great job managing your finances!`,
      priority: 'low',
    });
  }

  // Insight 2: Average budget utilization
  const avgUtilization = historicalPerformance.reduce((sum, p) => sum + p.percentUsed, 0) / totalMonths;
  if (avgUtilization < 70) {
    insights.push({
      type: 'info',
      title: 'Budget May Be Too High',
      description: `Your average budget utilization is ${avgUtilization.toFixed(1)}%. You might consider reducing your budget or reallocating funds to other categories.`,
      priority: 'low',
    });
  }

  // Insight 3: Spending trend (increasing or decreasing)
  if (historicalPerformance.length >= 3) {
    const recentSpending = historicalPerformance.slice(-3).reduce((sum, p) => sum + p.spent, 0) / 3;
    const olderSpending = historicalPerformance.slice(0, 3).reduce((sum, p) => sum + p.spent, 0) / 3;
    const changePercent = ((recentSpending - olderSpending) / olderSpending) * 100;

    if (changePercent > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Trending Upward',
        description: `Your average monthly spending has increased by ${changePercent.toFixed(1)}% compared to earlier months. Review your expenses to identify causes.`,
        priority: 'medium',
      });
    } else if (changePercent < -20) {
      insights.push({
        type: 'success',
        title: 'Spending Trending Downward',
        description: `Your average monthly spending has decreased by ${Math.abs(changePercent).toFixed(1)}%. Great work on cutting expenses!`,
        priority: 'low',
      });
    }
  }

  // Insight 4: Consistently over-budget categories
  const problematicCategories: string[] = [];
  for (const [categoryId, trendData] of Object.entries(categoryTrends)) {
    const data = trendData.data;
    const overBudgetCount = data.filter((d) => d.percentUsed > 100).length;
    if (overBudgetCount >= data.length * 0.6) {
      problematicCategories.push(trendData.categoryInfo.name);
    }
  }

  if (problematicCategories.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Categories Consistently Over Budget',
      description: `The following categories frequently exceed budget: ${problematicCategories.join(', ')}. Consider increasing budget allocation or reducing spending in these areas.`,
      priority: 'high',
    });
  }

  return insights;
}
