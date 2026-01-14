/**
 * Merchant Normalization Pipeline
 *
 * Multi-stage pipeline for normalizing merchant names:
 * 1. Text preprocessing (lowercase, special chars, transaction IDs)
 * 2. Fuzzy matching against knowledge base
 * 3. Canonical name mapping
 *
 * Part of Task 3.3: Merchant Normalization Pipeline
 */

import Fuse from 'fuse.js';
import { prisma } from './prisma';

/**
 * Stage 1: Text Preprocessing
 * Cleans and normalizes raw merchant names
 */
export function preprocessMerchantName(rawMerchant: string): string {
  if (!rawMerchant || !rawMerchant.trim()) {
    return 'Unknown Merchant';
  }

  let normalized = rawMerchant;

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Remove common transaction ID patterns
  // Pattern: #123456, ref#123, trans-123, etc.
  normalized = normalized.replace(/\b(ref|trans|transaction|id|no|num|#)\s*[:#-]?\s*\d+\b/gi, '');

  // Remove date patterns (YYYY-MM-DD, DD/MM/YYYY, etc.)
  normalized = normalized.replace(/\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/g, '');

  // Remove time patterns (HH:MM, HH:MM:SS)
  normalized = normalized.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '');

  // Remove location/address patterns
  // Pattern: "store #123", "location 456", "branch 789"
  normalized = normalized.replace(/\b(store|location|branch|unit)\s*#?\s*\d+\b/gi, '');

  // Remove city/province patterns at end
  // Pattern: "merchant name, city, ON" or "merchant name - city"
  normalized = normalized.replace(/[,\-]\s*[a-z\s]+\s*,?\s*(ab|bc|mb|nb|nl|nt|ns|nu|on|pe|qc|sk|yt)\b/gi, '');

  // Remove postal code patterns (A1A 1A1 or A1A1A1)
  normalized = normalized.replace(/\b[a-z]\d[a-z]\s*\d[a-z]\d\b/gi, '');

  // Remove phone numbers
  normalized = normalized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '');

  // Remove URLs
  normalized = normalized.replace(/https?:\/\/[^\s]+/gi, '');
  normalized = normalized.replace(/www\.[^\s]+/gi, '');

  // Remove email addresses
  normalized = normalized.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '');

  // Remove special characters but keep spaces, ampersands, apostrophes
  normalized = normalized.replace(/[^a-z0-9\s&']/g, ' ');

  // Collapse multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Trim whitespace
  normalized = normalized.trim();

  // Return "Unknown Merchant" if we ended up with empty string
  if (!normalized || normalized.length < 2) {
    return 'Unknown Merchant';
  }

  return normalized;
}

/**
 * Stage 2: Fuzzy Matching
 * Finds similar merchants in the knowledge base using fuzzy string matching
 */
export interface FuzzyMatchResult {
  merchantName: string;
  normalizedName: string;
  score: number; // 0-1, higher is better match
}

export function fuzzyMatchMerchant(
  searchName: string,
  knowledgeBase: Array<{ merchantName: string; normalizedName: string }>,
  threshold: number = 0.6
): FuzzyMatchResult | null {
  if (!searchName || knowledgeBase.length === 0) {
    return null;
  }

  // Configure Fuse.js for fuzzy matching
  const fuse = new Fuse(knowledgeBase, {
    keys: ['merchantName', 'normalizedName'],
    threshold: 1 - threshold, // Fuse uses distance (0-1), we use similarity, so invert
    includeScore: true,
    ignoreLocation: true,
    findAllMatches: false,
    minMatchCharLength: 3,
  });

  const results = fuse.search(searchName);

  if (results.length === 0) {
    return null;
  }

  // Get best match
  const bestMatch = results[0];

  // Convert Fuse distance score to similarity score (0-1)
  const similarityScore = 1 - (bestMatch.score || 1);

  return {
    merchantName: bestMatch.item.merchantName,
    normalizedName: bestMatch.item.normalizedName,
    score: similarityScore,
  };
}

/**
 * Stage 3: Canonical Name Mapping
 * Maps variations of merchant names to canonical names
 */
const canonicalNameMappings: Record<string, string> = {
  // Canadian Groceries
  'loblaws': 'Loblaws',
  'loblaw': 'Loblaws',
  'loblaws supermarket': 'Loblaws',
  'loblaw\'s': 'Loblaws',
  'sobeys': 'Sobeys',
  'sobey': 'Sobeys',
  'sobeys supermarket': 'Sobeys',
  'metro': 'Metro',
  'metro grocery': 'Metro',
  'metro groceries': 'Metro',
  'no frills': 'No Frills',
  'nofrills': 'No Frills',
  'fortinos': 'Fortinos',
  'fortino': 'Fortinos',
  'zehrs': 'Zehrs',
  'zehr': 'Zehrs',
  'zehrs markets': 'Zehrs',
  'real canadian superstore': 'Real Canadian Superstore',
  'superstore': 'Real Canadian Superstore',
  'rcss': 'Real Canadian Superstore',
  'walmart': 'Walmart',
  'wal mart': 'Walmart',
  'walmart supercenter': 'Walmart',
  'walmart supercentre': 'Walmart',
  'costco': 'Costco',
  'costco wholesale': 'Costco',

  // Coffee Shops
  'tim hortons': 'Tim Hortons',
  'tim horton': 'Tim Hortons',
  'tims': 'Tim Hortons',
  'timmy': 'Tim Hortons',
  'timmy\'s': 'Tim Hortons',
  'timmies': 'Tim Hortons',
  'starbucks': 'Starbucks',
  'starbucks coffee': 'Starbucks',
  'sbux': 'Starbucks',
  'second cup': 'Second Cup',
  'second cup coffee': 'Second Cup',

  // Fast Food
  'mcdonalds': 'McDonald\'s',
  'mcdonald': 'McDonald\'s',
  'mcd': 'McDonald\'s',
  'mcds': 'McDonald\'s',
  'burger king': 'Burger King',
  'bk': 'Burger King',
  'wendys': 'Wendy\'s',
  'wendy': 'Wendy\'s',
  'a&w': 'A&W',
  'a & w': 'A&W',
  'a and w': 'A&W',
  'subway': 'Subway',
  'subway sandwiches': 'Subway',
  'tim': 'Tim Hortons',

  // Gas Stations
  'petro canada': 'Petro-Canada',
  'petro can': 'Petro-Canada',
  'petro': 'Petro-Canada',
  'esso': 'Esso',
  'esso gas': 'Esso',
  'shell': 'Shell',
  'shell gas': 'Shell',
  'shell canada': 'Shell',
  'husky': 'Husky',
  'husky energy': 'Husky',
  'pioneer': 'Pioneer',
  'pioneer gas': 'Pioneer',

  // Canadian Banks
  'cibc': 'CIBC',
  'cibc bank': 'CIBC',
  'canadian imperial bank': 'CIBC',
  'td': 'TD Bank',
  'td bank': 'TD Bank',
  'td canada trust': 'TD Bank',
  'rbc': 'RBC',
  'rbc bank': 'RBC',
  'royal bank': 'RBC',
  'royal bank of canada': 'RBC',
  'bmo': 'BMO',
  'bmo bank': 'BMO',
  'bank of montreal': 'BMO',
  'scotiabank': 'Scotiabank',
  'scotia': 'Scotiabank',
  'bank of nova scotia': 'Scotiabank',

  // Telecom
  'rogers': 'Rogers',
  'rogers communications': 'Rogers',
  'rogers wireless': 'Rogers',
  'bell': 'Bell',
  'bell canada': 'Bell',
  'bell mobility': 'Bell',
  'telus': 'Telus',
  'telus communications': 'Telus',
  'telus mobility': 'Telus',
  'fido': 'Fido',
  'fido solutions': 'Fido',

  // Pharmacy
  'shoppers drug mart': 'Shoppers Drug Mart',
  'shoppers': 'Shoppers Drug Mart',
  'sdm': 'Shoppers Drug Mart',
  'rexall': 'Rexall',
  'rexall pharmacy': 'Rexall',
  'pharma plus': 'Pharma Plus',
  'pharmaplus': 'Pharma Plus',

  // Retail
  'canadian tire': 'Canadian Tire',
  'can tire': 'Canadian Tire',
  'ct': 'Canadian Tire',
  'dollarama': 'Dollarama',
  'dollar store': 'Dollarama',
  'winners': 'Winners',
  'tj maxx': 'Winners',
  'marshalls': 'Marshalls',

  // Online
  'amazon': 'Amazon',
  'amazon.ca': 'Amazon',
  'amazon ca': 'Amazon',
  'amazon.com': 'Amazon',
  'netflix': 'Netflix',
  'netflix.com': 'Netflix',
  'spotify': 'Spotify',
  'spotify premium': 'Spotify',

  // Transit
  'ttc': 'TTC',
  'toronto transit': 'TTC',
  'toronto transit commission': 'TTC',
  'go transit': 'GO Transit',
  'go train': 'GO Transit',
  'go bus': 'GO Transit',
  'presto': 'Presto',
  'presto card': 'Presto',

  // Entertainment
  'cineplex': 'Cineplex',
  'cineplex odeon': 'Cineplex',
  'cineplex entertainment': 'Cineplex',
  'lcbo': 'LCBO',
  'liquor control board': 'LCBO',
  'beer store': 'The Beer Store',
  'the beer store': 'The Beer Store',

  // Utilities
  'toronto hydro': 'Toronto Hydro',
  'hydro one': 'Hydro One',
  'enbridge': 'Enbridge',
  'enbridge gas': 'Enbridge',
};

export function getCanonicalName(normalizedName: string): string {
  const lower = normalizedName.toLowerCase().trim();
  return canonicalNameMappings[lower] || capitalizeWords(normalizedName);
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Full Merchant Normalization Pipeline
 * Combines all stages: preprocessing, fuzzy matching, canonical mapping
 */
export interface NormalizationResult {
  original: string;
  preprocessed: string;
  normalized: string;
  matchedFrom?: string; // If matched from knowledge base
  confidence: number; // 0-1
  source: 'preprocessing' | 'fuzzy_match' | 'canonical_map' | 'knowledge_base';
}

export async function normalizeMerchantName(
  rawMerchant: string,
  useDatabase: boolean = true
): Promise<NormalizationResult> {
  // Stage 1: Preprocessing
  const preprocessed = preprocessMerchantName(rawMerchant);

  // Stage 2: Check canonical mappings first (highest confidence)
  const canonical = getCanonicalName(preprocessed);
  if (canonical !== capitalizeWords(preprocessed)) {
    return {
      original: rawMerchant,
      preprocessed,
      normalized: canonical,
      confidence: 0.95,
      source: 'canonical_map',
    };
  }

  // Stage 3: Fuzzy matching against knowledge base (if enabled)
  if (useDatabase) {
    try {
      const knowledgeBase = await prisma.merchantKnowledge.findMany({
        select: {
          merchantName: true,
          normalizedName: true,
        },
      });

      if (knowledgeBase.length > 0) {
        const fuzzyMatch = fuzzyMatchMerchant(preprocessed, knowledgeBase, 0.7);

        if (fuzzyMatch && fuzzyMatch.score >= 0.7) {
          return {
            original: rawMerchant,
            preprocessed,
            normalized: fuzzyMatch.normalizedName,
            matchedFrom: fuzzyMatch.merchantName,
            confidence: fuzzyMatch.score * 0.9, // Slightly reduce confidence for fuzzy matches
            source: 'knowledge_base',
          };
        }
      }
    } catch (error) {
      // Database not available or error - continue with preprocessing result
      console.warn('Merchant knowledge base lookup failed:', error);
    }
  }

  // Stage 4: Return preprocessed + capitalized as fallback
  return {
    original: rawMerchant,
    preprocessed,
    normalized: canonical,
    confidence: 0.6,
    source: 'preprocessing',
  };
}

/**
 * Batch normalization for multiple merchants
 */
export async function normalizeMerchants(
  merchants: string[],
  useDatabase: boolean = true
): Promise<NormalizationResult[]> {
  return Promise.all(
    merchants.map(merchant => normalizeMerchantName(merchant, useDatabase))
  );
}

/**
 * Add merchant to knowledge base for future matching
 */
export async function addToKnowledgeBase(
  merchantName: string,
  normalizedName: string,
  categoryId: string,
  source: string = 'user',
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.merchantKnowledge.upsert({
    where: { merchantName },
    update: {
      normalizedName,
      categoryId,
      source,
      metadata: metadata || {},
      updatedAt: new Date(),
    },
    create: {
      merchantName,
      normalizedName,
      categoryId,
      confidenceScore: 0.9,
      source,
      metadata: metadata || {},
    },
  });
}

/**
 * Get merchant statistics
 */
export async function getMerchantStats(): Promise<{
  totalMerchants: number;
  normalizedMerchants: number;
  knowledgeBaseSize: number;
}> {
  const [totalMerchants, knowledgeBaseSize] = await Promise.all([
    prisma.transaction.findMany({
      select: { merchantName: true },
      distinct: ['merchantName'],
    }),
    prisma.merchantKnowledge.count(),
  ]);

  return {
    totalMerchants: totalMerchants.length,
    normalizedMerchants: knowledgeBaseSize,
    knowledgeBaseSize,
  };
}
