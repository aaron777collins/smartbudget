import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateAccountSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/accounts/:id - Get account details
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
    const { id: accountId } = await params;

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          take: 5,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            description: true,
            merchantName: true,
            amount: true,
            type: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PATCH /api/accounts/:id - Update account
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
    const { id: accountId } = await params;

    // Verify account belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateAccountSchema.parse(body);

    // Check for duplicate if institution or accountNumber is being changed
    if ((validatedData.institution || validatedData.accountNumber) && validatedData.accountNumber) {
      const institution = validatedData.institution || existingAccount.institution;
      const accountNumber = validatedData.accountNumber;

      const duplicate = await prisma.account.findFirst({
        where: {
          userId,
          institution,
          accountNumber,
          id: { not: accountId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Account with this institution and account number already exists' },
          { status: 409 }
        );
      }
    }

    // Update account
    const account = await prisma.account.update({
      where: { id: accountId },
      data: validatedData,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid account data', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/:id - Delete account
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
    const { id: accountId } = await params;

    // Verify account belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if account has transactions
    if (existingAccount._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions. Please delete all transactions first or set account as inactive.' },
        { status: 400 }
      );
    }

    // Delete account
    await prisma.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
