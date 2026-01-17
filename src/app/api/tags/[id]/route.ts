import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateTagSchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// GET /api/tags/:id - Get tag details
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
    const { id: tagId } = await params;

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PATCH /api/tags/:id - Update tag
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
    const { id: tagId } = await params;

    // Verify tag belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateTagSchema.parse(body);

    // Build update data
    const updateData: Prisma.TagUpdateInput = {};

    if (validatedData.name !== undefined) {
      // Check for duplicate tag name (case-insensitive, excluding current tag)
      const duplicate = await prisma.tag.findFirst({
        where: {
          userId,
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          id: { not: tagId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Tag with this name already exists' },
          { status: 409 }
        );
      }

      updateData.name = validatedData.name;
    }

    if (validatedData.color !== undefined) {
      updateData.color = validatedData.color;
    }

    // Update tag
    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/:id - Delete tag
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
    const { id: tagId } = await params;

    // Verify tag belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Note: We allow deletion even if tag has transactions (Prisma cascade removes relationships)
    // The transaction-tag relationship will be automatically removed by Prisma

    // Delete tag
    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
