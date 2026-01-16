import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBudgetsQuerySchema, validateQueryParams } from '@/lib/validation';

// GET /api/budgets - List user's budgets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validation = validateQueryParams(getBudgetsQuerySchema, searchParams);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error?.message, details: validation.error?.details },
        { status: 400 }
      );
    }

    const { active, type, period, sortBy, sortOrder } = validation.data;

    // Build where clause
    const where: any = { userId };

    if (active !== undefined) {
      where.isActive = active;
    }

    if (type) {
      where.type = type;
    }

    if (period) {
      where.period = period;
    }

    // Build orderBy clause
    const orderBy: any = { [sortBy]: sortOrder };

    // Fetch budgets with categories
    const budgets = await prisma.budget.findMany({
      where,
      orderBy,
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
        _count: {
          select: { categories: true },
        },
      },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create new budget
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Budget name is required' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: 'Budget type is required' }, { status: 400 });
    }
    if (!body.period) {
      return NextResponse.json({ error: 'Budget period is required' }, { status: 400 });
    }
    if (!body.startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }
    if (body.totalAmount === undefined || body.totalAmount === null) {
      return NextResponse.json({ error: 'Total amount is required' }, { status: 400 });
    }
    if (!body.categories || !Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json({ error: 'At least one budget category is required' }, { status: 400 });
    }

    // Validate budget type
    const validBudgetTypes = ['ENVELOPE', 'PERCENTAGE', 'FIXED_AMOUNT', 'GOAL_BASED'];
    if (!validBudgetTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid budget type' }, { status: 400 });
    }

    // Validate budget period
    const validBudgetPeriods = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    if (!validBudgetPeriods.includes(body.period)) {
      return NextResponse.json({ error: 'Invalid budget period' }, { status: 400 });
    }

    // Validate categories
    for (const cat of body.categories) {
      if (!cat.categoryId) {
        return NextResponse.json({ error: 'Category ID is required for each category' }, { status: 400 });
      }
      if (cat.amount === undefined || cat.amount === null || cat.amount < 0) {
        return NextResponse.json({ error: 'Valid amount is required for each category' }, { status: 400 });
      }
    }

    // Verify all categories exist
    const categoryIds = body.categories.map((c: any) => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'One or more categories do not exist' }, { status: 400 });
    }

    // If this is set as active, deactivate other budgets
    if (body.isActive) {
      await prisma.budget.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    // Create budget with categories
    const budget = await prisma.budget.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        period: body.period,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        totalAmount: body.totalAmount,
        isActive: body.isActive !== undefined ? body.isActive : true,
        rollover: body.rollover !== undefined ? body.rollover : false,
        categories: {
          create: body.categories.map((cat: any) => ({
            categoryId: cat.categoryId,
            amount: cat.amount,
            spent: 0,
          })),
        },
      },
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

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
