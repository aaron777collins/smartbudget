import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { TransactionType } from '@prisma/client';
import { createTransactionSchema, transactionQuerySchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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

    // Validate query parameters using Zod schema for security
    const queryValidation = transactionQuerySchema.safeParse({
      accountId: searchParams.get('accountId'),
      categoryId: searchParams.get('categoryId'),
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
      isReconciled: searchParams.get('isReconciled'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', issues: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const {
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      isReconciled,
      sortBy,
      sortOrder,
      limit,
    } = queryValidation.data;

    // Additional parameters not in schema
    const tagId = searchParams.get('tagId');
    const isRecurring = searchParams.get('isRecurring');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Prisma.TransactionWhereInput = { userId };

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
      if (minAmount) {
        where.amount.gte = minAmount;
      }
      if (maxAmount) {
        where.amount.lte = maxAmount;
      }
    }

    // Transaction type filter
    if (type) {
      where.type = type;
    }

    // Reconciliation status filter
    if (isReconciled !== null && isReconciled !== undefined) {
      where.isReconciled = isReconciled;
    }

    // Recurring status filter
    if (isRecurring !== null && isRecurring !== undefined && isRecurring !== '') {
      where.isRecurring = isRecurring === 'true';
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

    // Validate request body
    const validatedData = createTransactionSchema.parse(body);

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: validatedData.accountId,
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
        accountId: validatedData.accountId,
        date: validatedData.date,
        postedDate: validatedData.postedDate,
        description: validatedData.description,
        merchantName: validatedData.merchantName,
        amount: validatedData.amount,
        type: validatedData.type,
        categoryId: validatedData.categoryId,
        subcategoryId: validatedData.subcategoryId,
        notes: validatedData.notes,
        isReconciled: validatedData.isReconciled,
        isRecurring: validatedData.isRecurring,
        fitid: validatedData.fitid,
        recurringRuleId: validatedData.recurringRuleId,
        rawData: validatedData.rawData === null ? Prisma.JsonNull : (validatedData.rawData as Prisma.InputJsonValue | undefined),
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

    // Invalidate dashboard cache after transaction creation
    await invalidateDashboardCache(userId);

    return NextResponse.json(transaction, { status: 201 });

  } catch (error) {
    console.error('Transaction create error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid transaction data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
