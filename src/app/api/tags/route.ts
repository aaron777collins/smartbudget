import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createTagSchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// GET /api/tags - List user's tags
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as Prisma.SortOrder;

    // Build where clause
    const where: Prisma.TagWhereInput = { userId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Build orderBy clause
    const orderBy: Prisma.TagOrderByWithRelationInput = {};
    if (sortBy === 'name' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    // Fetch tags with transaction count
    const tags = await prisma.tag.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validatedData = createTagSchema.parse(body);

    // Check for duplicate tag (case-insensitive)
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId,
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        userId,
        name: validatedData.name,
        color: validatedData.color,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
