import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/transactions/:id/tags - Add tags to transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: transactionId } = await params;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        tags: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate tagIds is an array
    if (!body.tagIds || !Array.isArray(body.tagIds)) {
      return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 });
    }

    // Verify all tags belong to user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: body.tagIds },
        userId,
      },
    });

    if (tags.length !== body.tagIds.length) {
      return NextResponse.json({ error: 'One or more tags not found' }, { status: 404 });
    }

    // Get existing tag IDs
    const existingTagIds = transaction.tags.map(t => t.id);

    // Find new tags to add (not already connected)
    const newTagIds = body.tagIds.filter((id: string) => !existingTagIds.includes(id));

    // Update transaction to connect new tags
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tags: {
          connect: newTagIds.map((id: string) => ({ id })),
        },
      },
      include: {
        tags: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error adding tags to transaction:', error);
    return NextResponse.json(
      { error: 'Failed to add tags to transaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/:id/tags - Set/replace all tags on transaction
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
    const { id: transactionId } = await params;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate tagIds is an array
    if (!body.tagIds || !Array.isArray(body.tagIds)) {
      return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 });
    }

    // Verify all tags belong to user
    if (body.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: {
          id: { in: body.tagIds },
          userId,
        },
      });

      if (tags.length !== body.tagIds.length) {
        return NextResponse.json({ error: 'One or more tags not found' }, { status: 404 });
      }
    }

    // Update transaction to set exact tags (disconnect all, then connect specified)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tags: {
          set: body.tagIds.map((id: string) => ({ id })),
        },
      },
      include: {
        tags: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction tags:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction tags' },
      { status: 500 }
    );
  }
}
