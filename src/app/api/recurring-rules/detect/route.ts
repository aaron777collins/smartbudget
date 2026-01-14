import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Frequency } from '@prisma/client';

interface RecurringPattern {
  merchantName: string;
  frequency: Frequency;
  amount: number;
  categoryId: string;
  nextDueDate: Date;
  transactionIds: string[];
  confidence: number;
}

// Helper function to normalize merchant names for comparison
function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Helper function to calculate frequency between dates
function calculateFrequency(dates: Date[]): { frequency: Frequency | null; avgDays: number } {
  if (dates.length < 2) return { frequency: null, avgDays: 0 };

  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    intervals.push(diffDays);
  }

  const avgDays = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;
  const stdDev = Math.sqrt(
    intervals.reduce((sum, days) => sum + Math.pow(days - avgDays, 2), 0) / intervals.length
  );

  // Allow 20% variance for matching
  const variance = stdDev / avgDays;
  if (variance > 0.2) return { frequency: null, avgDays: 0 };

  // Map to frequency enum
  if (avgDays >= 6 && avgDays <= 8) return { frequency: Frequency.WEEKLY, avgDays };
  if (avgDays >= 13 && avgDays <= 15) return { frequency: Frequency.BI_WEEKLY, avgDays };
  if (avgDays >= 28 && avgDays <= 32) return { frequency: Frequency.MONTHLY, avgDays };
  if (avgDays >= 88 && avgDays <= 95) return { frequency: Frequency.QUARTERLY, avgDays };
  if (avgDays >= 360 && avgDays <= 370) return { frequency: Frequency.YEARLY, avgDays };

  return { frequency: null, avgDays };
}

// Helper function to calculate confidence score
function calculateConfidence(
  transactionCount: number,
  amountVariance: number,
  frequencyVariance: number
): number {
  let confidence = 0;

  // More transactions = higher confidence (max 0.5)
  confidence += Math.min(transactionCount / 12, 0.5);

  // Consistent amounts = higher confidence (max 0.3)
  confidence += Math.max(0, (1 - amountVariance) * 0.3);

  // Consistent frequency = higher confidence (max 0.2)
  confidence += Math.max(0, (1 - frequencyVariance) * 0.2);

  return Math.min(confidence, 1.0);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const minOccurrences = parseInt(searchParams.get('minOccurrences') || '3');
    const lookbackMonths = parseInt(searchParams.get('lookbackMonths') || '6');

    // Fetch all transactions for the past X months
    const lookbackDate = new Date();
    lookbackDate.setMonth(lookbackDate.getMonth() - lookbackMonths);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: lookbackDate },
      },
      orderBy: { date: 'asc' },
      include: {
        category: true,
      },
    });

    // Group transactions by normalized merchant name
    const merchantGroups = new Map<string, typeof transactions>();
    transactions.forEach((transaction) => {
      const normalized = normalizeMerchant(transaction.merchantName);
      if (!merchantGroups.has(normalized)) {
        merchantGroups.set(normalized, []);
      }
      merchantGroups.get(normalized)!.push(transaction);
    });

    // Detect patterns
    const patterns: RecurringPattern[] = [];

    merchantGroups.forEach((txns, normalizedName) => {
      if (txns.length < minOccurrences) return;

      // Group by similar amounts (within 10% variance)
      const amountGroups = new Map<number, typeof txns>();
      txns.forEach((txn) => {
        const amount = Math.abs(parseFloat(txn.amount.toString()));
        let foundGroup = false;

        amountGroups.forEach((group, groupAmount) => {
          const variance = Math.abs(amount - groupAmount) / groupAmount;
          if (variance <= 0.1) {
            group.push(txn);
            foundGroup = true;
          }
        });

        if (!foundGroup) {
          amountGroups.set(amount, [txn]);
        }
      });

      // Analyze each amount group for recurring patterns
      amountGroups.forEach((group, avgAmount) => {
        if (group.length < minOccurrences) return;

        const dates = group.map((t) => new Date(t.date));
        const { frequency, avgDays } = calculateFrequency(dates);

        if (!frequency) return;

        // Calculate amount variance
        const amounts = group.map((t) => Math.abs(parseFloat(t.amount.toString())));
        const avgAmountCalc = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const amountStdDev = Math.sqrt(
          amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmountCalc, 2), 0) / amounts.length
        );
        const amountVariance = amountStdDev / avgAmountCalc;

        // Calculate frequency variance (already checked in calculateFrequency)
        const frequencyVariance = 0.15; // Default low variance since we filtered

        const confidence = calculateConfidence(group.length, amountVariance, frequencyVariance);

        // Only include patterns with confidence >= 0.6
        if (confidence < 0.6) return;

        // Calculate next due date
        const lastDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        const nextDueDate = new Date(lastDate);
        nextDueDate.setDate(nextDueDate.getDate() + Math.round(avgDays));

        // Get most common category
        const categoryCount = new Map<string, number>();
        group.forEach((t) => {
          if (t.categoryId) {
            categoryCount.set(t.categoryId, (categoryCount.get(t.categoryId) || 0) + 1);
          }
        });
        const mostCommonCategory = Array.from(categoryCount.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0];

        if (!mostCommonCategory) return;

        patterns.push({
          merchantName: group[0].merchantName, // Use original merchant name
          frequency,
          amount: avgAmountCalc,
          categoryId: mostCommonCategory[0],
          nextDueDate,
          transactionIds: group.map((t) => t.id),
          confidence,
        });
      });
    });

    // Sort by confidence (highest first)
    patterns.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      patterns,
      summary: {
        totalTransactionsAnalyzed: transactions.length,
        merchantsAnalyzed: merchantGroups.size,
        patternsDetected: patterns.length,
        lookbackMonths,
        minOccurrences,
      },
    });
  } catch (error) {
    console.error('Error detecting recurring patterns:', error);
    return NextResponse.json(
      { error: 'Failed to detect recurring patterns' },
      { status: 500 }
    );
  }
}
