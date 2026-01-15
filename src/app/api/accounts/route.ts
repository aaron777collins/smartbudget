import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createAccountSchema, accountQuerySchema } from '@/lib/validations';
import { z } from 'zod';
import { logCreate, getAuditContext } from '@/lib/audit-logger';

// GET /api/accounts - List user's accounts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryValidation = accountQuerySchema.safeParse({
      active: searchParams.get('active'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', issues: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const { active, search, sortBy, sortOrder } = queryValidation.data;

    // Build where clause
    const where: any = { userId };

    if (active !== null) {
      where.isActive = active === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name' || sortBy === 'institution' || sortBy === 'accountType' || sortBy === 'currentBalance') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    // Fetch accounts with transaction count
    const accounts = await prisma.account.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validatedData = createAccountSchema.parse(body);

    // Check for duplicate account
    if (validatedData.accountNumber) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId,
          institution: validatedData.institution,
          accountNumber: validatedData.accountNumber,
        },
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: 'Account with this institution and account number already exists' },
          { status: 409 }
        );
      }
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        userId,
        ...validatedData,
      },
    });

    // Log account creation
    const context = getAuditContext(request);
    await logCreate(
      userId,
      'account',
      account.id,
      {
        name: account.name,
        institution: account.institution,
        accountType: account.accountType,
      },
      context
    );

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid account data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
