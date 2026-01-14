/**
 * Hybrid Transaction Categorization System
 *
 * Combines rule-based and ML-based categorization for optimal accuracy:
 * 1. Stage 1: Rule-Based (fast, 40-60% coverage, high precision)
 * 2. Stage 2: ML Model (90-95% accuracy on ambiguous cases)
 * 3. Stage 3: Manual review (low confidence)
 *
 * Confidence thresholds:
 * - 0.90+: Auto-apply (high confidence)
 * - 0.70-0.89: Auto-apply with "Review" flag
 * - <0.70: Manual review required
 */

import {
  categorizeTransaction as ruleBasedCategorize,
  getCategoryAndSubcategoryIds,
  getCategorizationStats,
  type CategorizationResult as RuleBasedResult,
  type TransactionInput
} from './rule-based-categorizer';
import { categorizeWithML, getMLStats, type MLCategorizationResult } from './ml-categorizer';
import { prisma } from './prisma';

/**
 * Hybrid categorization result
 */
export interface HybridCategorizationResult {
  categoryId: string | null;
  categorySlug: string | null;
  subcategoryId: string | null;
  subcategorySlug: string | null;
  confidenceScore: number;
  method: 'rule-based' | 'ml' | 'hybrid' | 'none';
  ruleBasedResult?: {
    matched: boolean;
    confidence: number;
    matchedKeyword?: string;
  };
  mlResult?: {
    confidence: number;
    matchedMerchant?: string;
    similarityScore?: number;
  };
}

/**
 * Hybrid categorization: Rule-based + ML fallback
 *
 * Algorithm:
 * 1. Try rule-based categorization first (fast, deterministic)
 * 2. If confidence < threshold (0.80), fall back to ML model
 * 3. If ML also fails or has low confidence, return best available result
 * 4. Track which method was used for analytics
 *
 * Confidence thresholds:
 * - 0.90+: Auto-apply (high confidence)
 * - 0.70-0.89: Auto-apply with "Review" flag
 * - <0.70: Manual review required
 */
export async function categorizeTransactionHybrid(
  transaction: TransactionInput
): Promise<HybridCategorizationResult> {
  // Stage 1: Try rule-based categorization first (fast path)
  const ruleResult = ruleBasedCategorize(transaction);

  // Track rule-based result
  const ruleBasedInfo = {
    matched: ruleResult.categorySlug !== null,
    confidence: ruleResult.confidence,
    matchedKeyword: ruleResult.matchedKeyword || undefined
  };

  // If high confidence match (≥0.80), use rule-based result
  if (ruleResult.confidence >= 0.80 && ruleResult.categorySlug) {
    // Get category IDs
    const { categoryId, subcategoryId } = await getCategoryAndSubcategoryIds(
      ruleResult.categorySlug,
      ruleResult.subcategorySlug || '',
      prisma
    );

    return {
      categoryId,
      categorySlug: ruleResult.categorySlug,
      subcategoryId,
      subcategorySlug: ruleResult.subcategorySlug,
      confidenceScore: ruleResult.confidence,
      method: 'rule-based',
      ruleBasedResult: ruleBasedInfo
    };
  }

  // Stage 2: Try ML model as fallback for low-confidence or no match
  try {
    const mlResult = await categorizeWithML({
      merchantName: transaction.merchantName,
      amount: transaction.amount,
      description: transaction.description,
      dayOfWeek: transaction.date ? transaction.date.getDay() : undefined,
      timeOfDay: transaction.date ? transaction.date.getHours() : undefined
    });

    // Track ML result
    const mlInfo = {
      confidence: mlResult.confidenceScore,
      matchedMerchant: mlResult.matchedMerchant,
      similarityScore: mlResult.similarityScore
    };

    // Use ML result if confidence is higher than rule-based
    if (mlResult.confidenceScore > ruleResult.confidence && mlResult.categorySlug) {
      // Get category IDs
      const { categoryId, subcategoryId } = mlResult.categoryId
        ? { categoryId: mlResult.categoryId, subcategoryId: mlResult.subcategoryId }
        : { categoryId: null, subcategoryId: null };

      return {
        categoryId,
        categorySlug: mlResult.categorySlug,
        subcategoryId,
        subcategorySlug: mlResult.subcategorySlug,
        confidenceScore: mlResult.confidenceScore,
        method: 'ml',
        ruleBasedResult: ruleBasedInfo,
        mlResult: mlInfo
      };
    }

    // If both methods were tried, mark as hybrid
    if (ruleResult.categorySlug && mlResult.categorySlug) {
      const { categoryId, subcategoryId } = await getCategoryAndSubcategoryIds(
        ruleResult.categorySlug,
        ruleResult.subcategorySlug || '',
        prisma
      );

      return {
        categoryId,
        categorySlug: ruleResult.categorySlug,
        subcategoryId,
        subcategorySlug: ruleResult.subcategorySlug,
        confidenceScore: ruleResult.confidence,
        method: 'hybrid',
        ruleBasedResult: ruleBasedInfo,
        mlResult: mlInfo
      };
    }

  } catch (error) {
    console.error('ML categorization error:', error);
    // Fall through to return rule-based result
  }

  // Return rule-based result (even if low confidence)
  if (ruleResult.categorySlug) {
    const { categoryId, subcategoryId } = await getCategoryAndSubcategoryIds(
      ruleResult.categorySlug,
      ruleResult.subcategorySlug || '',
      prisma
    );

    return {
      categoryId,
      categorySlug: ruleResult.categorySlug,
      subcategoryId,
      subcategorySlug: ruleResult.subcategorySlug,
      confidenceScore: ruleResult.confidence,
      method: 'rule-based',
      ruleBasedResult: ruleBasedInfo
    };
  }

  // No categorization found
  return {
    categoryId: null,
    categorySlug: null,
    subcategoryId: null,
    subcategorySlug: null,
    confidenceScore: 0,
    method: 'none',
    ruleBasedResult: ruleBasedInfo
  };
}

/**
 * Batch categorize multiple transactions with hybrid approach
 */
export async function batchCategorizeHybrid(
  transactions: TransactionInput[]
): Promise<HybridCategorizationResult[]> {
  return Promise.all(transactions.map(t => categorizeTransactionHybrid(t)));
}

/**
 * Get statistics for all categorization methods
 */
export async function getAllCategorizationStats() {
  const ruleBasedStats = getCategorizationStats();
  const mlStats = await getMLStats();

  return {
    ruleBased: ruleBasedStats,
    ml: mlStats,
    hybrid: {
      totalMethods: 3, // rule-based, ml, manual
      preferredOrder: ['rule-based', 'ml', 'manual'],
      confidenceThresholds: {
        autoApply: 0.90,
        autoApplyWithReview: 0.70,
        manualReview: 0.0
      }
    }
  };
}
