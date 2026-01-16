import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccountsQuerySchema,
  createAccountSchema,
  validateQueryParams
} from '@/lib/validation';

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
    const validation = validateQueryParams(getAccountsQuerySchema, searchParams);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error?.message, details: validation.error?.details },
        { status: 400 }
      );
    }

    const { active, sortBy, sortOrder } = validation.data;
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { userId };

    if (active !== undefined) {
      where.isActive = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = { [sortBy]: sortOrder };

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
    const result = createAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = result.data;

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
        name: validatedData.name,
        institution: validatedData.institution || '',
        accountType: validatedData.accountType,
        accountNumber: validatedData.accountNumber || null,
        currentBalance: validatedData.currentBalance,
        color: validatedData.color || '#2563EB',
        icon: validatedData.icon || 'wallet',
        isActive: validatedData.isActive,
        currency: 'CAD',
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
