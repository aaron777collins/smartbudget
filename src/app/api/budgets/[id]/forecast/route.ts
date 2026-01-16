import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addWeeks, differenceInDays } from 'date-fns';

// GET /api/budgets/:id/forecast - Forecast spending based on current rate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: budgetId } = await params;

    // Fetch budget with categories
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
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
    });

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Calculate date range based on budget period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (budget.period) {
      case 'WEEKLY':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'BI_WEEKLY':
        const weeksSinceStart = Math.floor((now.getTime() - budget.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biWeeklyPeriod = Math.floor(weeksSinceStart / 2);
        startDate = addWeeks(budget.startDate, biWeeklyPeriod * 2);
        endDate = addWeeks(startDate, 2);
        break;
      case 'MONTHLY':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'QUARTERLY':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'YEARLY':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    // Calculate time metrics
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(now, startDate);
    const daysRemaining = differenceInDays(endDate, now);
    const percentTimeElapsed = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

    // Fetch actual spending for each category in this period
    const categoryIds = budget.categories.map(bc => bc.categoryId);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { in: categoryIds },
        date: {
          gte: startDate,
          lte: now,
        },
        type: 'DEBIT',
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Calculate spending per category
    const spendingByCategory = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.categoryId!;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Calculate forecasts for each category
    const categoryForecasts = budget.categories.map(budgetCategory => {
      const spent = spendingByCategory[budgetCategory.categoryId] || 0;
      const budgeted = Number(budgetCategory.amount);

      // Calculate daily spending rate
      const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;

      // Project end-of-period spending
      const projectedTotal = spent + (dailyRate * daysRemaining);
      const projectedOverUnder = projectedTotal - budgeted;

      // Calculate suggested daily rate to stay on budget
      const suggestedDailyRate = daysRemaining > 0 ? (budgeted - spent) / daysRemaining : 0;

      return {
        categoryId: budgetCategory.categoryId,
        category: budgetCategory.category,
        budgeted,
        spentSoFar: spent,
        dailyRate: Math.round(dailyRate * 100) / 100,
        projectedTotal: Math.round(projectedTotal * 100) / 100,
        projectedOverUnder: Math.round(projectedOverUnder * 100) / 100,
        suggestedDailyRate: Math.max(0, Math.round(suggestedDailyRate * 100) / 100),
        onTrack: projectedTotal <= budgeted,
        status: projectedTotal > budgeted ? 'will_exceed' : projectedTotal > budgeted * 0.95 ? 'at_risk' : 'on_track',
      };
    });

    // Calculate overall forecast
    const totalBudgeted = Number(budget.totalAmount);
    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
    const totalDailyRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const totalProjected = totalSpent + (totalDailyRate * daysRemaining);
    const totalProjectedOverUnder = totalProjected - totalBudgeted;
    const totalSuggestedDailyRate = daysRemaining > 0 ? (totalBudgeted - totalSpent) / daysRemaining : 0;

    return NextResponse.json({
      budget: {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        period: budget.period,
      },
      period: {
        startDate,
        endDate,
        totalDays,
        daysElapsed,
        daysRemaining,
        percentTimeElapsed: Math.round(percentTimeElapsed * 100) / 100,
      },
      overall: {
        budgeted: totalBudgeted,
        spentSoFar: totalSpent,
        dailyRate: Math.round(totalDailyRate * 100) / 100,
        projectedTotal: Math.round(totalProjected * 100) / 100,
        projectedOverUnder: Math.round(totalProjectedOverUnder * 100) / 100,
        suggestedDailyRate: Math.max(0, Math.round(totalSuggestedDailyRate * 100) / 100),
        onTrack: totalProjected <= totalBudgeted,
        status: totalProjected > totalBudgeted ? 'will_exceed' : totalProjected > totalBudgeted * 0.95 ? 'at_risk' : 'on_track',
      },
      categories: categoryForecasts,
      recommendations: generateRecommendations(categoryForecasts, totalProjectedOverUnder, totalBudgeted),
    });
  } catch (error) {
    console.error('Error generating budget forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget forecast' },
      { status: 500 }
    );
  }
}

interface CategoryForecast {
  categoryId: string;
  category: { id: string; name: string; slug: string; color: string | null; icon: string | null };
  budgeted: number;
  spentSoFar: number;
  dailyRate: number;
  projectedTotal: number;
  projectedOverUnder: number;
  suggestedDailyRate: number;
  onTrack: boolean;
  status: string;
}

// Helper function to generate actionable recommendations
function generateRecommendations(
  categoryForecasts: CategoryForecast[],
  totalProjectedOverUnder: number,
  totalBudgeted: number
): string[] {
  const recommendations: string[] = [];

  // Overall budget status
  if (totalProjectedOverUnder > 0) {
    const percentOver = (totalProjectedOverUnder / totalBudgeted) * 100;
    recommendations.push(
      `You're projected to exceed your budget by $${totalProjectedOverUnder.toFixed(2)} (${percentOver.toFixed(1)}%). Consider reducing spending.`
    );
  } else if (totalProjectedOverUnder < 0 && Math.abs(totalProjectedOverUnder) > totalBudgeted * 0.1) {
    recommendations.push(
      `You're on track to come in under budget by $${Math.abs(totalProjectedOverUnder).toFixed(2)}. Great job!`
    );
  }

  // Category-specific recommendations
  const atRiskCategories = categoryForecasts.filter(c => c.status === 'will_exceed');
  const wellManagedCategories = categoryForecasts.filter(
    c => c.spentSoFar < c.budgeted * 0.5 && c.projectedTotal < c.budgeted * 0.8
  );

  if (atRiskCategories.length > 0) {
    const topOverspender = atRiskCategories.sort((a, b) => b.projectedOverUnder - a.projectedOverUnder)[0];
    recommendations.push(
      `${topOverspender.category.name} is projected to exceed budget by $${topOverspender.projectedOverUnder.toFixed(2)}. Reduce daily spending to $${topOverspender.suggestedDailyRate.toFixed(2)}.`
    );
  }

  if (wellManagedCategories.length > 0) {
    const names = wellManagedCategories.map(c => c.category.name).slice(0, 2).join(' and ');
    recommendations.push(
      `${names} ${wellManagedCategories.length > 1 ? 'are' : 'is'} well-managed and under budget.`
    );
  }

  // If no specific recommendations, provide encouragement
  if (recommendations.length === 0) {
    recommendations.push('Your spending is on track. Keep up the good work!');
  }

  return recommendations;
}
