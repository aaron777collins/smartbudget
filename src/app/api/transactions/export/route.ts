import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { RateLimitTier } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';
import type { TransactionType } from '@prisma/client';

// GET /api/transactions/export - Export transactions to CSV or JSON
// Rate limited (MODERATE tier): 100 requests per 15 minutes
export const GET = withAuth(async (req, context) => {
  const userId = context.userId;
  const { searchParams } = new URL(req.url);

    // Parse query parameters (same as list endpoint)
    const accountId = searchParams.get('accountId');
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const type = searchParams.get('type');
    const isReconciled = searchParams.get('isReconciled');
    const isRecurring = searchParams.get('isRecurring');
    const format = searchParams.get('format') || 'csv'; // csv or json

    // Build where clause (same logic as list endpoint)
    const where: any = { userId };

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tagId) {
      where.tags = {
        some: {
          id: tagId,
        },
      };
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

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }

    if (type) {
      where.type = type as TransactionType;
    }

    if (isReconciled !== null && isReconciled !== undefined && isReconciled !== '') {
      where.isReconciled = isReconciled === 'true';
    }

    if (isRecurring !== null && isRecurring !== undefined && isRecurring !== '') {
      where.isRecurring = isRecurring === 'true';
    }

    // Fetch ALL transactions matching filters (no pagination for export)
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            name: true,
            institution: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        subcategory: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        transactions,
        count: transactions.length,
        exportedAt: new Date().toISOString(),
      });
    }

    // Generate CSV
    const csv = generateCSV(transactions);

    // Return CSV with appropriate headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

});

// Helper function to generate CSV from transactions
function generateCSV(transactions: any[]): string {
  // CSV headers
  const headers = [
    'Date',
    'Description',
    'Merchant',
    'Amount',
    'Type',
    'Account',
    'Institution',
    'Category',
    'Subcategory',
    'Tags',
    'Notes',
    'Reconciled',
    'Recurring',
  ];

  // Build CSV rows
  const rows = transactions.map(t => {
    const tags = t.tags.map((tag: any) => tag.name).join('; ');

    return [
      new Date(t.date).toISOString().split('T')[0],
      escapeCSV(t.description),
      escapeCSV(t.merchantName),
      t.amount.toString(),
      t.type,
      escapeCSV(t.account?.name || ''),
      escapeCSV(t.account?.institution || ''),
      escapeCSV(t.category?.name || ''),
      escapeCSV(t.subcategory?.name || ''),
      escapeCSV(tags),
      escapeCSV(t.notes || ''),
      t.isReconciled ? 'Yes' : 'No',
      t.isRecurring ? 'Yes' : 'No',
    ];
  });

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];

  return csvLines.join('\n');
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return '';

  // If value contains comma, quotes, or newlines, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
