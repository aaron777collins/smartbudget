import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface SplitInput {
  categoryId: string;
  amount: number;
  percentage?: number;
  notes?: string;
}

// POST /api/transactions/:id/split - Create or update splits for a transaction
export async function POST(
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
    const { id: transactionId } = await params;
    const body = await request.json();
    const { splits } = body as { splits: SplitInput[] };

    // Validate splits array
    if (!Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json(
        { error: 'Splits array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Validate splits
    const transactionAmount = parseFloat(transaction.amount.toString());
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);

    // Allow for floating point precision errors (up to 0.01 difference)
    if (Math.abs(totalSplitAmount - Math.abs(transactionAmount)) > 0.01) {
      return NextResponse.json(
        {
          error: 'Split amounts must equal transaction amount',
          details: `Split total: $${totalSplitAmount.toFixed(2)}, Transaction: $${Math.abs(transactionAmount).toFixed(2)}`
        },
        { status: 400 }
      );
    }

    // Validate all categories exist
    const categoryIds = splits.map(s => s.categoryId);
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds }
      }
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'One or more category IDs are invalid' },
        { status: 400 }
      );
    }

    // Use transaction to delete old splits and create new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing splits
      await tx.transactionSplit.deleteMany({
        where: { transactionId }
      });

      // Create new splits
      const createdSplits = await Promise.all(
        splits.map(split =>
          tx.transactionSplit.create({
            data: {
              transactionId,
              categoryId: split.categoryId,
              amount: new Prisma.Decimal(split.amount),
              percentage: split.percentage ? new Prisma.Decimal(split.percentage) : null,
              notes: split.notes || null
            },
            include: {
              transaction: {
                select: {
                  id: true,
                  description: true,
                  amount: true
                }
              }
            }
          })
        )
      );

      // Get updated transaction with splits
      const updatedTransaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          splits: true,
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
          }
        }
      });

      return updatedTransaction;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Split creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create splits', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id/split - Delete all splits for a transaction
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
    const { id: transactionId } = await params;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete all splits
    await prisma.transactionSplit.deleteMany({
      where: { transactionId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Split deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete splits', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
