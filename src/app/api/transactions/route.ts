import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { TransactionType } from '@prisma/client';
import { getTransactionsQuerySchema, validateQueryParams } from '@/lib/validation';

// GET /api/transactions - List transactions with filtering
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
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validation = validateQueryParams(getTransactionsQuerySchema, searchParams);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error?.message, details: validation.error?.details },
        { status: 400 }
      );
    }

    const {
      accountId,
      categoryId,
      subcategoryId,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      tags,
      excludeTags,
      uncategorizedOnly,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validation.data;

    // Calculate offset from page
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Handle tags filter (comma-separated IDs)
    if (tags) {
      const tagIds = tags.split(',').filter(Boolean);
      if (tagIds.length > 0) {
        where.tags = {
          some: {
            id: { in: tagIds },
          },
        };
      }
    }

    if (excludeTags) {
      const excludeTagIds = excludeTags.split(',').filter(Boolean);
      if (excludeTagIds.length > 0) {
        where.tags = {
          none: {
            id: { in: excludeTagIds },
          },
        };
      }
    }

    if (uncategorizedOnly) {
      where.categoryId = null;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { merchantName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Amount range filters
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    // Transaction type filter
    if (type) {
      where.type = type as TransactionType;
    }

    // Subcategory filter
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
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
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        take: limit,
        skip: offset
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Transaction list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
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
    if (!body.accountId || !body.date || !body.description || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, date, description, amount' },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: body.accountId,
        userId
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: body.accountId,
        date: new Date(body.date),
        postedDate: body.postedDate ? new Date(body.postedDate) : undefined,
        description: body.description,
        merchantName: body.merchantName || body.description,
        amount: body.amount,
        type: body.type || (body.amount < 0 ? 'DEBIT' : 'CREDIT') as TransactionType,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
        notes: body.notes,
        isReconciled: body.isReconciled || false,
        isRecurring: body.isRecurring || false,
        userCorrected: body.userCorrected || false
      },
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
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });

  } catch (error) {
    console.error('Transaction create error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
