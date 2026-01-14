# SmartBudget - Comprehensive Personal Finance Management System

## Project Vision

SmartBudget is an intelligent, comprehensive personal finance management application that imports CIBC transaction data across all cards and accounts, automatically categorizes expenses and income using AI, and provides powerful budgeting and planning tools with a gorgeous, professional UI.

## Executive Summary

### Core Objectives
1. **Universal Transaction Import**: Import all CIBC transactions across all credit cards and bank accounts (CSV, OFX, QFX formats)
2. **AI-Powered Auto-Categorization**: Intelligent categorization using hybrid ML + rule-based systems with merchant normalization
3. **Unknown Merchant Lookup**: Claude AI integration (AICEO daemon pattern) for researching unknown merchants
4. **Comprehensive Financial Dashboard**: At-a-glance view of ALL financial details
5. **Multi-Timeframe Analytics**: Income/expenses across yearly, monthly, weekly, bi-weekly, and custom periods
6. **Advanced Budget Management**: Create, track, and optimize budgets across all spending categories
7. **Sleek, Professional UI**: Modern, gorgeous interface using Next.js + shadcn/ui + Tailwind CSS

---

## Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router, Server Actions)
- **UI Components**: shadcn/ui (built on Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts (primary) + D3.js (custom charts)
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React Context + Zustand (for complex global state)

#### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **File Processing**: Papa Parse (CSV), node-ofx-parser (OFX/QFX)
- **AI Integration**: Anthropic Claude API (via AICEO daemon pattern)

#### AI/ML Systems
- **Transaction Categorization**:
  - Plaid Personal Finance Categories (PFCv2) taxonomy (16 primary, 104+ detailed categories)
  - Hybrid approach: Rule-based + ML model
  - Sentence Transformers for merchant matching
- **Merchant Normalization**:
  - Multi-stage NLP pipeline
  - Fuzzy matching (RapidFuzz)
  - Named Entity Recognition (spaCy)
- **Unknown Merchant Lookup**: Claude AI in YOLO mode via subprocess

#### Infrastructure
- **Hosting**: Vercel (Next.js optimized)
- **Database Hosting**: Neon PostgreSQL or Supabase
- **File Storage**: Vercel Blob or S3-compatible storage
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Sentry

---

## Detailed Feature Requirements

### 1. Transaction Import System

#### Supported Formats
1. **CSV Format** (3-column and 4-column)
   - Date, Description, Amount
   - Date, Description, Credit, Debit
   - Account Number, Date, Description, Amount, Balance
   - Transaction Date vs Posted Date support

2. **OFX/QFX Format** (XML-based)
   - Parse STMTTRN records with all fields
   - Extract FITID for duplicate prevention
   - Handle NAME (32 char limit) + MEMO concatenation
   - Support BANKACCTFROM account info
   - Process LEDGERBAL balance info

3. **Manual Entry**
   - Quick add transactions
   - Bulk import via clipboard paste

#### Import Features
- **Multi-File Upload**: Drag-and-drop multiple files
- **Account Mapping**: Map imported accounts to system accounts
- **Duplicate Detection**: Use FITID (OFX) or transaction signature (CSV)
- **Date Range Filtering**: Import only transactions in specific ranges
- **Validation**: Check for required fields, date formats, amount parsing
- **Preview**: Show parsed transactions before final import
- **Error Handling**: Clear error messages for malformed files

#### Data Model
```typescript
Transaction {
  id: UUID
  accountId: UUID (FK to Account)
  date: Date
  postedDate: Date? (CIBC-specific)
  description: String
  merchantName: String (normalized)
  amount: Decimal
  type: Enum(DEBIT, CREDIT, TRANSFER)
  categoryId: UUID? (FK to Category)
  subcategoryId: UUID? (FK to Subcategory)
  tags: String[]
  notes: String?
  fitid: String? (OFX unique ID)
  isReconciled: Boolean
  isRecurring: Boolean
  recurringRuleId: UUID? (FK to RecurringRule)
  confidenceScore: Float (0-1 for ML categorization)
  userCorrected: Boolean
  rawData: JSON (original import data)
  createdAt: DateTime
  updatedAt: DateTime
}

Account {
  id: UUID
  userId: UUID (FK)
  name: String
  institution: String (e.g., "CIBC")
  accountType: Enum(CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT)
  accountNumber: String (last 4 digits only)
  currency: String (default CAD)
  currentBalance: Decimal
  availableBalance: Decimal?
  color: String (hex color for UI)
  icon: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 2. AI-Powered Auto-Categorization System

#### Category Taxonomy (Plaid PFCv2 Standard)

**16 Primary Categories with 104+ Subcategories:**

1. **INCOME**
   - Wages, Dividends, Interest Earned, Tax Refunds, Unemployment, Retirement Pension, Other Income

2. **TRANSFER_IN / TRANSFER_OUT**
   - Deposit, Withdrawal, Investment Transfer, Savings Transfer, Cash Advance, Wire Transfer

3. **LOAN_PAYMENTS**
   - Car Payment, Credit Card Payment, Mortgage Payment, Student Loan, Personal Loan

4. **BANK_FEES**
   - ATM Fees, Foreign Transaction Fee, Insufficient Funds, Overdraft Fee, Interest Charges

5. **ENTERTAINMENT**
   - Gambling, Music/Audio, Sporting Events, Museums/Attractions, Movies, Video Games

6. **FOOD_AND_DRINK**
   - Groceries, Restaurants, Fast Food, Coffee Shops, Bars/Alcohol, Vending Machines

7. **GENERAL_MERCHANDISE**
   - Clothing, Electronics, Books/Music/Games, Department Stores, Online Marketplaces, Pet Supplies, Sporting Goods

8. **HOME_IMPROVEMENT**
   - Furniture, Hardware, Repair/Maintenance, Security Systems

9. **MEDICAL**
   - Dental Care, Eye Care, Nursing, Pharmacies, Primary Care, Veterinary Services

10. **PERSONAL_CARE**
    - Gyms/Fitness, Hair/Beauty, Laundry/Dry Cleaning, Spa/Massage

11. **GENERAL_SERVICES**
    - Accounting, Automotive, Childcare, Consulting/Legal, Education, Insurance, Postage/Shipping, Storage

12. **GOVERNMENT_AND_NON_PROFIT**
    - Donations/Charities, Government Agencies, Tax Payments

13. **TRANSPORTATION**
    - Gas, Parking, Public Transit, Taxis/Ride-Shares, Tolls, Bike/Scooter Rentals, Vehicle Maintenance

14. **TRAVEL**
    - Flights, Lodging, Rental Cars

15. **RENT_AND_UTILITIES**
    - Rent, Electricity/Gas, Internet/Cable, Telephone, Water, Sewage/Waste Management

16. **GENERAL**
    - Miscellaneous, Other

#### Categorization Pipeline (Hybrid ML + Rules)

**Stage 1: Rule-Based Layer (Fast Path)**
- Keyword matching against curated rules
- Merchant Category Codes (MCC) mapping
- Amount-based rules (e.g., Netflix = $15.99 → Entertainment)
- Transaction type detection (transfers, fees)
- ~60-70% accuracy, 100% precision on matches
- **Target: Handle 40% of transactions instantly**

**Stage 2: Merchant Normalization**
1. Text preprocessing: lowercase, remove special chars, strip transaction IDs
2. Fuzzy matching: RapidFuzz with 85% similarity threshold
3. Named Entity Recognition: spaCy custom model for merchant names
4. Knowledge base lookup: proprietary merchant database
5. Graph-based clustering: connect similar variations
6. **Output: Canonical merchant name**

**Stage 3: Machine Learning Layer**
- Model: Fine-tuned Sentence Transformer (all-MiniLM-L6-v2 base)
- Features:
  - Normalized merchant name (embedding)
  - Transaction amount (bucketed ranges)
  - Day of week / time of day
  - Transaction frequency patterns
  - Historical user corrections
  - MCC code (if available)
  - Geographic location (if available)
- Training: Weakly supervised learning on user corrections
- **Target: 90-95% accuracy on ambiguous cases**

**Stage 4: Confidence Scoring**
- Confidence score (0-1) for every prediction
- Thresholds:
  - 0.90+: Auto-apply (high confidence)
  - 0.70-0.89: Auto-apply with "Review" flag
  - <0.70: Manual review required
- Show confidence scores in UI for transparency

**Stage 5: Feedback Loop**
- Log all user corrections
- Retrain model weekly with new data
- Update rule database monthly
- A/B test model improvements

#### Unknown Merchant Lookup (Claude AI Integration)

For transactions with:
- Unknown/generic merchant names
- Low confidence scores (<0.70)
- User-flagged "Research needed"

**Process:**
1. User clicks "Research Merchant" button on transaction
2. System spawns subprocess with Claude AI in YOLO mode (similar to AICEO daemon)
3. Claude searches web for merchant information:
   - Business name, type, and category
   - Website and location
   - Common transaction patterns
   - Recommended category
4. Claude returns structured response
5. System applies suggested category (with user approval)
6. Result saved to merchant knowledge base

**AICEO Daemon Pattern Implementation:**
```typescript
// Similar to AICEO daemon's Claude Code subprocess
async function researchMerchant(merchantName: string, amount: number, date: Date) {
  const prompt = `Research this merchant and suggest category:
Merchant: ${merchantName}
Amount: $${amount}
Date: ${date.toISOString()}

Search the web and provide:
1. Full business name
2. Business type
3. Recommended category (from Plaid PFCv2)
4. Confidence level
5. Source URLs

Return JSON format.`;

  // Spawn claude process with --dangerously-skip-permissions
  const result = await spawnClaudeProcess(prompt, { yoloMode: true });
  return parseClaudeResponse(result);
}
```

---

### 3. Comprehensive Financial Dashboard

#### Dashboard Layout (Card-Based Design)

**Top Section: Overview Cards (Above the Fold)**
1. **Net Worth Card**
   - Current total across all accounts
   - Month-over-month change
   - Sparkline chart (last 12 months)

2. **Monthly Spending Card**
   - Current month spending
   - Budget vs actual (progress bar)
   - Percentage of budget used
   - Days remaining in month

3. **Monthly Income Card**
   - Current month income
   - Comparison to average
   - Income sources breakdown (mini pie chart)

4. **Cash Flow Card**
   - Income - Expenses this month
   - Trend indicator (up/down)
   - Projected end-of-month balance

**Middle Section: Visualizations**
1. **Spending Trends Chart** (Recharts Area Chart)
   - Last 12 months spending by category
   - Stacked area chart with category colors
   - Hover tooltips with exact amounts
   - Toggle to view by week, month, quarter, year

2. **Category Breakdown** (Recharts Pie/Donut Chart)
   - Current month spending by category
   - Percentages and dollar amounts
   - Click to drill down to subcategories
   - Color-coded by category

3. **Budget Progress Bars**
   - Each category with budget
   - Visual progress bar (green/yellow/red)
   - Amount spent / budget total
   - Projected overspend warnings

**Bottom Section: Detailed Views**
1. **Recent Transactions List**
   - Last 10 transactions
   - Show: Date, Merchant, Category, Amount
   - Quick actions: Edit, Categorize, Flag
   - "View All" button to transaction page

2. **Upcoming Recurring Expenses**
   - Auto-detected recurring bills
   - Due dates and amounts
   - Mark as paid
   - Schedule reminders

3. **Financial Goals Progress**
   - Savings goals with progress bars
   - Debt payoff timelines
   - Investment milestones

#### Multi-Timeframe Views

**Timeframe Selector (Dropdown)**
- Today
- This Week
- Last 7 Days
- This Month
- Last 30 Days
- This Quarter
- This Year
- Last 12 Months
- All Time
- Custom Date Range (date picker)

**Special Timeframes:**
- **Bi-Weekly**: Support for bi-weekly pay periods
  - Auto-detect pay frequency
  - Align budget periods with paydays
  - "Next Payday" countdown

**Comparison Views:**
- Month-over-month
- Year-over-year
- Period-over-period (custom)
- Average over time

#### Real-Time Updates
- WebSocket connection for live balance updates
- Optimistic UI updates for instant feedback
- Background sync every 5 minutes
- Pull-to-refresh on mobile

---

### 4. Budget Management System

#### Budget Types

1. **Envelope Budgeting (YNAB-style)**
   - Assign every dollar to a category
   - Roll over unused amounts
   - Move money between envelopes
   - Zero-based budgeting

2. **Percentage-Based Budgeting (50/30/20 Rule)**
   - 50% Needs
   - 30% Wants
   - 20% Savings/Debt
   - Customizable percentages

3. **Fixed Amount Budgeting**
   - Set dollar amount per category
   - Monthly, weekly, or custom periods
   - Carryover or reset each period

4. **Goal-Based Budgeting**
   - Set savings goals
   - Calculate required monthly allocation
   - Track progress with milestones

#### Budget Features

**Budget Creation Wizard:**
1. Choose budget type
2. Set income amount
3. Auto-suggest category allocations based on past spending
4. Review and adjust
5. Set start date and frequency

**Budget Tracking:**
- Real-time updates as transactions are categorized
- Notifications when approaching budget limits (80%, 90%, 100%)
- Overspend alerts
- Visual indicators (green/yellow/red)
- Historical budget performance

**Budget Templates:**
- Beginner template (based on 50/30/20)
- Custom templates saved by user
- Copy previous month's budget
- Seasonal adjustments (holiday spending, summer vacation, etc.)

**Budget Analytics:**
- Which categories consistently go over/under budget
- Suggested adjustments based on spending patterns
- Budget vs actual variance reports
- Forecasting: project end-of-month totals based on current spending rate

**Collaborative Budgeting (Future Feature):**
- Share budgets with partner/family
- Multi-user access with permissions
- Shared transaction categories
- Individual and combined views

---

### 5. Advanced Features

#### Recurring Transaction Detection
- Auto-detect recurring patterns (weekly, bi-weekly, monthly, quarterly, annually)
- Create rules for auto-categorization
- Predict upcoming recurring expenses
- Alert when recurring transaction is missing or late

#### Split Transactions
- Split single transaction into multiple categories
- Common use cases: grocery store (food + household items)
- Set percentage or fixed amounts
- Save split patterns for future use

#### Tags and Custom Labels
- User-defined tags (e.g., "Business", "Vacation", "Tax Deductible")
- Multi-tag support
- Filter and report by tags
- Auto-tagging rules

#### Notes and Attachments
- Add notes to any transaction
- Upload receipt images
- OCR for receipt data extraction
- Link related transactions

#### Search and Filtering
- Full-text search across merchants and notes
- Advanced filters:
  - Date range
  - Amount range
  - Category/subcategory
  - Account
  - Tags
  - Recurring vs one-time
  - Reconciled status
- Save filter presets

#### Export and Reporting
- Export to CSV, Excel, PDF
- Tax reports (categorized by tax-relevant categories)
- Year-end summaries
- Custom date range reports
- Spending by merchant report
- Category trend reports

#### Financial Insights (AI-Powered)
- Spending pattern analysis: "You spend 30% more on weekends"
- Unusual spending alerts: "Your restaurant spending is 50% higher than average this month"
- Savings opportunities: "Switching to generic brands could save $120/month"
- Bill negotiation suggestions
- Subscription audit: "You haven't used Spotify in 3 months - consider canceling"

#### Goal Tracking
- **Savings Goals**: Down payment, emergency fund, vacation
- **Debt Payoff**: Credit cards, loans with payoff calculators
- **Net Worth Goals**: Track progress toward target net worth
- **Investment Goals**: Retirement, education fund
- Progress visualizations with projected completion dates
- Milestone celebrations

#### Investment Tracking (Future Phase)
- Link investment accounts
- Portfolio overview
- Asset allocation
- Performance tracking
- Tax-loss harvesting alerts

---

### 6. Security and Privacy

#### Authentication
- Email/password with bcrypt hashing
- OAuth (Google, Apple)
- Two-factor authentication (TOTP)
- Biometric authentication on mobile

#### Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Database-level encryption (PostgreSQL pgcrypto)
- Sensitive fields encrypted in application layer
- Regular security audits

#### Privacy
- No transaction data sold or shared
- GDPR compliance
- Data export (JSON, CSV)
- Account deletion with full data wipe
- Anonymized analytics (opt-in)

#### Bank Connection Security
- No storage of bank credentials
- Read-only access tokens
- Automatic token expiration
- Connection audit logs

---

### 7. User Experience Design

#### Design Principles

1. **Clarity Over Complexity**
   - Every screen has one primary purpose
   - Progressive disclosure of advanced features
   - Clear visual hierarchy

2. **Data Visualization First**
   - Charts and graphs as primary UI elements
   - Numbers as supporting details
   - Color-coded insights

3. **Speed and Responsiveness**
   - Instant feedback on all actions
   - Optimistic UI updates
   - <100ms UI response times
   - Skeleton loaders for async operations

4. **Trust and Transparency**
   - Clear explanations of AI categorization
   - Show confidence scores
   - Easy correction mechanisms
   - Data security badges

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - High contrast mode
   - Responsive design (mobile-first)

#### Color Palette (Trust-Building Blues + Accents)

**Primary Colors:**
- Primary Blue: `#2563EB` (Trust, reliability)
- Primary Dark: `#1E40AF`
- Primary Light: `#3B82F6`

**Category Colors:**
- Income: `#10B981` (Green)
- Food: `#F59E0B` (Amber)
- Transportation: `#6366F1` (Indigo)
- Entertainment: `#EC4899` (Pink)
- Shopping: `#8B5CF6` (Purple)
- Bills: `#EF4444` (Red)
- Savings: `#14B8A6` (Teal)

**Semantic Colors:**
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

**Neutrals:**
- Background: `#F9FAFB`
- Surface: `#FFFFFF`
- Border: `#E5E7EB`
- Text: `#111827`
- Text Secondary: `#6B7280`

#### Typography
- **Headings**: Inter (system font) - bold, clean
- **Body**: Inter - regular, highly legible
- **Numbers**: SF Mono / Roboto Mono - tabular figures

#### Iconography
- Lucide React icons (consistent, modern)
- Custom icons for categories (recognizable, colorful)

#### Animation & Motion
- Framer Motion for smooth transitions
- 200-300ms durations
- Ease-in-out curves
- Micro-interactions on hover/click
- Celebrate achievements with confetti/sparkles

#### Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Touch-optimized buttons (min 44x44px)
- Swipe gestures for mobile navigation

---

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**1.1 Project Setup**
- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS
- Install and configure shadcn/ui
- Set up ESLint, Prettier
- Configure Git hooks (Husky)
- Set up GitHub Actions CI/CD

**1.2 Database Setup**
- Design database schema
- Set up PostgreSQL (Neon or Supabase)
- Initialize Prisma ORM
- Create migrations
- Seed initial data (categories, subcategories)

**1.3 Authentication System**
- Implement NextAuth.js v5
- Email/password authentication
- Session management
- Protected routes
- User profile management

**1.4 Basic UI Framework**
- Create layout components (Header, Sidebar, Footer)
- Implement navigation
- Create base page templates
- Set up color theme system
- Implement dark mode toggle

---

### Phase 2: Transaction Import & Management (Weeks 3-4)

**2.1 File Upload System**
- Multi-file drag-and-drop component
- File validation (CSV, OFX, QFX)
- Upload progress indicators
- Error handling and user feedback

**2.2 CSV Parser**
- Detect CSV format (3-column vs 4-column)
- Parse dates (multiple formats)
- Parse amounts (handle credits/debits)
- Handle special cases (CIBC transaction vs posted dates)
- Validation and error reporting

**2.3 OFX/QFX Parser**
- Parse XML structure
- Extract transaction records (STMTTRN)
- Handle FITID for duplicate detection
- Parse account info and balances
- Merchant name normalization (NAME + MEMO concatenation)

**2.4 Transaction Management**
- Create Transaction model and API routes
- Import preview UI
- Duplicate detection logic
- Transaction CRUD operations
- Transaction list view with filtering
- Transaction detail modal
- Edit transaction form

**2.5 Account Management**
- Create Account model and API routes
- Add/edit/delete accounts
- Account list view
- Account detail page with transaction history
- Manual balance updates

---

### Phase 3: Auto-Categorization (Weeks 5-6)

**3.1 Category System**
- Implement Plaid PFCv2 category taxonomy
- Seed database with all categories and subcategories
- Category icon system
- Category color assignment

**3.2 Rule-Based Categorization**
- Create categorization rules database
- Keyword matching engine
- MCC code mapping
- Amount-based rules
- Transaction type detection
- Rule management UI (admin)

**3.3 Merchant Normalization Pipeline**
- Text preprocessing functions
- Fuzzy matching implementation (RapidFuzz)
- Merchant knowledge base
- Canonical name mapping
- Normalization API endpoint

**3.4 ML Model Integration**
- Set up Sentence Transformer model
- Feature engineering pipeline
- Model inference API
- Confidence score calculation
- Fallback mechanisms

**3.5 User Feedback Loop**
- Manual categorization UI
- Bulk categorization tools
- User correction logging
- Model retraining pipeline (background job)

---

### Phase 4: Unknown Merchant Lookup (Week 7)

**4.1 Claude AI Integration**
- Research AICEO daemon Claude subprocess pattern
- Implement subprocess spawning logic
- Create Claude prompt templates
- Response parsing and validation
- Error handling and retries

**4.2 Merchant Research UI**
- "Research Merchant" button on transactions
- Loading state with progress indicator
- Claude response display
- Category suggestion approval flow
- Add to merchant knowledge base

**4.3 Background Processing**
- Queue system for batch merchant lookups
- Rate limiting and API quota management
- Notification system for completed research

---

### Phase 5: Dashboard & Visualizations (Weeks 8-9)

**5.1 Dashboard Layout**
- Overview card components
- Grid layout (responsive)
- Data fetching and aggregation
- Real-time updates

**5.2 Recharts Integration**
- Spending trends area chart
- Category breakdown pie chart
- Budget progress bars
- Income vs expenses bar chart
- Net worth sparkline
- Custom tooltip components

**5.3 D3.js Custom Visualizations**
- Cash flow Sankey diagram (income → categories → expenses)
- Category heat map (spending intensity over time)
- Correlation matrix (category co-occurrence)

**5.4 Timeframe Selector**
- Date range picker component
- Preset timeframe buttons
- Bi-weekly period calculation
- Comparison mode (period-over-period)

---

### Phase 6: Budget Management (Weeks 10-11)

**6.1 Budget Model**
- Database schema for budgets
- Budget period calculations
- Rollover logic
- Budget templates

**6.2 Budget Creation Wizard**
- Multi-step form with validation
- Income input
- Category allocation UI (drag sliders)
- Auto-suggest based on historical spending
- Template selection

**6.3 Budget Tracking**
- Real-time budget calculations
- Progress bars with color indicators
- Overspend alerts
- Budget vs actual variance

**6.4 Budget Analytics**
- Budget performance reports
- Suggested adjustments
- Forecasting engine
- Historical budget comparison

---

### Phase 7: Advanced Features (Weeks 12-13)

**7.1 Recurring Transaction Detection**
- Pattern detection algorithm
- Recurring rule creation
- Upcoming recurring expenses list
- Missing transaction alerts

**7.2 Split Transactions**
- Split transaction UI
- Multi-category allocation
- Save split patterns
- Bulk apply patterns

**7.3 Tags and Labels**
- Tag management
- Multi-tag assignment
- Tag-based filtering
- Tag analytics

**7.4 Search and Filtering**
- Full-text search implementation
- Advanced filter UI
- Saved filter presets
- Search performance optimization

**7.5 Export and Reporting**
- Export to CSV/Excel
- PDF report generation
- Tax report templates
- Custom report builder

---

### Phase 8: Financial Insights & Goals (Week 14)

**8.1 AI-Powered Insights**
- Spending pattern analysis
- Anomaly detection
- Savings opportunity identification
- Subscription audit
- Weekly insight digest

**8.2 Goal Tracking**
- Goal model and API
- Goal creation wizard
- Progress tracking
- Milestone celebrations
- Goal recommendations

---

### Phase 9: Polish & Optimization (Week 15)

**9.1 Performance Optimization**
- Database query optimization
- API response caching
- Image optimization
- Bundle size reduction
- Lazy loading
- Code splitting

**9.2 Accessibility Audit**
- Keyboard navigation testing
- Screen reader testing
- Color contrast verification
- ARIA attributes
- Focus management

**9.3 Testing**
- Unit tests (Vitest)
- Integration tests (Playwright)
- E2E tests (critical flows)
- Load testing
- Security testing

**9.4 Error Handling & Monitoring**
- Sentry integration
- Error boundaries
- User-friendly error messages
- Logging and alerting
- Performance monitoring

---

### Phase 10: Launch Preparation (Week 16)

**10.1 Documentation**
- User guide
- API documentation
- Developer documentation
- FAQ
- Video tutorials

**10.2 Onboarding Flow**
- Welcome tour
- First account setup
- First import walkthrough
- First budget creation
- Goal setting prompts

**10.3 Deployment**
- Vercel production deployment
- Database migration to production
- Environment variable configuration
- Domain setup and SSL
- CDN configuration

**10.4 Beta Testing**
- Invite beta users
- Collect feedback
- Bug fixes
- Iterate on UX
- Prepare for public launch

---

## Technical Specifications

### API Endpoints

#### Authentication
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session
POST   /api/auth/verify-email
POST   /api/auth/reset-password
```

#### Accounts
```
GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/:id
PATCH  /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/accounts/:id/transactions
GET    /api/accounts/:id/balance-history
```

#### Transactions
```
GET    /api/transactions
POST   /api/transactions/import
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
POST   /api/transactions/:id/split
POST   /api/transactions/:id/categorize
POST   /api/transactions/:id/research-merchant
GET    /api/transactions/search
POST   /api/transactions/bulk-categorize
POST   /api/transactions/export
```

#### Categories
```
GET    /api/categories
GET    /api/categories/:id
GET    /api/categories/:id/subcategories
GET    /api/categories/:id/spending
```

#### Budgets
```
GET    /api/budgets
POST   /api/budgets
GET    /api/budgets/:id
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
GET    /api/budgets/:id/progress
GET    /api/budgets/:id/forecast
POST   /api/budgets/templates
```

#### Goals
```
GET    /api/goals
POST   /api/goals
GET    /api/goals/:id
PATCH  /api/goals/:id
DELETE /api/goals/:id
GET    /api/goals/:id/progress
```

#### Insights
```
GET    /api/insights/spending-patterns
GET    /api/insights/anomalies
GET    /api/insights/savings-opportunities
GET    /api/insights/subscriptions
GET    /api/insights/weekly-digest
```

#### Dashboard
```
GET    /api/dashboard/overview
GET    /api/dashboard/spending-trends
GET    /api/dashboard/category-breakdown
GET    /api/dashboard/cash-flow
GET    /api/dashboard/net-worth-history
```

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  transactions  Transaction[]
  budgets       Budget[]
  goals         Goal[]
  categories    Category[]
  tags          Tag[]
  settings      UserSettings?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id               String        @id @default(uuid())
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  institution      String
  accountType      AccountType
  accountNumber    String?
  currency         String        @default("CAD")
  currentBalance   Decimal       @db.Decimal(19, 4)
  availableBalance Decimal?      @db.Decimal(19, 4)
  color            String        @default("#2563EB")
  icon             String        @default("wallet")
  isActive         Boolean       @default(true)
  transactions     Transaction[]
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

model Transaction {
  id              String           @id @default(uuid())
  accountId       String
  account         Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  date            DateTime
  postedDate      DateTime?
  description     String
  merchantName    String
  amount          Decimal          @db.Decimal(19, 4)
  type            TransactionType
  categoryId      String?
  category        Category?        @relation(fields: [categoryId], references: [id])
  subcategoryId   String?
  subcategory     Subcategory?     @relation(fields: [subcategoryId], references: [id])
  tags            Tag[]
  notes           String?
  fitid           String?          @unique
  isReconciled    Boolean          @default(false)
  isRecurring     Boolean          @default(false)
  recurringRuleId String?
  recurringRule   RecurringRule?   @relation(fields: [recurringRuleId], references: [id])
  confidenceScore Float?
  userCorrected   Boolean          @default(false)
  rawData         Json?
  splits          TransactionSplit[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([userId, date])
  @@index([accountId, date])
  @@index([merchantName])
  @@index([categoryId])
}

model Category {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  icon         String
  color        String
  description  String?
  parentId     String?
  parent       Category?     @relation("CategoryTree", fields: [parentId], references: [id])
  subcategories Category[]   @relation("CategoryTree")
  transactions Transaction[]
  budgets      BudgetCategory[]
  isSystemCategory Boolean   @default(true)
  userId       String?
  user         User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Subcategory {
  id           String        @id @default(uuid())
  categoryId   String
  name         String
  slug         String        @unique
  icon         String?
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Budget {
  id          String           @id @default(uuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  type        BudgetType
  period      BudgetPeriod
  startDate   DateTime
  endDate     DateTime?
  totalAmount Decimal          @db.Decimal(19, 4)
  categories  BudgetCategory[]
  isActive    Boolean          @default(true)
  rollover    Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model BudgetCategory {
  id         String   @id @default(uuid())
  budgetId   String
  budget     Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  amount     Decimal  @db.Decimal(19, 4)
  spent      Decimal  @default(0) @db.Decimal(19, 4)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([budgetId, categoryId])
}

model Goal {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  type          GoalType
  targetAmount  Decimal   @db.Decimal(19, 4)
  currentAmount Decimal   @default(0) @db.Decimal(19, 4)
  targetDate    DateTime?
  isCompleted   Boolean   @default(false)
  icon          String?
  color         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model RecurringRule {
  id           String        @id @default(uuid())
  merchantName String
  frequency    Frequency
  amount       Decimal       @db.Decimal(19, 4)
  categoryId   String
  nextDueDate  DateTime
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Tag {
  id           String        @id @default(uuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  color        String        @default("#6B7280")
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@unique([userId, name])
}

model TransactionSplit {
  id            String      @id @default(uuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  categoryId    String
  amount        Decimal     @db.Decimal(19, 4)
  percentage    Decimal?    @db.Decimal(5, 2)
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model MerchantKnowledge {
  id              String   @id @default(uuid())
  merchantName    String   @unique
  normalizedName  String
  categoryId      String
  confidenceScore Float
  source          String   // "rule", "ml", "claude_ai", "user"
  metadata        Json?    // Store additional info from Claude AI research
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([normalizedName])
}

model UserSettings {
  id                    String   @id @default(uuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  currency              String   @default("CAD")
  dateFormat            String   @default("MM/DD/YYYY")
  firstDayOfWeek        Int      @default(0) // 0 = Sunday
  theme                 String   @default("system")
  notificationsEnabled  Boolean  @default(true)
  emailDigest           Boolean  @default(true)
  digestFrequency       String   @default("weekly")
  budgetAlertThreshold  Int      @default(80) // percentage
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum AccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  INVESTMENT
  LOAN
  OTHER
}

enum TransactionType {
  DEBIT
  CREDIT
  TRANSFER
}

enum BudgetType {
  ENVELOPE
  PERCENTAGE
  FIXED_AMOUNT
  GOAL_BASED
}

enum BudgetPeriod {
  WEEKLY
  BI_WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

enum GoalType {
  SAVINGS
  DEBT_PAYOFF
  NET_WORTH
  INVESTMENT
}

enum Frequency {
  WEEKLY
  BI_WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

---

## Performance Targets

- **Page Load Time**: <2 seconds (First Contentful Paint)
- **API Response Time**: <200ms (p95)
- **Database Query Time**: <50ms (p95)
- **Transaction Import**: 10,000 transactions in <5 seconds
- **Categorization Speed**: 1,000 transactions in <10 seconds
- **Dashboard Render**: <1 second with 10,000 transactions
- **Search Results**: <100ms for 100,000 transactions

---

## Security Considerations

### Threat Model
1. **Unauthorized Access**: Strong authentication, session management
2. **Data Breaches**: Encryption at rest and in transit
3. **XSS Attacks**: React's built-in escaping, Content Security Policy
4. **CSRF Attacks**: CSRF tokens, SameSite cookies
5. **SQL Injection**: Prisma ORM parameterized queries
6. **API Abuse**: Rate limiting, authentication on all endpoints
7. **File Upload Attacks**: File type validation, size limits, virus scanning

### Compliance
- PIPEDA (Canadian privacy law)
- GDPR (if expanding to EU)
- PCI DSS (if handling card data directly - not applicable for CSV imports)
- SOC 2 Type II (future)

---

## Testing Strategy

### Unit Tests (Vitest)
- Utility functions
- Data parsing logic
- Categorization algorithms
- Calculation functions

### Integration Tests (Playwright)
- API endpoints
- Database operations
- Authentication flows
- File import workflows

### E2E Tests (Playwright)
- User registration and login
- Transaction import (CSV, OFX)
- Budget creation and tracking
- Dashboard visualizations
- Mobile responsive design

### Performance Tests
- Load testing (Artillery, k6)
- Database query performance
- API endpoint benchmarking
- Frontend bundle size

---

## Deployment Strategy

### Environments
1. **Development**: Local (localhost:3000)
2. **Staging**: Vercel preview deployment
3. **Production**: Vercel production

### CI/CD Pipeline (GitHub Actions)
```yaml
on: [push, pull_request]
jobs:
  test:
    - Lint (ESLint, Prettier)
    - Type check (TypeScript)
    - Unit tests (Vitest)
    - Integration tests (Playwright)
  build:
    - Build Next.js app
    - Verify no build errors
  deploy-preview:
    - Deploy to Vercel preview (on PR)
  deploy-production:
    - Deploy to Vercel production (on main branch)
```

### Database Migrations
- Prisma Migrate for schema changes
- Backup before production migrations
- Rollback plan for failed migrations

### Monitoring
- Vercel Analytics for performance
- Sentry for error tracking
- Logtail for log aggregation
- Uptime monitoring (UptimeRobot)

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
- **Mobile Apps**: Native iOS and Android apps (React Native or Flutter)
- **Bank Account Sync**: Plaid integration for automatic transaction import
- **Investment Tracking**: Portfolio management, asset allocation, performance tracking
- **Bill Management**: Bill reminders, automatic payment scheduling
- **Credit Score Monitoring**: Integration with credit bureaus
- **Tax Optimization**: Tax planning tools, capital gains/loss tracking
- **Financial Advisor Chat**: AI-powered financial advice
- **Collaborative Budgeting**: Multi-user household budgets
- **API for Third-Party Apps**: Public API for integrations

### Advanced AI Features
- **Predictive Budgeting**: ML model predicts future spending based on historical patterns
- **Smart Alerts**: Proactive notifications for unusual spending, upcoming bills, savings opportunities
- **Natural Language Queries**: "How much did I spend on restaurants last month?"
- **Receipt OCR**: Automatic data extraction from receipt photos
- **Expense Splitting**: Split bills with friends/family (Venmo-style)

### Enterprise Features
- **Team Accounts**: Business expense management
- **Approval Workflows**: Multi-level approval for expenses
- **Audit Logs**: Complete audit trail for compliance
- **SSO Integration**: SAML, OAuth for enterprise identity providers
- **White-Label**: Custom branding for B2B customers

---

## Success Metrics (KPIs)

### User Engagement
- **Daily Active Users (DAU)**: Target 50% of total users
- **Retention Rate**: 80% after 30 days, 60% after 90 days
- **Session Duration**: Average 5+ minutes per session
- **Transactions Imported**: Average 100+ transactions per user per month

### Product Performance
- **Auto-Categorization Accuracy**: 90%+ after user corrections
- **Budget Creation Rate**: 70% of users create a budget within first week
- **Goal Setting Rate**: 50% of users set at least one financial goal
- **Unknown Merchant Lookup Success Rate**: 80%+ successful identifications

### Business Metrics
- **User Acquisition Cost (CAC)**: <$20
- **Lifetime Value (LTV)**: >$200 (if premium tier)
- **Conversion Rate**: 10% of free users to premium (if freemium model)
- **Net Promoter Score (NPS)**: 50+

---

## Risk Assessment & Mitigation

### Technical Risks

1. **ML Model Accuracy Lower Than Expected**
   - **Mitigation**: Hybrid approach with rule-based fallback, continuous learning from user corrections, option to manually categorize

2. **Claude AI API Rate Limits / Costs**
   - **Mitigation**: Queue-based processing, batch requests, caching results, user-triggered only (not automatic)

3. **Database Performance at Scale**
   - **Mitigation**: Proper indexing, query optimization, connection pooling, read replicas, partitioning large tables

4. **File Parser Edge Cases**
   - **Mitigation**: Extensive testing with real CIBC exports, graceful error handling, preview before import

### Business Risks

1. **Low User Adoption**
   - **Mitigation**: Strong onboarding, free tier with generous limits, marketing targeting CIBC users specifically

2. **Competition from Established Players**
   - **Mitigation**: Focus on unique features (Claude AI lookup, CIBC-specific optimizations), superior UX

3. **Regulatory Changes**
   - **Mitigation**: Stay informed on financial data regulations, legal counsel, privacy-first approach

4. **Security Breach**
   - **Mitigation**: Security audits, penetration testing, bug bounty program, incident response plan

---

## Conclusion

SmartBudget represents a comprehensive, modern approach to personal finance management, specifically optimized for CIBC users. By combining intelligent transaction import, AI-powered categorization with Claude AI integration, powerful budgeting tools, and a gorgeous user interface, SmartBudget will empower users to take full control of their financial lives.

The phased implementation plan ensures a methodical build process, with each phase delivering incremental value. The hybrid ML + rules categorization approach targets 90%+ accuracy, while the Claude AI integration provides a unique solution for unknown merchants.

With a focus on security, privacy, performance, and user experience, SmartBudget is positioned to become the go-to personal finance app for Canadian users, starting with CIBC customers and expanding to support all major Canadian banks.

**Next Step**: Execute this plan using the Ralph autonomous development loop (plan mode, then build mode with 75 max iterations).
