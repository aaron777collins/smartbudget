/**
 * Transaction Categorization API Endpoint
 *
 * POST /api/transactions/categorize
 * - Categorize a single transaction or batch of transactions
 *
 * PUT /api/transactions/categorize/bulk
 * - Bulk categorize multiple existing transactions
 *
 * Rate limited (EXPENSIVE tier): 10 requests per hour
 */

import { NextResponse } from 'next/server';
import { withExpensiveOp } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import { categorizeTransaction, batchCategorize, getCategoryAndSubcategoryIds } from '@/lib/rule-based-categorizer';

/**
 * POST /api/transactions/categorize
 * Categorize a single transaction or batch of transactions
 *
 * Request body:
 * - transactions: Array of { description, merchantName, amount, transactionId? }
 *
 * Response:
 * - results: Array of categorization results with category/subcategory info
 */
export const POST = withExpensiveOp(async (req, context) => {
  const body = await req.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid request: transactions array required' },
        { status: 400 }
      );
    }

    // Categorize all transactions
    const categorizationResults = batchCategorize(transactions);

    // Enrich results with category/subcategory details
    const enrichedResults = await Promise.all(
      categorizationResults.map(async (result, index) => {
        if (result.categorySlug && result.subcategorySlug) {
          // Get category and subcategory details from database
          const { categoryId, subcategoryId } = await getCategoryAndSubcategoryIds(
            result.categorySlug,
            result.subcategorySlug,
            prisma
          );

          // Fetch full category and subcategory data
          let category = null;
          let subcategory = null;

          if (categoryId) {
            category = await prisma.category.findUnique({
              where: { id: categoryId }
            });
          }

          if (subcategoryId) {
            subcategory = await prisma.subcategory.findUnique({
              where: { id: subcategoryId }
            });
          }

          return {
            transactionId: transactions[index].transactionId || null,
            categoryId,
            subcategoryId,
            category,
            subcategory,
            confidence: result.confidence,
            matchedKeyword: result.matchedKeyword,
            method: result.method
          };
        }

        return {
          transactionId: transactions[index].transactionId || null,
          categoryId: null,
          subcategoryId: null,
          category: null,
          subcategory: null,
          confidence: 0,
          matchedKeyword: null,
          method: 'none'
        };
      })
    );

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      stats: {
        total: transactions.length,
        categorized: enrichedResults.filter(r => r.categoryId).length,
        uncategorized: enrichedResults.filter(r => !r.categoryId).length
      }
    });
});

/**
 * PUT /api/transactions/categorize/bulk
 * Bulk categorize and update existing transactions in database
 *
 * Request body:
 * - transactionIds: Array of transaction IDs to categorize
 * - force: boolean - if true, re-categorize already categorized transactions
 *
 * Response:
 * - updated: number of transactions updated
 * - skipped: number of transactions skipped
 * - errors: number of errors
 */
export const PUT = withExpensiveOp(async (req, context) => {
  const body = await req.json();
    const { transactionIds, force = false } = body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: 'Invalid request: transactionIds array required' },
        { status: 400 }
      );
    }

    const userId = context.userId;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId
      }
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found' },
        { status: 404 }
      );
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Categorize each transaction
    for (const transaction of transactions) {
      try {
        // Skip if already categorized and force is false
        if (transaction.categoryId && !force) {
          skipped++;
          continue;
        }

        // Categorize transaction
        const result = categorizeTransaction({
          description: transaction.description,
          merchantName: transaction.merchantName,
          amount: Number(transaction.amount)
        });

        // If we got a result, update the transaction
        if (result.categorySlug && result.subcategorySlug) {
          const { categoryId, subcategoryId } = await getCategoryAndSubcategoryIds(
            result.categorySlug,
            result.subcategorySlug,
            prisma
          );

          if (categoryId) {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                categoryId,
                subcategoryId,
                confidenceScore: result.confidence
              }
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error categorizing transaction ${transaction.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors,
      total: transactions.length
    });
});
