import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createBudgetSchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma, BudgetType, BudgetPeriod } from '@prisma/client';

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
    const where: Prisma.BudgetWhereInput = { userId };

    if (active !== undefined) {
      where.isActive = active;
    }

    if (type) {
      where.type = type as BudgetType;
    }

    if (period) {
      where.period = period as BudgetPeriod;
    }

    // Build orderBy clause
    const orderBy: Prisma.BudgetOrderByWithRelationInput = {};
    if (sortBy === 'name' || sortBy === 'type' || sortBy === 'period' || sortBy === 'startDate' || sortBy === 'totalAmount' || sortBy === 'createdAt') {
      orderBy[sortBy as keyof Prisma.BudgetOrderByWithRelationInput] = sortOrder as Prisma.SortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

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

    // Validate request body
    const validatedData = createBudgetSchema.parse(body);

    // Verify all categories exist
    if (validatedData.categories && validatedData.categories.length > 0) {
      const categoryIds = validatedData.categories.map((c: { categoryId: string; amount: number }) => c.categoryId);
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        return NextResponse.json({ error: 'One or more categories do not exist' }, { status: 400 });
      }
    }

    // If this is set as active, deactivate other budgets
    if (validatedData.isActive) {
      await prisma.budget.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    // Create budget with categories
    const budget = await prisma.budget.create({
      data: {
        userId,
        name: validatedData.name,
        type: validatedData.type,
        period: validatedData.period,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || null,
        totalAmount: validatedData.totalAmount,
        isActive: validatedData.isActive,
        rollover: validatedData.rollover,
        categories: validatedData.categories ? {
          create: validatedData.categories.map((cat: { categoryId: string; amount: number }) => ({
            categoryId: cat.categoryId,
            amount: cat.amount,
            spent: 0,
          })),
        } : undefined,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
