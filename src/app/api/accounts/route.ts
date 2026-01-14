import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/accounts - List user's accounts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
    }
    if (!body.institution) {
      return NextResponse.json({ error: 'Institution is required' }, { status: 400 });
    }
    if (!body.accountType) {
      return NextResponse.json({ error: 'Account type is required' }, { status: 400 });
    }
    if (body.currentBalance === undefined || body.currentBalance === null) {
      return NextResponse.json({ error: 'Current balance is required' }, { status: 400 });
    }

    // Check for duplicate account
    if (body.accountNumber) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId,
          institution: body.institution,
          accountNumber: body.accountNumber,
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
        name: body.name,
        institution: body.institution,
        accountType: body.accountType,
        accountNumber: body.accountNumber || null,
        currency: body.currency || 'CAD',
        currentBalance: body.currentBalance,
        availableBalance: body.availableBalance || null,
        color: body.color || '#2563EB',
        icon: body.icon || 'wallet',
        isActive: body.isActive !== undefined ? body.isActive : true,
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
