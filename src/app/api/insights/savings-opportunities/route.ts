import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const threeMonthsAgo = subMonths(now, 3);

    // Get last 3 months of transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: threeMonthsAgo,
          lte: now,
        },
        type: 'DEBIT',
      },
      select: {
        amount: true,
        merchantName: true,
        date: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const opportunities = [];

    // 1. Recurring subscription analysis
    const merchantFrequency = transactions.reduce((acc, txn) => {
      const merchant = txn.merchantName;
      if (!acc[merchant]) {
        acc[merchant] = { count: 0, total: 0, amounts: [], category: txn.category?.name || 'Uncategorized' };
      }
      acc[merchant].count += 1;
      acc[merchant].total += Number(txn.amount);
      acc[merchant].amounts.push(Number(txn.amount));
      return acc;
    }, {} as Record<string, { count: number; total: number; amounts: number[]; category: string }>);

    // Find potential subscriptions (3+ transactions, similar amounts)
    const potentialSubscriptions = Object.entries(merchantFrequency)
      .filter(([_, data]) => {
        if (data.count < 3) return false;
        const avg = data.total / data.count;
        const variance = data.amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / data.count;
        const stdDev = Math.sqrt(variance);
        // Low variance suggests recurring subscription
        return stdDev < avg * 0.2;
      })
      .map(([merchant, data]) => ({
        merchant,
        monthlyAmount: Math.round((data.total / 3) * 100) / 100,
        totalSpent: Math.round(data.total * 100) / 100,
        category: data.category,
      }))
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

    if (potentialSubscriptions.length > 0) {
      const totalSubscriptionCost = potentialSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);
      opportunities.push({
        type: 'subscriptions',
        title: 'Review your subscriptions',
        description: `You have ${potentialSubscriptions.length} recurring subscriptions totaling $${Math.round(totalSubscriptionCost * 100) / 100}/month`,
        impact: 'high',
        potentialSavings: Math.round(totalSubscriptionCost * 0.3 * 100) / 100, // Assume 30% could be cut
        data: {
          subscriptions: potentialSubscriptions.slice(0, 5),
          totalMonthly: Math.round(totalSubscriptionCost * 100) / 100,
        },
      });
    }

    // 2. High-frequency low-value purchases (coffee, snacks, etc.)
    const foodAndDrinkTransactions = transactions.filter(txn =>
      txn.category?.slug?.includes('food-and-drink') ||
      txn.category?.slug?.includes('coffee') ||
      txn.category?.name?.toLowerCase().includes('food') ||
      txn.category?.name?.toLowerCase().includes('restaurant')
    );

    const smallFrequentPurchases = foodAndDrinkTransactions.filter(txn => Number(txn.amount) < 15);
    if (smallFrequentPurchases.length > 20) {
      const totalSpent = smallFrequentPurchases.reduce((sum, txn) => sum + Number(txn.amount), 0);
      const monthlyAvg = totalSpent / 3;
      const potentialSavings = monthlyAvg * 0.4; // Could save 40% by reducing

      opportunities.push({
        type: 'frequent_small_purchases',
        title: 'Frequent small food purchases',
        description: `${smallFrequentPurchases.length} small food/drink purchases in 3 months averaging $${Math.round((totalSpent / smallFrequentPurchases.length) * 100) / 100} each`,
        impact: 'medium',
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        data: {
          purchaseCount: smallFrequentPurchases.length,
          monthlyAverage: Math.round(monthlyAvg * 100) / 100,
          avgPurchaseSize: Math.round((totalSpent / smallFrequentPurchases.length) * 100) / 100,
        },
      });
    }

    // 3. Category overspending vs benchmarks
    const categoryTotals = transactions.reduce((acc, txn) => {
      const categoryName = txn.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
    const monthlyAverage = totalSpending / 3;

    // Check if dining out is >15% of spending
    const diningCategories = ['Restaurants', 'Fast Food', 'Coffee Shops', 'Bars & Alcohol'];
    const diningTotal = diningCategories.reduce((sum, cat) => sum + (categoryTotals[cat] || 0), 0);
    const diningPercentage = (diningTotal / totalSpending) * 100;

    if (diningPercentage > 15) {
      const benchmark = totalSpending * 0.15;
      const excess = diningTotal - benchmark;
      const potentialSavings = excess * 0.5; // Could save 50% of excess

      opportunities.push({
        type: 'category_optimization',
        title: 'High dining out expenses',
        description: `Dining out is ${Math.round(diningPercentage)}% of your spending. Consider meal prepping to reduce costs`,
        impact: 'high',
        potentialSavings: Math.round((potentialSavings / 3) * 100) / 100, // Monthly savings
        data: {
          currentMonthly: Math.round((diningTotal / 3) * 100) / 100,
          percentage: Math.round(diningPercentage * 10) / 10,
          recommendedMonthly: Math.round((benchmark / 3) * 100) / 100,
        },
      });
    }

    // 4. Entertainment spending
    const entertainmentCategories = ['Entertainment', 'Gambling', 'Movies', 'Video Games', 'Sporting Events'];
    const entertainmentTotal = entertainmentCategories.reduce((sum, cat) => sum + (categoryTotals[cat] || 0), 0);
    const entertainmentPercentage = (entertainmentTotal / totalSpending) * 100;

    if (entertainmentPercentage > 10 && entertainmentTotal > 300) {
      const potentialSavings = (entertainmentTotal / 3) * 0.25; // Could save 25% monthly

      opportunities.push({
        type: 'category_optimization',
        title: 'Entertainment expenses are high',
        description: `Entertainment is ${Math.round(entertainmentPercentage)}% of spending. Look for free or low-cost alternatives`,
        impact: 'medium',
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        data: {
          currentMonthly: Math.round((entertainmentTotal / 3) * 100) / 100,
          percentage: Math.round(entertainmentPercentage * 10) / 10,
        },
      });
    }

    // 5. Bank fees and interest charges
    const bankFeesCategories = ['Bank Fees', 'ATM Fees', 'Interest Charges', 'Overdraft Fee'];
    const bankFeesTotal = bankFeesCategories.reduce((sum, cat) => sum + (categoryTotals[cat] || 0), 0);

    if (bankFeesTotal > 50) {
      opportunities.push({
        type: 'eliminate_fees',
        title: 'Reduce bank fees',
        description: `You've paid $${Math.round(bankFeesTotal * 100) / 100} in bank fees over 3 months`,
        impact: 'high',
        potentialSavings: Math.round((bankFeesTotal / 3) * 100) / 100, // Could eliminate all fees
        data: {
          totalFees: Math.round(bankFeesTotal * 100) / 100,
          monthlyAverage: Math.round((bankFeesTotal / 3) * 100) / 100,
        },
      });
    }

    // Sort by potential savings
    const sortedOpportunities = opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);

    const totalPotentialSavings = sortedOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);

    return NextResponse.json({
      opportunities: sortedOpportunities,
      summary: {
        totalOpportunities: sortedOpportunities.length,
        totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
        highImpact: sortedOpportunities.filter(o => o.impact === 'high').length,
        mediumImpact: sortedOpportunities.filter(o => o.impact === 'medium').length,
      },
    });
  } catch (error) {
    console.error('Savings opportunities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings opportunities' },
      { status: 500 }
    );
  }
}
