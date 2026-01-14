import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/budgets/templates - Get budget templates based on user's spending history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const templateType = searchParams.get('type') || 'suggested'; // 'suggested' or '50-30-20' or 'previous'

    // Fetch all categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystemCategory: true },
          { userId },
        ],
      },
      orderBy: { name: 'asc' },
    });

    if (templateType === '50-30-20') {
      // Return 50/30/20 rule template
      return NextResponse.json({
        name: '50/30/20 Rule Budget',
        description: '50% Needs, 30% Wants, 20% Savings',
        type: 'PERCENTAGE',
        categories: [
          {
            group: 'Needs (50%)',
            percentage: 50,
            categories: categories
              .filter(c => ['RENT_AND_UTILITIES', 'FOOD_AND_DRINK', 'TRANSPORTATION', 'MEDICAL'].includes(c.slug.split('_')[0]))
              .map(c => ({
                categoryId: c.id,
                categoryName: c.name,
                suggestedPercentage: 10,
              })),
          },
          {
            group: 'Wants (30%)',
            percentage: 30,
            categories: categories
              .filter(c => ['ENTERTAINMENT', 'GENERAL_MERCHANDISE', 'PERSONAL_CARE'].includes(c.slug.split('_')[0]))
              .map(c => ({
                categoryId: c.id,
                categoryName: c.name,
                suggestedPercentage: 10,
              })),
          },
          {
            group: 'Savings (20%)',
            percentage: 20,
            categories: categories
              .filter(c => ['TRANSFER_OUT', 'LOAN_PAYMENTS'].includes(c.slug.split('_')[0]))
              .map(c => ({
                categoryId: c.id,
                categoryName: c.name,
                suggestedPercentage: 10,
              })),
          },
        ],
      });
    }

    if (templateType === 'previous') {
      // Get user's most recent budget
      const previousBudget = await prisma.budget.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!previousBudget) {
        return NextResponse.json({
          error: 'No previous budget found',
          message: 'Create your first budget or use a suggested template',
        }, { status: 404 });
      }

      return NextResponse.json({
        name: `Copy of ${previousBudget.name}`,
        description: 'Based on your previous budget',
        type: previousBudget.type,
        period: previousBudget.period,
        totalAmount: previousBudget.totalAmount,
        categories: previousBudget.categories.map(bc => ({
          categoryId: bc.categoryId,
          categoryName: bc.category.name,
          amount: bc.amount,
          color: bc.category.color,
          icon: bc.category.icon,
        })),
      });
    }

    // Default: suggested template based on historical spending
    // Get last 3 months of transactions to analyze spending patterns
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo },
        type: 'DEBIT',
        categoryId: { not: null },
      },
      select: {
        categoryId: true,
        amount: true,
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

    if (transactions.length === 0) {
      // No transaction history, return beginner template
      return NextResponse.json({
        name: 'Beginner Budget',
        description: 'A simple starting budget with common categories',
        type: 'FIXED_AMOUNT',
        categories: categories
          .filter(c => ['FOOD_AND_DRINK', 'TRANSPORTATION', 'ENTERTAINMENT', 'RENT_AND_UTILITIES', 'GENERAL_MERCHANDISE'].includes(c.slug.split('_')[0]))
          .slice(0, 8)
          .map(c => ({
            categoryId: c.id,
            categoryName: c.name,
            suggestedAmount: 200, // Default suggestion
            color: c.color,
            icon: c.icon,
          })),
      });
    }

    // Calculate average monthly spending per category
    const spendingByCategory = transactions.reduce((acc, t) => {
      if (!t.categoryId) return acc;

      if (!acc[t.categoryId]) {
        acc[t.categoryId] = {
          total: 0,
          count: 0,
          category: t.category!,
        };
      }

      acc[t.categoryId].total += Number(t.amount);
      acc[t.categoryId].count += 1;

      return acc;
    }, {} as Record<string, { total: number; count: number; category: any }>);

    // Calculate monthly average (divide by 3 months)
    const suggestedCategories = Object.entries(spendingByCategory)
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.category.name,
        suggestedAmount: Math.ceil((data.total / 3) * 1.1), // Add 10% buffer
        historicalAverage: Math.round(data.total / 3),
        color: data.category.color,
        icon: data.category.icon,
      }))
      .sort((a, b) => b.suggestedAmount - a.suggestedAmount)
      .slice(0, 10); // Top 10 categories

    const totalSuggestedAmount = suggestedCategories.reduce((sum, c) => sum + c.suggestedAmount, 0);

    return NextResponse.json({
      name: 'Suggested Budget (Based on Your Spending)',
      description: 'Based on your last 3 months of spending with a 10% buffer',
      type: 'FIXED_AMOUNT',
      totalAmount: totalSuggestedAmount,
      categories: suggestedCategories,
      analysis: {
        periodsAnalyzed: 3,
        transactionCount: transactions.length,
        monthlyAverage: Math.round(totalSuggestedAmount / 1.1), // Remove the buffer to show actual average
      },
    });
  } catch (error) {
    console.error('Error fetching budget templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget templates' },
      { status: 500 }
    );
  }
}
