import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateTransactionSchema } from '@/lib/validations';
import { z } from 'zod';

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

    // Validate request body
    const validatedData = updateTransactionSchema.parse(body);

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

    // Mark as user-corrected if category was changed
    const updateData: any = { ...validatedData };
    if (validatedData.categoryId !== undefined && validatedData.categoryId !== existingTransaction.categoryId) {
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

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('Transaction update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid transaction data', issues: error.issues },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
