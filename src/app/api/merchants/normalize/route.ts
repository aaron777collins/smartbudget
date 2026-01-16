/**
 * Merchant Normalization API Endpoint
 *
 * POST /api/merchants/normalize
 * - Normalizes merchant names using the merchant normalization pipeline
 * - Supports single merchant or batch normalization
 *
 * Part of Task 3.3: Merchant Normalization Pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  normalizeMerchantName,
  normalizeMerchants,
  NormalizationResult,
} from '@/lib/merchant-normalizer';

/**
 * POST /api/merchants/normalize
 * Normalize one or more merchant names
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (!body.merchant && !body.merchants) {
      return NextResponse.json(
        { error: 'Either "merchant" or "merchants" array is required' },
        { status: 400 }
      );
    }

    const useDatabase = body.useDatabase !== false; // Default true

    // Handle single merchant normalization
    if (body.merchant) {
      if (typeof body.merchant !== 'string') {
        return NextResponse.json(
          { error: 'Merchant must be a string' },
          { status: 400 }
        );
      }

      const result = await normalizeMerchantName(body.merchant, useDatabase);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Handle batch merchant normalization
    if (body.merchants) {
      if (!Array.isArray(body.merchants)) {
        return NextResponse.json(
          { error: 'Merchants must be an array' },
          { status: 400 }
        );
      }

      if (body.merchants.length === 0) {
        return NextResponse.json(
          { error: 'Merchants array cannot be empty' },
          { status: 400 }
        );
      }

      if (body.merchants.length > 1000) {
        return NextResponse.json(
          { error: 'Maximum 1000 merchants per request' },
          { status: 400 }
        );
      }

      // Validate all merchants are strings
      const allStrings = body.merchants.every(
        (m: unknown) => typeof m === 'string'
      );
      if (!allStrings) {
        return NextResponse.json(
          { error: 'All merchants must be strings' },
          { status: 400 }
        );
      }

      const results = await normalizeMerchants(body.merchants, useDatabase);

      // Calculate statistics
      const stats = {
        total: results.length,
        bySource: {
          preprocessing: results.filter(r => r.source === 'preprocessing').length,
          canonical_map: results.filter(r => r.source === 'canonical_map').length,
          fuzzy_match: results.filter(r => r.source === 'fuzzy_match').length,
          knowledge_base: results.filter(r => r.source === 'knowledge_base').length,
        },
        averageConfidence:
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      };

      return NextResponse.json({
        success: true,
        results,
        stats,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Merchant normalization error:', error);
    return NextResponse.json(
      { error: 'Failed to normalize merchant names', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
