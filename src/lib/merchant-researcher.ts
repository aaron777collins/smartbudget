/**
 * Merchant Research Utility using Claude AI
 *
 * Uses Anthropic's Claude AI to research unknown merchants and suggest categories.
 * Integrates with web search to find merchant information:
 * - Business name and type
 * - Recommended category from Plaid PFCv2 taxonomy
 * - Confidence level
 * - Source URLs for verification
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Merchant research result
 */
export interface MerchantResearchResult {
  merchantName: string;
  businessName?: string;
  businessType?: string;
  categorySlug?: string;
  categoryName?: string;
  subcategorySlug?: string;
  subcategoryName?: string;
  confidence: number;
  reasoning?: string;
  sources?: string[];
  website?: string;
  location?: string;
  error?: string;
}

/**
 * Research a merchant using Claude AI with web search
 *
 * @param merchantName - The merchant name to research
 * @param amount - Transaction amount (optional, for context)
 * @param date - Transaction date (optional, for context)
 * @returns MerchantResearchResult
 */
export async function researchMerchant(
  merchantName: string,
  amount?: number,
  date?: Date
): Promise<MerchantResearchResult> {
  try {
    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable not set');
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Build prompt for Claude
    const prompt = buildResearchPrompt(merchantName, amount, date);

    // Call Claude with web search enabled
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent categorization
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Parse Claude's response
    const result = parseClaudeResponse(merchantName, responseText);

    return result;
  } catch (error) {
    console.error('Merchant research error:', error);
    return {
      merchantName,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Build research prompt for Claude
 */
function buildResearchPrompt(
  merchantName: string,
  amount?: number,
  date?: Date
): string {
  const contextParts: string[] = [];

  if (amount !== undefined) {
    contextParts.push(`Amount: $${amount.toFixed(2)}`);
  }

  if (date) {
    contextParts.push(`Date: ${date.toISOString().split('T')[0]}`);
  }

  const context = contextParts.length > 0 ? `\n${contextParts.join('\n')}` : '';

  return `You are helping categorize financial transactions. Research this merchant and suggest the best category.

Merchant Name: ${merchantName}${context}

Your task:
1. Search for information about this merchant (business name, type, industry)
2. Determine what type of business this is
3. Suggest the BEST MATCHING category from the Plaid Personal Finance Categories v2 taxonomy below
4. Provide your reasoning and confidence level

Plaid PFCv2 Categories (use the SLUG, not the full name):

PRIMARY CATEGORIES:
- INCOME (wages, dividends, interest, tax_refund, retirement_pension)
- TRANSFER_IN / TRANSFER_OUT (deposit, withdrawal, investment_transfer, savings_transfer)
- LOAN_PAYMENTS (car_payment, credit_card_payment, mortgage_payment, student_loan, personal_loan)
- BANK_FEES (atm_fee, foreign_transaction_fee, overdraft_fee, interest_charge)
- ENTERTAINMENT (gambling, music_and_audio, sporting_events, museums, movies, video_games)
- FOOD_AND_DRINK (groceries, restaurants, fast_food, coffee, bars, vending_machines)
- GENERAL_MERCHANDISE (clothing, electronics, books, department_stores, online_marketplaces, pet_supplies, sporting_goods)
- HOME_IMPROVEMENT (furniture, hardware, repair_and_maintenance, security)
- MEDICAL (dental_care, eye_care, nursing_care, pharmacies, primary_care, veterinary_services)
- PERSONAL_CARE (gyms_and_fitness, hair_and_beauty, laundry_and_dry_cleaning, spa_and_massage)
- GENERAL_SERVICES (accounting, automotive, childcare, consulting_and_legal, education, insurance, postage_and_shipping, storage)
- GOVERNMENT_AND_NON_PROFIT (donations, government_agencies, tax_payment)
- TRANSPORTATION (gas_stations, parking, public_transportation, taxis_and_ride_shares, tolls, vehicle_maintenance)
- TRAVEL (flights, lodging, rental_cars)
- RENT_AND_UTILITIES (rent, electricity_and_gas, internet_and_cable, telephone, water)
- GENERAL (miscellaneous, other)

Response format (JSON):
{
  "businessName": "Full official business name (if found)",
  "businessType": "Type of business (e.g., restaurant, gas station, online retailer)",
  "categorySlug": "PRIMARY_CATEGORY_SLUG (uppercase with underscores)",
  "categoryName": "Human-readable category name",
  "subcategorySlug": "subcategory_slug (lowercase with underscores, if applicable)",
  "subcategoryName": "Human-readable subcategory name (if applicable)",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen",
  "sources": ["URL1", "URL2"],
  "website": "Official website (if found)",
  "location": "City, Province/State (if applicable)"
}

Important:
- Use UPPERCASE_WITH_UNDERSCORES for categorySlug (e.g., FOOD_AND_DRINK)
- Use lowercase_with_underscores for subcategorySlug (e.g., restaurants)
- Confidence: 0.0-1.0 (0.9+ for well-known merchants, 0.7-0.89 for likely matches, <0.7 for uncertain)
- If you cannot find information, set confidence to 0.5 or lower
- Provide sources (URLs) for verification when possible
- Return ONLY the JSON object, no additional text

Search the web now and provide your response:`;
}

/**
 * Parse Claude's JSON response
 */
function parseClaudeResponse(
  merchantName: string,
  responseText: string
): MerchantResearchResult {
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate and return result
    return {
      merchantName,
      businessName: parsed.businessName || undefined,
      businessType: parsed.businessType || undefined,
      categorySlug: parsed.categorySlug || undefined,
      categoryName: parsed.categoryName || undefined,
      subcategorySlug: parsed.subcategorySlug || undefined,
      subcategoryName: parsed.subcategoryName || undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning || undefined,
      sources: Array.isArray(parsed.sources) ? parsed.sources : undefined,
      website: parsed.website || undefined,
      location: parsed.location || undefined,
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    console.error('Response text:', responseText);

    // Return error result
    return {
      merchantName,
      confidence: 0,
      error: 'Failed to parse AI response',
    };
  }
}

/**
 * Batch research multiple merchants
 *
 * @param merchants - Array of merchant names to research
 * @param maxConcurrent - Maximum concurrent API calls (default: 3)
 * @returns Array of MerchantResearchResult
 */
export async function researchMerchantsBatch(
  merchants: Array<{ merchantName: string; amount?: number; date?: Date }>,
  maxConcurrent: number = 3
): Promise<MerchantResearchResult[]> {
  const results: MerchantResearchResult[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < merchants.length; i += maxConcurrent) {
    const batch = merchants.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map((m) => researchMerchant(m.merchantName, m.amount, m.date))
    );
    results.push(...batchResults);

    // Add small delay between batches to respect rate limits
    if (i + maxConcurrent < merchants.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
