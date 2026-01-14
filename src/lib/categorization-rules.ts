/**
 * Categorization Rules for Rule-Based Transaction Categorization
 *
 * This file contains keyword-based rules for auto-categorizing transactions.
 * Rules are matched against transaction descriptions and merchant names.
 *
 * Rule Structure:
 * - keywords: Array of keywords/phrases to match (case-insensitive)
 * - categorySlug: Slug of the category to assign
 * - subcategorySlug: Slug of the subcategory to assign
 * - confidence: Confidence score (0-1) for this rule match
 * - priority: Priority for rule matching (higher = checked first)
 */

export interface CategorizationRule {
  keywords: string[];
  categorySlug: string;
  subcategorySlug: string;
  confidence: number; // 0-1
  priority: number; // Higher = checked first
  description?: string;
}

/**
 * Rule-Based Categorization Rules
 * Organized by category for maintainability
 */
export const CATEGORIZATION_RULES: CategorizationRule[] = [
  // ===== INCOME =====
  {
    keywords: ['payroll', 'salary', 'wages', 'pay deposit', 'direct deposit', 'employment income'],
    categorySlug: 'income',
    subcategorySlug: 'income-wages',
    confidence: 0.95,
    priority: 100,
    description: 'Salary and wages from employment'
  },
  {
    keywords: ['dividend', 'dividends', 'div payment'],
    categorySlug: 'income',
    subcategorySlug: 'income-dividends',
    confidence: 0.95,
    priority: 100,
    description: 'Dividend income from investments'
  },
  {
    keywords: ['interest', 'int earned', 'interest income'],
    categorySlug: 'income',
    subcategorySlug: 'income-interest-earned',
    confidence: 0.90,
    priority: 90,
    description: 'Interest earned on accounts'
  },
  {
    keywords: ['tax refund', 'cra refund', 'irs refund', 'revenue canada'],
    categorySlug: 'income',
    subcategorySlug: 'income-tax-refund',
    confidence: 0.95,
    priority: 100,
    description: 'Tax refunds'
  },

  // ===== FOOD & DRINK =====
  {
    keywords: ['grocery', 'groceries', 'supermarket', 'loblaws', 'sobeys', 'metro', 'food basics', 'no frills', 'walmart supercenter', 'safeway', 'fortinos', 'zehrs'],
    categorySlug: 'food-and-drink',
    subcategorySlug: 'food-and-drink-groceries',
    confidence: 0.90,
    priority: 80,
    description: 'Grocery stores'
  },
  {
    keywords: ['restaurant', 'cafe', 'diner', 'bistro', 'grill', 'pizza', 'sushi', 'burger', 'chicken', 'chinese food', 'indian food', 'thai food', 'mexican food'],
    categorySlug: 'food-and-drink',
    subcategorySlug: 'food-and-drink-restaurants',
    confidence: 0.85,
    priority: 70,
    description: 'Restaurants and dining'
  },
  {
    keywords: ['mcdonalds', 'mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'subway', 'tim hortons', 'a&w', 'harvey', 'popeyes', 'five guys'],
    categorySlug: 'food-and-drink',
    subcategorySlug: 'food-and-drink-fast-food',
    confidence: 0.95,
    priority: 90,
    description: 'Fast food chains'
  },
  {
    keywords: ['starbucks', 'coffee', 'tim horton', 'second cup', 'cafe', 'espresso'],
    categorySlug: 'food-and-drink',
    subcategorySlug: 'food-and-drink-coffee',
    confidence: 0.90,
    priority: 85,
    description: 'Coffee shops'
  },
  {
    keywords: ['bar', 'pub', 'brewery', 'lcbo', 'beer store', 'liquor', 'wine shop', 'alcohol'],
    categorySlug: 'food-and-drink',
    subcategorySlug: 'food-and-drink-bar',
    confidence: 0.85,
    priority: 75,
    description: 'Bars and alcohol purchases'
  },

  // ===== TRANSPORTATION =====
  {
    keywords: ['gas station', 'petro-canada', 'shell', 'esso', 'chevron', 'husky', 'mobil', 'sunoco', 'fuel', 'gasoline'],
    categorySlug: 'transportation',
    subcategorySlug: 'transportation-gas',
    confidence: 0.95,
    priority: 90,
    description: 'Gas stations'
  },
  {
    keywords: ['parking', 'impark', 'park\'n fly', 'easypark'],
    categorySlug: 'transportation',
    subcategorySlug: 'transportation-parking',
    confidence: 0.95,
    priority: 90,
    description: 'Parking fees'
  },
  {
    keywords: ['uber', 'lyft', 'taxi', 'cab', 'ride share'],
    categorySlug: 'transportation',
    subcategorySlug: 'transportation-taxi',
    confidence: 0.95,
    priority: 95,
    description: 'Rideshare and taxi services'
  },
  {
    keywords: ['ttc', 'go transit', 'presto', 'transit', 'subway', 'bus pass', 'metro pass'],
    categorySlug: 'transportation',
    subcategorySlug: 'transportation-public',
    confidence: 0.95,
    priority: 90,
    description: 'Public transportation'
  },
  {
    keywords: ['canadian tire', 'auto parts', 'oil change', 'car wash', 'mr lube', 'jiffy lube'],
    categorySlug: 'transportation',
    subcategorySlug: 'transportation-maintenance',
    confidence: 0.80,
    priority: 70,
    description: 'Vehicle maintenance'
  },

  // ===== ENTERTAINMENT =====
  {
    keywords: ['netflix', 'disney+', 'prime video', 'hbo', 'crave', 'spotify', 'apple music', 'youtube premium'],
    categorySlug: 'entertainment',
    subcategorySlug: 'entertainment-tv-streaming',
    confidence: 0.95,
    priority: 95,
    description: 'Streaming services'
  },
  {
    keywords: ['cineplex', 'movie', 'cinema', 'theater', 'theatre', 'imax'],
    categorySlug: 'entertainment',
    subcategorySlug: 'entertainment-movies',
    confidence: 0.95,
    priority: 90,
    description: 'Movie theaters'
  },
  {
    keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'gaming', 'video game'],
    categorySlug: 'entertainment',
    subcategorySlug: 'entertainment-video-games',
    confidence: 0.90,
    priority: 85,
    description: 'Video games and gaming'
  },
  {
    keywords: ['concert', 'ticketmaster', 'live nation', 'stubhub', 'sporting event', 'game ticket'],
    categorySlug: 'entertainment',
    subcategorySlug: 'entertainment-sporting-events',
    confidence: 0.85,
    priority: 80,
    description: 'Concerts and sporting events'
  },

  // ===== GENERAL MERCHANDISE =====
  {
    keywords: ['amazon', 'ebay', 'etsy', 'aliexpress'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-online',
    confidence: 0.90,
    priority: 85,
    description: 'Online marketplaces'
  },
  {
    keywords: ['best buy', 'future shop', 'staples', 'microsoft store', 'apple store'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-electronics',
    confidence: 0.90,
    priority: 85,
    description: 'Electronics stores'
  },
  {
    keywords: ['walmart', 'target', 'costco', 'winners', 'marshalls', 'homesense', 'hudson bay'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-department-stores',
    confidence: 0.85,
    priority: 75,
    description: 'Department stores'
  },
  {
    keywords: ['h&m', 'zara', 'gap', 'old navy', 'sport chek', 'nike', 'adidas', 'lululemon', 'clothing'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-clothing',
    confidence: 0.85,
    priority: 75,
    description: 'Clothing stores'
  },
  {
    keywords: ['chapters', 'indigo', 'coles', 'bookstore', 'book'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-bookstores',
    confidence: 0.90,
    priority: 85,
    description: 'Bookstores'
  },
  {
    keywords: ['petsmart', 'petco', 'pet valu', 'pet food', 'pet supplies'],
    categorySlug: 'general-merchandise',
    subcategorySlug: 'general-merchandise-pet-supplies',
    confidence: 0.95,
    priority: 90,
    description: 'Pet supplies'
  },

  // ===== RENT & UTILITIES =====
  {
    keywords: ['rent payment', 'rent', 'rental payment', 'apartment', 'property management'],
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'rent-and-utilities-rent',
    confidence: 0.90,
    priority: 85,
    description: 'Rent payments'
  },
  {
    keywords: ['hydro', 'electricity', 'electric', 'power', 'gas bill', 'enbridge', 'toronto hydro', 'hydro one'],
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'rent-and-utilities-electric-gas',
    confidence: 0.95,
    priority: 90,
    description: 'Electricity and gas utilities'
  },
  {
    keywords: ['rogers', 'bell', 'telus', 'fido', 'freedom mobile', 'shaw', 'phone bill', 'mobile', 'wireless'],
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'rent-and-utilities-phone',
    confidence: 0.95,
    priority: 90,
    description: 'Phone and wireless services'
  },
  {
    keywords: ['internet', 'cable', 'cable tv', 'broadband'],
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'rent-and-utilities-internet-cable',
    confidence: 0.90,
    priority: 85,
    description: 'Internet and cable services'
  },
  {
    keywords: ['water bill', 'water', 'sewage', 'waste management', 'garbage'],
    categorySlug: 'rent-and-utilities',
    subcategorySlug: 'rent-and-utilities-water',
    confidence: 0.95,
    priority: 90,
    description: 'Water and sewage'
  },

  // ===== MEDICAL =====
  {
    keywords: ['pharmacy', 'shoppers drug mart', 'rexall', 'pharma plus', 'prescription'],
    categorySlug: 'medical',
    subcategorySlug: 'medical-pharmacy',
    confidence: 0.95,
    priority: 90,
    description: 'Pharmacies'
  },
  {
    keywords: ['dentist', 'dental', 'orthodontist'],
    categorySlug: 'medical',
    subcategorySlug: 'medical-dental',
    confidence: 0.95,
    priority: 90,
    description: 'Dental care'
  },
  {
    keywords: ['optometrist', 'eye exam', 'glasses', 'eyeglasses', 'contact lens', 'lenscrafters'],
    categorySlug: 'medical',
    subcategorySlug: 'medical-eye-care',
    confidence: 0.95,
    priority: 90,
    description: 'Eye care'
  },
  {
    keywords: ['veterinarian', 'vet clinic', 'animal hospital', 'pet health'],
    categorySlug: 'medical',
    subcategorySlug: 'medical-veterinary',
    confidence: 0.95,
    priority: 90,
    description: 'Veterinary services'
  },

  // ===== PERSONAL CARE =====
  {
    keywords: ['gym', 'fitness', 'goodlife', 'planet fitness', 'yoga', 'crossfit'],
    categorySlug: 'personal-care',
    subcategorySlug: 'personal-care-gym',
    confidence: 0.95,
    priority: 90,
    description: 'Gyms and fitness centers'
  },
  {
    keywords: ['salon', 'hair', 'barber', 'haircut', 'beauty', 'spa', 'massage', 'nail'],
    categorySlug: 'personal-care',
    subcategorySlug: 'personal-care-hair-beauty',
    confidence: 0.90,
    priority: 85,
    description: 'Hair and beauty services'
  },
  {
    keywords: ['laundry', 'dry clean', 'dry cleaning'],
    categorySlug: 'personal-care',
    subcategorySlug: 'personal-care-laundry',
    confidence: 0.95,
    priority: 90,
    description: 'Laundry and dry cleaning'
  },

  // ===== BANK FEES =====
  {
    keywords: ['monthly fee', 'service charge', 'maintenance fee', 'account fee', 'banking fee'],
    categorySlug: 'bank-fees',
    subcategorySlug: 'bank-fees-service-charge',
    confidence: 0.95,
    priority: 100,
    description: 'Monthly service charges'
  },
  {
    keywords: ['atm fee', 'atm withdrawal'],
    categorySlug: 'bank-fees',
    subcategorySlug: 'bank-fees-atm',
    confidence: 0.95,
    priority: 100,
    description: 'ATM fees'
  },
  {
    keywords: ['overdraft', 'nsf', 'insufficient funds'],
    categorySlug: 'bank-fees',
    subcategorySlug: 'bank-fees-overdraft',
    confidence: 0.95,
    priority: 100,
    description: 'Overdraft fees'
  },
  {
    keywords: ['foreign transaction', 'foreign exchange', 'fx fee'],
    categorySlug: 'bank-fees',
    subcategorySlug: 'bank-fees-foreign-transaction',
    confidence: 0.95,
    priority: 100,
    description: 'Foreign transaction fees'
  },
  {
    keywords: ['interest charge', 'finance charge', 'credit card interest'],
    categorySlug: 'bank-fees',
    subcategorySlug: 'bank-fees-interest-charge',
    confidence: 0.95,
    priority: 100,
    description: 'Interest charges'
  },

  // ===== LOAN PAYMENTS =====
  {
    keywords: ['mortgage', 'mortgage payment'],
    categorySlug: 'loan-payments',
    subcategorySlug: 'loan-payments-mortgage',
    confidence: 0.95,
    priority: 100,
    description: 'Mortgage payments'
  },
  {
    keywords: ['car payment', 'auto loan', 'vehicle payment'],
    categorySlug: 'loan-payments',
    subcategorySlug: 'loan-payments-car',
    confidence: 0.95,
    priority: 100,
    description: 'Car loan payments'
  },
  {
    keywords: ['credit card payment', 'cc payment', 'visa payment', 'mastercard payment'],
    categorySlug: 'loan-payments',
    subcategorySlug: 'loan-payments-credit-card',
    confidence: 0.95,
    priority: 100,
    description: 'Credit card payments'
  },
  {
    keywords: ['student loan', 'osap', 'nslsc'],
    categorySlug: 'loan-payments',
    subcategorySlug: 'loan-payments-student-loan',
    confidence: 0.95,
    priority: 100,
    description: 'Student loan payments'
  },

  // ===== TRANSFERS =====
  {
    keywords: ['e-transfer', 'etransfer', 'interac transfer', 'money transfer'],
    categorySlug: 'transfer-out',
    subcategorySlug: 'transfer-out-account-transfer',
    confidence: 0.90,
    priority: 80,
    description: 'E-transfers and money transfers'
  },
  {
    keywords: ['withdrawal', 'cash withdrawal', 'atm withdrawal'],
    categorySlug: 'transfer-out',
    subcategorySlug: 'transfer-out-withdrawal',
    confidence: 0.85,
    priority: 75,
    description: 'Cash withdrawals'
  },

  // ===== GOVERNMENT & NON-PROFIT =====
  {
    keywords: ['charity', 'donation', 'red cross', 'unicef', 'salvation army', 'food bank'],
    categorySlug: 'government-and-non-profit',
    subcategorySlug: 'government-and-non-profit-donation',
    confidence: 0.90,
    priority: 85,
    description: 'Charitable donations'
  },
  {
    keywords: ['tax payment', 'cra payment', 'income tax', 'property tax'],
    categorySlug: 'government-and-non-profit',
    subcategorySlug: 'government-and-non-profit-tax-payment',
    confidence: 0.95,
    priority: 95,
    description: 'Tax payments'
  },

  // ===== GENERAL SERVICES =====
  {
    keywords: ['insurance', 'life insurance', 'car insurance', 'home insurance', 'health insurance'],
    categorySlug: 'general-services',
    subcategorySlug: 'general-services-insurance',
    confidence: 0.95,
    priority: 90,
    description: 'Insurance payments'
  },
  {
    keywords: ['daycare', 'childcare', 'babysitter', 'nanny'],
    categorySlug: 'general-services',
    subcategorySlug: 'general-services-childcare',
    confidence: 0.95,
    priority: 90,
    description: 'Childcare services'
  },
  {
    keywords: ['tuition', 'school', 'university', 'college', 'course fee'],
    categorySlug: 'general-services',
    subcategorySlug: 'general-services-education',
    confidence: 0.90,
    priority: 85,
    description: 'Education and tuition'
  },
  {
    keywords: ['lawyer', 'attorney', 'legal', 'accounting', 'accountant'],
    categorySlug: 'general-services',
    subcategorySlug: 'general-services-legal',
    confidence: 0.90,
    priority: 85,
    description: 'Legal and accounting services'
  },

  // ===== HOME IMPROVEMENT =====
  {
    keywords: ['home depot', 'lowes', 'rona', 'home hardware', 'hardware store'],
    categorySlug: 'home-improvement',
    subcategorySlug: 'home-improvement-hardware',
    confidence: 0.95,
    priority: 90,
    description: 'Hardware stores'
  },
  {
    keywords: ['ikea', 'furniture', 'sofa', 'bed', 'table', 'chair'],
    categorySlug: 'home-improvement',
    subcategorySlug: 'home-improvement-furniture',
    confidence: 0.90,
    priority: 85,
    description: 'Furniture stores'
  },

  // ===== TRAVEL =====
  {
    keywords: ['air canada', 'westjet', 'flight', 'airline', 'airport'],
    categorySlug: 'travel',
    subcategorySlug: 'travel-flights',
    confidence: 0.95,
    priority: 90,
    description: 'Flight bookings'
  },
  {
    keywords: ['hotel', 'motel', 'airbnb', 'booking.com', 'hotels.com', 'expedia', 'marriott', 'hilton'],
    categorySlug: 'travel',
    subcategorySlug: 'travel-lodging',
    confidence: 0.95,
    priority: 90,
    description: 'Hotel and lodging'
  },
  {
    keywords: ['enterprise', 'hertz', 'avis', 'budget', 'car rental'],
    categorySlug: 'travel',
    subcategorySlug: 'travel-rental-car',
    confidence: 0.95,
    priority: 90,
    description: 'Car rentals'
  }
];

/**
 * Sort rules by priority (descending) for efficient matching
 */
export const SORTED_RULES = [...CATEGORIZATION_RULES].sort((a, b) => b.priority - a.priority);
