import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/filter-presets - List user's saved filter presets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const presets = await prisma.filterPreset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(presets);

  } catch (error) {
    console.error('Filter preset list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter presets' },
      { status: 500 }
    );
  }
}

// POST /api/filter-presets - Create a new filter preset
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.filters) {
      return NextResponse.json(
        { error: 'Missing required fields: name, filters' },
        { status: 400 }
      );
    }

    // Create filter preset
    const preset = await prisma.filterPreset.create({
      data: {
        userId,
        name: body.name,
        filters: body.filters
      }
    });

    return NextResponse.json(preset, { status: 201 });

  } catch (error) {
    console.error('Filter preset create error:', error);
    return NextResponse.json(
      { error: 'Failed to create filter preset' },
      { status: 500 }
    );
  }
}
