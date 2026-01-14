import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/budgets/:id - Get budget details
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
                description: true,
              },
            },
          },
          orderBy: {
            amount: 'desc',
          },
        },
        _count: {
          select: { categories: true },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

// PATCH /api/budgets/:id - Update budget
export async function PATCH(
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

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { categories: true },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const body = await request.json();

    // Build update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) {
      const validBudgetTypes = ['ENVELOPE', 'PERCENTAGE', 'FIXED_AMOUNT', 'GOAL_BASED'];
      if (!validBudgetTypes.includes(body.type)) {
        return NextResponse.json({ error: 'Invalid budget type' }, { status: 400 });
      }
      updateData.type = body.type;
    }
    if (body.period !== undefined) {
      const validBudgetPeriods = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
      if (!validBudgetPeriods.includes(body.period)) {
        return NextResponse.json({ error: 'Invalid budget period' }, { status: 400 });
      }
      updateData.period = body.period;
    }
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.rollover !== undefined) updateData.rollover = body.rollover;

    // Handle isActive flag - deactivate other budgets if this one is being activated
    if (body.isActive !== undefined) {
      if (body.isActive && !existingBudget.isActive) {
        await prisma.budget.updateMany({
          where: { userId, isActive: true, id: { not: budgetId } },
          data: { isActive: false },
        });
      }
      updateData.isActive = body.isActive;
    }

    // Handle category updates if provided
    if (body.categories && Array.isArray(body.categories)) {
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

      // Delete existing budget categories and create new ones
      await prisma.budgetCategory.deleteMany({
        where: { budgetId },
      });

      updateData.categories = {
        create: body.categories.map((cat: any) => ({
          categoryId: cat.categoryId,
          amount: cat.amount,
          spent: cat.spent !== undefined ? cat.spent : 0,
        })),
      };
    }

    // Update budget
    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
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

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets/:id - Delete budget
export async function DELETE(
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

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Delete budget (categories will be cascade deleted)
    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
