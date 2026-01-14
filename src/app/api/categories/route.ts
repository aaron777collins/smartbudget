/**
 * Categories API Endpoint
 *
 * GET /api/categories - List all categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/categories
 * List all categories (system categories + user custom categories)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all categories (system categories and user's custom categories)
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystemCategory: true, userId: null },
          { userId: userId }
        ],
        parentId: null // Only root categories, not subcategories
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
