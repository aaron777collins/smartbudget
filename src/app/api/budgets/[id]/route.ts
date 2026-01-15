import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateBudgetSchema } from '@/lib/validations';
import { z } from 'zod';

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

    // Validate request body
    const validatedData = updateBudgetSchema.parse(body);

    // Build update data
    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.period !== undefined) updateData.period = validatedData.period;
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate;
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate;
    if (validatedData.totalAmount !== undefined) updateData.totalAmount = validatedData.totalAmount;
    if (validatedData.rollover !== undefined) updateData.rollover = validatedData.rollover;

    // Handle isActive flag - deactivate other budgets if this one is being activated
    if (validatedData.isActive !== undefined) {
      if (validatedData.isActive && !existingBudget.isActive) {
        await prisma.budget.updateMany({
          where: { userId, isActive: true, id: { not: budgetId } },
          data: { isActive: false },
        });
      }
      updateData.isActive = validatedData.isActive;
    }

    // Handle category updates if provided
    if (validatedData.categories && Array.isArray(validatedData.categories)) {
      // Verify all categories exist
      const categoryIds = validatedData.categories.map((c: any) => c.categoryId);
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
        create: validatedData.categories.map((cat: any) => ({
          categoryId: cat.categoryId,
          amount: cat.amount,
          spent: 0,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

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
