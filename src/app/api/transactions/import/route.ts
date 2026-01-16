import { NextResponse } from 'next/server';
import { withExpensiveOp } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import type { AccountType, TransactionType } from '@prisma/client';
import { categorizeTransactionHybrid } from '@/lib/hybrid-categorizer';
import { normalizeMerchantName, addToKnowledgeBase } from '@/lib/merchant-normalizer';

interface ParsedTransaction {
  date: Date;
  postedDate?: Date;
  description: string;
  merchantName: string;
  amount: number;
  type: TransactionType;
  fitid?: string;
  rawData?: Record<string, unknown>;
  accountNumber?: string;
  balance?: number;
}

interface ImportTransactionRequest {
  transactions: ParsedTransaction[];
  accountInfo?: {
    name: string;
    institution: string;
    accountType: AccountType;
    accountNumber?: string;
    currency?: string;
  };
  accountId?: string;
}

export const POST = withExpensiveOp(async (req, context) => {
  const userId = context.userId;
  const body: ImportTransactionRequest = await req.json();
    const { transactions, accountInfo, accountId } = body;

    // Validate request
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    // Get or create account
    let account;
    if (accountId) {
      // Use existing account
      account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
    } else if (accountInfo) {
      // Create or find account by institution and account number
      const accountNumber = accountInfo.accountNumber || 'Unknown';
      account = await prisma.account.findFirst({
        where: {
          userId,
          institution: accountInfo.institution,
          accountNumber
        }
      });

      if (!account) {
        account = await prisma.account.create({
          data: {
            userId,
            name: accountInfo.name,
            institution: accountInfo.institution,
            accountType: accountInfo.accountType,
            accountNumber,
            currency: accountInfo.currency || 'CAD',
            currentBalance: 0 // Will be updated by transactions
          }
        });
      }
    } else {
      // Create default account
      account = await prisma.account.create({
        data: {
          userId,
          name: 'Imported Account',
          institution: 'CIBC',
          accountType: 'CHECKING',
          accountNumber: 'Unknown',
          currency: 'CAD',
          currentBalance: 0
        }
      });
    }

    // Filter out duplicates by checking FITID
    const existingFitids = await prisma.transaction.findMany({
      where: {
        userId,
        accountId: account.id,
        fitid: {
          in: transactions.filter(t => t.fitid).map(t => t.fitid!)
        }
      },
      select: {
        fitid: true
      }
    });

    const existingFitidSet = new Set(existingFitids.map(t => t.fitid));

    // Create transaction signature for duplicate detection (for CSV without FITID)
    const createSignature = (t: ParsedTransaction) => {
      return `${t.date.toISOString()}-${t.merchantName}-${t.amount}`;
    };

    // Get existing transactions by signature
    const transactionsWithoutFitid = transactions.filter(t => !t.fitid);
    const existingBySignature = await prisma.transaction.findMany({
      where: {
        userId,
        accountId: account.id,
        date: {
          in: transactionsWithoutFitid.map(t => t.date)
        }
      },
      select: {
        date: true,
        merchantName: true,
        amount: true
      }
    });

    const existingSignatureSet = new Set(
      existingBySignature.map(t =>
        `${t.date.toISOString()}-${t.merchantName}-${t.amount.toString()}`
      )
    );

    // Filter transactions
    const newTransactions = transactions.filter(t => {
      if (t.fitid && existingFitidSet.has(t.fitid)) {
        return false; // Skip duplicates by FITID
      }
      if (!t.fitid && existingSignatureSet.has(createSignature(t))) {
        return false; // Skip duplicates by signature
      }
      return true;
    });

    // Normalize merchants and categorize transactions before import
    const categorizedData = await Promise.all(
      newTransactions.map(async (t) => {
        // Step 1: Normalize merchant name using full pipeline (preprocessing + fuzzy matching + canonical mapping)
        const normalizationResult = await normalizeMerchantName(t.merchantName, true);
        const normalizedMerchant = normalizationResult.normalized;

        // Step 2: Categorize transaction using HYBRID engine (rule-based + ML fallback)
        const categorizationResult = await categorizeTransactionHybrid({
          description: t.description,
          merchantName: normalizedMerchant, // Use normalized merchant name for better categorization
          amount: t.amount,
          date: t.date
        });

        // Get category and subcategory IDs if categorized
        const categoryId = categorizationResult.categoryId;
        const subcategoryId = categorizationResult.subcategoryId;
        const confidenceScore = categorizationResult.confidenceScore;

        // Step 3: Add normalized merchant to knowledge base if categorized
        // This builds the knowledge base over time for better fuzzy matching and ML training
        if (categoryId && normalizedMerchant !== 'Unknown Merchant') {
          try {
            await addToKnowledgeBase(
              normalizedMerchant.toLowerCase(),
              normalizedMerchant,
              categoryId,
              'auto_categorization',
              {
                normalizationSource: normalizationResult.source,
                normalizationConfidence: normalizationResult.confidence,
                categorizationConfidence: confidenceScore,
                categorizationMethod: categorizationResult.method
              }
            );
          } catch (error) {
            // Non-critical error, continue with import
            console.warn('Failed to add merchant to knowledge base:', error);
          }
        }

        return {
          userId,
          accountId: account.id,
          date: t.date,
          postedDate: t.postedDate,
          description: t.description,
          merchantName: normalizedMerchant, // Use normalized merchant name in database
          amount: t.amount,
          type: t.type,
          fitid: t.fitid,
          rawData: t.rawData as any,
          categoryId,
          subcategoryId,
          confidenceScore,
          isReconciled: false,
          isRecurring: false,
          userCorrected: false
        };
      })
    );

    // Import transactions with categorization
    const importedTransactions = await prisma.transaction.createMany({
      data: categorizedData
    });

    // Count how many were auto-categorized
    const categorizedCount = categorizedData.filter(t => t.categoryId !== null).length;

    // Update account balance (use the latest balance from the import if available)
    const latestTransaction = transactions
      .filter(t => t.balance !== undefined)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (latestTransaction?.balance !== undefined) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          currentBalance: latestTransaction.balance
        }
      });
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      accountName: account.name,
      totalTransactions: transactions.length,
      importedCount: importedTransactions.count,
      duplicatesSkipped: transactions.length - importedTransactions.count,
      categorizedCount,
      uncategorizedCount: importedTransactions.count - categorizedCount
    });
});
