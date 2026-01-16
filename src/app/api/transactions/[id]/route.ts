import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { invalidateDashboardCache } from '@/lib/redis-cache';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/transactions/:id - Get a single transaction
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
            accountType: true,
            color: true,
            icon: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        splits: {
          select: {
            id: true,
            categoryId: true,
            amount: true,
            percentage: true,
            notes: true
          }
        },
        recurringRule: {
          select: {
            id: true,
            merchantName: true,
            frequency: true,
            amount: true,
            nextDueDate: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('Transaction get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/:id - Update a transaction
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();

    // Verify transaction belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.postedDate !== undefined) updateData.postedDate = body.postedDate ? new Date(body.postedDate) : null;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.merchantName !== undefined) updateData.merchantName = body.merchantName;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.subcategoryId !== undefined) updateData.subcategoryId = body.subcategoryId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isReconciled !== undefined) updateData.isReconciled = body.isReconciled;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;

    // Mark as user-corrected if category was changed
    if (body.categoryId !== undefined && body.categoryId !== existingTransaction.categoryId) {
      updateData.userCorrected = true;
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
            color: true,
            icon: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    // Invalidate dashboard cache after transaction update
    await invalidateDashboardCache(userId);

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id }
    });

    // Invalidate dashboard cache after transaction deletion
    await invalidateDashboardCache(userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
