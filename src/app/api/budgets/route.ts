import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createBudgetSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/budgets - List user's budgets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const active = searchParams.get('active');
    const type = searchParams.get('type');
    const period = searchParams.get('period');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = { userId };

    if (active !== null) {
      where.isActive = active === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (period) {
      where.period = period;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name' || sortBy === 'type' || sortBy === 'period' || sortBy === 'startDate' || sortBy === 'totalAmount' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder;
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
      const categoryIds = validatedData.categories.map((c: any) => c.categoryId);
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
          create: validatedData.categories.map((cat: any) => ({
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
