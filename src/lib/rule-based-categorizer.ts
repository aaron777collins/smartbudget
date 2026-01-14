/**
 * Rule-Based Categorization Engine
 *
 * This module provides the core rule-based categorization logic for transactions.
 * It matches transaction descriptions and merchant names against keyword rules
 * to automatically assign categories and subcategories.
 *
 * Features:
 * - Keyword matching (case-insensitive, partial matching)
 * - Priority-based rule matching (higher priority rules checked first)
 * - Confidence scoring
 * - MCC code support (future enhancement)
 * - Amount-based rules (future enhancement)
 */

import { SORTED_RULES, type CategorizationRule } from './categorization-rules';

export interface CategorizationResult {
  categorySlug: string | null;
  subcategorySlug: string | null;
  confidence: number;
  matchedRule: CategorizationRule | null;
  matchedKeyword: string | null;
  method: 'rule-based' | 'ml' | 'manual' | 'none';
}

export interface TransactionInput {
  description: string;
  merchantName: string;
  amount: number;
  date?: Date;
  mccCode?: string; // Merchant Category Code (future enhancement)
}

/**
 * Normalize text for matching (lowercase, remove special chars, trim)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Check if text contains keyword
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  // Match whole words or phrases
  return normalizedText.includes(normalizedKeyword);
}

/**
 * Categorize transaction using rule-based matching
 *
 * Algorithm:
 * 1. Normalize description and merchant name
 * 2. Check rules in priority order (highest first)
 * 3. For each rule, check if any keyword matches
 * 4. Return first match (highest priority)
 * 5. If no match, return null with low confidence
 */
export function categorizeTransaction(transaction: TransactionInput): CategorizationResult {
  const { description, merchantName, amount } = transaction;

  // Combine description and merchant name for matching
  const combinedText = `${description} ${merchantName}`;

  // Try to match against rules (sorted by priority)
  for (const rule of SORTED_RULES) {
    // Check each keyword in the rule
    for (const keyword of rule.keywords) {
      if (containsKeyword(combinedText, keyword)) {
        // Found a match!
        return {
          categorySlug: rule.categorySlug,
          subcategorySlug: rule.subcategorySlug,
          confidence: rule.confidence,
          matchedRule: rule,
          matchedKeyword: keyword,
          method: 'rule-based'
        };
      }
    }
  }

  // No match found
  return {
    categorySlug: null,
    subcategorySlug: null,
    confidence: 0,
    matchedRule: null,
    matchedKeyword: null,
    method: 'none'
  };
}

/**
 * Batch categorize multiple transactions
 */
export function batchCategorize(transactions: TransactionInput[]): CategorizationResult[] {
  return transactions.map(transaction => categorizeTransaction(transaction));
}

/**
 * Get category and subcategory IDs from slugs
 * This function queries the database to convert slugs to UUIDs
 */
export async function getCategoryAndSubcategoryIds(
  categorySlug: string,
  subcategorySlug: string,
  prisma: any // PrismaClient
): Promise<{ categoryId: string | null; subcategoryId: string | null }> {
  try {
    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });

    if (!category) {
      return { categoryId: null, subcategoryId: null };
    }

    // Find subcategory by slug
    const subcategory = await prisma.subcategory.findUnique({
      where: { slug: subcategorySlug }
    });

    return {
      categoryId: category.id,
      subcategoryId: subcategory?.id || null
    };
  } catch (error) {
    console.error('Error getting category IDs:', error);
    return { categoryId: null, subcategoryId: null };
  }
}

/**
 * Get statistics about rule coverage
 * Useful for understanding categorization performance
 */
export interface CategorizationStats {
  totalRules: number;
  totalKeywords: number;
  categoriesCount: number;
  subcategoriesCount: number;
  averageConfidence: number;
  rulesByCategory: Record<string, number>;
}

export function getCategorizationStats(): CategorizationStats {
  const categories = new Set<string>();
  const subcategories = new Set<string>();
  let totalKeywords = 0;
  let totalConfidence = 0;
  const rulesByCategory: Record<string, number> = {};

  for (const rule of SORTED_RULES) {
    categories.add(rule.categorySlug);
    subcategories.add(rule.subcategorySlug);
    totalKeywords += rule.keywords.length;
    totalConfidence += rule.confidence;

    rulesByCategory[rule.categorySlug] = (rulesByCategory[rule.categorySlug] || 0) + 1;
  }

  return {
    totalRules: SORTED_RULES.length,
    totalKeywords,
    categoriesCount: categories.size,
    subcategoriesCount: subcategories.size,
    averageConfidence: totalConfidence / SORTED_RULES.length,
    rulesByCategory
  };
}
