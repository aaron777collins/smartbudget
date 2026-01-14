/**
 * Merchant Knowledge Base Seed Data
 *
 * Common Canadian merchants with normalized names and categories
 * Used for fuzzy matching and auto-categorization
 *
 * Part of Task 3.3: Merchant Normalization Pipeline
 */

export interface MerchantKnowledgeEntry {
  merchantName: string;
  normalizedName: string;
  categorySlug: string;
  subcategorySlug?: string;
  confidenceScore: number;
  source: string;
  metadata?: {
    description?: string;
    website?: string;
    industry?: string;
  };
}

export const merchantKnowledgeData: MerchantKnowledgeEntry[] = [
  // === GROCERIES (FOOD_AND_DRINK > GROCERIES) ===
  {
    merchantName: 'loblaws',
    normalizedName: 'Loblaws',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Canadian grocery store chain' },
  },
  {
    merchantName: 'sobeys',
    normalizedName: 'Sobeys',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Canadian grocery store chain' },
  },
  {
    merchantName: 'metro',
    normalizedName: 'Metro',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Canadian grocery store chain' },
  },
  {
    merchantName: 'no frills',
    normalizedName: 'No Frills',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Canadian discount grocery chain' },
  },
  {
    merchantName: 'fortinos',
    normalizedName: 'Fortinos',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Ontario grocery chain' },
  },
  {
    merchantName: 'zehrs',
    normalizedName: 'Zehrs',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Ontario grocery chain' },
  },
  {
    merchantName: 'real canadian superstore',
    normalizedName: 'Real Canadian Superstore',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'groceries',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'grocery', description: 'Canadian supermarket chain' },
  },
  {
    merchantName: 'walmart',
    normalizedName: 'Walmart',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'superstores',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'retail', description: 'Big box retailer' },
  },
  {
    merchantName: 'costco',
    normalizedName: 'Costco',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'superstores',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'retail', description: 'Warehouse club' },
  },

  // === COFFEE SHOPS (FOOD_AND_DRINK > COFFEE) ===
  {
    merchantName: 'tim hortons',
    normalizedName: 'Tim Hortons',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'coffee',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Canadian coffee chain' },
  },
  {
    merchantName: 'starbucks',
    normalizedName: 'Starbucks',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'coffee',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'International coffee chain' },
  },
  {
    merchantName: 'second cup',
    normalizedName: 'Second Cup',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'coffee',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Canadian coffee chain' },
  },

  // === FAST FOOD (FOOD_AND_DRINK > FAST_FOOD) ===
  {
    merchantName: 'mcdonalds',
    normalizedName: 'McDonald\'s',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'fast-food',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Fast food chain' },
  },
  {
    merchantName: 'burger king',
    normalizedName: 'Burger King',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'fast-food',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Fast food chain' },
  },
  {
    merchantName: 'wendys',
    normalizedName: 'Wendy\'s',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'fast-food',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Fast food chain' },
  },
  {
    merchantName: 'a&w',
    normalizedName: 'A&W',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'fast-food',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Canadian fast food chain' },
  },
  {
    merchantName: 'subway',
    normalizedName: 'Subway',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'fast-food',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'food_service', description: 'Sandwich chain' },
  },

  // === GAS STATIONS (TRANSPORTATION > GAS) ===
  {
    merchantName: 'petro canada',
    normalizedName: 'Petro-Canada',
    categorySlug: 'transportation',
    subcategorySlug: 'gas',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'gas_station', description: 'Canadian gas station chain' },
  },
  {
    merchantName: 'esso',
    normalizedName: 'Esso',
    categorySlug: 'transportation',
    subcategorySlug: 'gas',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'gas_station', description: 'Gas station chain' },
  },
  {
    merchantName: 'shell',
    normalizedName: 'Shell',
    categorySlug: 'transportation',
    subcategorySlug: 'gas',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'gas_station', description: 'Gas station chain' },
  },
  {
    merchantName: 'husky',
    normalizedName: 'Husky',
    categorySlug: 'transportation',
    subcategorySlug: 'gas',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'gas_station', description: 'Canadian gas station chain' },
  },

  // === BANKS (BANK_FEES or TRANSFER) ===
  {
    merchantName: 'cibc',
    normalizedName: 'CIBC',
    categorySlug: 'bank-fees',
    subcategorySlug: 'service-charges',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'banking', description: 'Canadian Imperial Bank of Commerce' },
  },
  {
    merchantName: 'td bank',
    normalizedName: 'TD Bank',
    categorySlug: 'bank-fees',
    subcategorySlug: 'service-charges',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'banking', description: 'TD Canada Trust' },
  },
  {
    merchantName: 'rbc',
    normalizedName: 'RBC',
    categorySlug: 'bank-fees',
    subcategorySlug: 'service-charges',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'banking', description: 'Royal Bank of Canada' },
  },
  {
    merchantName: 'bmo',
    normalizedName: 'BMO',
    categorySlug: 'bank-fees',
    subcategorySlug: 'service-charges',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'banking', description: 'Bank of Montreal' },
  },
  {
    merchantName: 'scotiabank',
    normalizedName: 'Scotiabank',
    categorySlug: 'bank-fees',
    subcategorySlug: 'service-charges',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'banking', description: 'Bank of Nova Scotia' },
  },

  // === TELECOM (RENT_AND_UTILITIES > TELEPHONE / INTERNET) ===
  {
    merchantName: 'rogers',
    normalizedName: 'Rogers',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'telephone',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'telecom', description: 'Canadian telecom provider' },
  },
  {
    merchantName: 'bell',
    normalizedName: 'Bell',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'telephone',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'telecom', description: 'Canadian telecom provider' },
  },
  {
    merchantName: 'telus',
    normalizedName: 'Telus',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'telephone',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'telecom', description: 'Canadian telecom provider' },
  },
  {
    merchantName: 'fido',
    normalizedName: 'Fido',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'telephone',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'telecom', description: 'Canadian wireless provider' },
  },

  // === PHARMACY (MEDICAL > PHARMACIES) ===
  {
    merchantName: 'shoppers drug mart',
    normalizedName: 'Shoppers Drug Mart',
    categorySlug: 'medical',
    subcategorySlug: 'pharmacies',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'pharmacy', description: 'Canadian pharmacy chain' },
  },
  {
    merchantName: 'rexall',
    normalizedName: 'Rexall',
    categorySlug: 'medical',
    subcategorySlug: 'pharmacies',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'pharmacy', description: 'Canadian pharmacy chain' },
  },
  {
    merchantName: 'pharma plus',
    normalizedName: 'Pharma Plus',
    categorySlug: 'medical',
    subcategorySlug: 'pharmacies',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'pharmacy', description: 'Canadian pharmacy chain' },
  },

  // === RETAIL (GENERAL_MERCHANDISE) ===
  {
    merchantName: 'canadian tire',
    normalizedName: 'Canadian Tire',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'superstores',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'retail', description: 'Canadian retail chain' },
  },
  {
    merchantName: 'dollarama',
    normalizedName: 'Dollarama',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'discount-stores',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'retail', description: 'Canadian dollar store chain' },
  },
  {
    merchantName: 'winners',
    normalizedName: 'Winners',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'department-stores',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'retail', description: 'Canadian discount retailer' },
  },

  // === ONLINE SERVICES (ENTERTAINMENT / GENERAL_SERVICES) ===
  {
    merchantName: 'amazon',
    normalizedName: 'Amazon',
    categorySlug: 'general-merchandise',
    subcategorySlug: 'online-marketplaces',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'e-commerce', description: 'Online marketplace', website: 'amazon.ca' },
  },
  {
    merchantName: 'netflix',
    normalizedName: 'Netflix',
    categorySlug: 'entertainment',
    subcategorySlug: 'tv-video',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'streaming', description: 'Video streaming service', website: 'netflix.com' },
  },
  {
    merchantName: 'spotify',
    normalizedName: 'Spotify',
    categorySlug: 'entertainment',
    subcategorySlug: 'music-audio',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'streaming', description: 'Music streaming service', website: 'spotify.com' },
  },

  // === TRANSIT (TRANSPORTATION > PUBLIC_TRANSIT) ===
  {
    merchantName: 'ttc',
    normalizedName: 'TTC',
    categorySlug: 'transportation',
    subcategorySlug: 'public-transit',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'transit', description: 'Toronto Transit Commission' },
  },
  {
    merchantName: 'go transit',
    normalizedName: 'GO Transit',
    categorySlug: 'transportation',
    subcategorySlug: 'public-transit',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'transit', description: 'Greater Toronto regional transit' },
  },
  {
    merchantName: 'presto',
    normalizedName: 'Presto',
    categorySlug: 'transportation',
    subcategorySlug: 'public-transit',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'transit', description: 'Ontario transit payment card' },
  },

  // === ENTERTAINMENT (ENTERTAINMENT) ===
  {
    merchantName: 'cineplex',
    normalizedName: 'Cineplex',
    categorySlug: 'entertainment',
    subcategorySlug: 'movies',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'entertainment', description: 'Canadian movie theatre chain' },
  },
  {
    merchantName: 'lcbo',
    normalizedName: 'LCBO',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'beer-wine-liquor',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'alcohol', description: 'Ontario liquor control board' },
  },
  {
    merchantName: 'the beer store',
    normalizedName: 'The Beer Store',
    categorySlug: 'food-and-drink',
    subcategorySlug: 'beer-wine-liquor',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'alcohol', description: 'Ontario beer retailer' },
  },

  // === UTILITIES (RENT_AND_UTILITIES) ===
  {
    merchantName: 'toronto hydro',
    normalizedName: 'Toronto Hydro',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'electric',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'utility', description: 'Toronto electricity provider' },
  },
  {
    merchantName: 'hydro one',
    normalizedName: 'Hydro One',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'electric',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'utility', description: 'Ontario electricity provider' },
  },
  {
    merchantName: 'enbridge',
    normalizedName: 'Enbridge',
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'gas',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'utility', description: 'Natural gas provider' },
  },

  // === GYM / FITNESS (PERSONAL_CARE > GYMS_AND_FITNESS) ===
  {
    merchantName: 'goodlife fitness',
    normalizedName: 'GoodLife Fitness',
    categorySlug: 'personal-care',
    subcategorySlug: 'gyms-and-fitness',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'fitness', description: 'Canadian gym chain' },
  },
  {
    merchantName: 'planet fitness',
    normalizedName: 'Planet Fitness',
    categorySlug: 'personal-care',
    subcategorySlug: 'gyms-and-fitness',
    confidenceScore: 0.95,
    source: 'seed',
    metadata: { industry: 'fitness', description: 'Gym chain' },
  },
];
