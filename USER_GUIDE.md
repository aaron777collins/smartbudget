# SmartBudget User Guide

Welcome to **SmartBudget** - your comprehensive personal finance management system! This guide will help you get the most out of SmartBudget's powerful features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation](#navigation)
3. [Managing Accounts](#managing-accounts)
4. [Importing Transactions](#importing-transactions)
5. [Understanding Categories](#understanding-categories)
6. [Using the Dashboard](#using-the-dashboard)
7. [Creating and Managing Budgets](#creating-and-managing-budgets)
8. [Setting Financial Goals](#setting-financial-goals)
9. [Advanced Features](#advanced-features)
10. [Design System & Accessibility](#design-system--accessibility)
11. [Performance Features](#performance-features)
12. [Tips and Best Practices](#tips-and-best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Visit the SmartBudget homepage
2. Click "Sign Up" in the top navigation
3. Enter your email address and create a secure password
4. Verify your email address by clicking the link sent to your inbox
5. Log in with your new credentials

### First-Time Setup

After logging in for the first time:

1. **Add Your First Account**: Set up your bank accounts and credit cards
2. **Import Transactions**: Upload your transaction history from CIBC or other banks
3. **Review Categories**: SmartBudget will automatically categorize your transactions
4. **Create a Budget**: Set spending limits for different categories
5. **Set Goals**: Define your financial objectives

### Mobile-First Experience

SmartBudget has been redesigned with a mobile-first approach, providing an excellent experience on any device:

**Mobile Features:**
- **Bottom Navigation Bar**: Quick access to Dashboard, Transactions, Budgets, Accounts, and More
- **Touch-Optimized**: All buttons and interactive elements are sized for comfortable tapping (minimum 44x44px)
- **Responsive Layout**: Automatically adapts to your screen size (phone, tablet, or desktop)
- **Smooth Animations**: Polished transitions that respect your motion preferences
- **Offline-Ready**: Cached data allows viewing your finances even with poor connectivity

**Desktop Features:**
- **Sidebar Navigation**: Full navigation menu always visible on the left
- **Keyboard Shortcuts**: Fast navigation using keyboard commands (see [Keyboard Shortcuts](#keyboard-shortcuts))
- **Multi-Column Layouts**: Take advantage of larger screens with side-by-side views
- **Data Tables**: Advanced filtering and sorting with keyboard navigation

Whether you're checking your budget on your phone or analyzing spending trends on your desktop, SmartBudget provides a seamless experience across all devices.

---

## Navigation

SmartBudget features an intuitive, responsive navigation system that adapts to your device.

### Mobile Navigation

#### Bottom Navigation Bar

On mobile devices (phones and small tablets), SmartBudget displays a bottom navigation bar for easy one-handed use:

**Primary Navigation Items:**
1. **Dashboard** - Overview of your finances, charts, and insights
2. **Transactions** - View and manage all your transactions
3. **Budgets** - Track spending against your budget categories
4. **Accounts** - Manage your bank accounts and credit cards
5. **More** - Access additional features (opens drawer menu)

**Features:**
- **Fixed Position**: Always visible at the bottom of the screen for quick access
- **Active State**: Current page is highlighted with accent color and bold text
- **Icon + Label**: Each item has both an icon and text label for clarity
- **Touch-Optimized**: Large tap targets (minimum 44x44px) for comfortable use
- **Smooth Animations**: Icons subtly scale when active

#### Drawer Menu (More)

Tap the "More" button in the bottom navigation to access secondary features:

**Secondary Navigation Items:**
- **Recurring Transactions** - Manage recurring bills and income
- **Tags** - Organize transactions with custom tags
- **Goals** - Track progress toward financial goals
- **Insights** - AI-powered spending insights and recommendations
- **Import** - Import transactions from CSV or OFX files
- **Jobs** - View background job status (admin only)
- **Settings** - Configure app preferences and account settings

**Drawer Features:**
- **Slide-In Animation**: Smooth slide from the right side
- **Backdrop**: Tap outside the drawer to close
- **Scrollable**: Access all items even on small screens
- **Theme Toggle**: Quick access to dark/light mode
- **User Profile**: Account information and sign out

### Desktop Navigation

#### Sidebar Navigation

On desktop and large tablets, SmartBudget displays a permanent sidebar with full navigation:

**Features:**
- **Always Visible**: Navigation is always accessible on the left side
- **Collapsible Sections**: Group related features for cleaner organization
- **Hover States**: Visual feedback when hovering over items
- **Active Highlighting**: Current page is clearly indicated
- **Icon Colors**: Each section has a unique color for quick identification
- **Responsive**: Automatically collapses to icons-only on medium screens

#### Responsive Behavior

The navigation system intelligently adapts to your screen size:

| Screen Size | Navigation Style | Breakpoint |
|------------|------------------|------------|
| Mobile (< 768px) | Bottom Bar + Drawer | Phone, small tablet portrait |
| Tablet (768px - 1024px) | Collapsed Sidebar | Tablet landscape |
| Desktop (> 1024px) | Full Sidebar | Laptop, desktop |

### Keyboard Navigation

SmartBudget is fully accessible via keyboard for power users and accessibility:

#### Global Shortcuts

- **Skip to Content**: `Tab` from page load jumps to main content (accessibility)
- **Navigate Menu**: `Tab` / `Shift+Tab` to move through navigation items
- **Activate Link**: `Enter` or `Space` to navigate to selected page
- **Close Dialogs**: `Escape` to close modal dialogs and drawers

#### Focus Management

- **Visible Focus Indicators**: Clear blue ring shows which element is focused
- **Logical Tab Order**: Navigation follows visual layout order
- **Focus Trap**: Dialogs and drawers trap focus until closed
- **Return Focus**: Focus returns to trigger element when closing dialogs

#### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy (h1, h2, h3) for easy navigation
- **ARIA Labels**: All icon-only buttons have descriptive labels
- **Landmarks**: Navigation uses semantic `<nav>` elements with labels
- **Status Announcements**: Important actions announce results to screen readers

---

## Managing Accounts

### Adding a New Account

1. Navigate to the **Accounts** page from the sidebar
2. Click the **"Add Account"** button
3. Fill in the account details:
   - **Account Name**: e.g., "CIBC Chequing", "Visa Credit Card"
   - **Institution**: e.g., "CIBC", "TD Bank", "RBC"
   - **Account Type**: Checking, Savings, Credit Card, Investment, Loan
   - **Account Number**: Last 4 digits (optional, for your reference)
   - **Currency**: CAD, USD, EUR, etc.
   - **Current Balance**: Your account's current balance
   - **Color & Icon**: Customize for easy identification
4. Click **"Save"**

### Editing or Deleting Accounts

- **Edit**: Click on any account in the list, then click the "Edit" button
- **Delete**: Click the "Delete" button (warning: this will also delete associated transactions)
- **Deactivate**: Toggle the "Active" switch to hide an account without deleting it

### Updating Account Balances

SmartBudget tracks your balance based on imported transactions. To manually update:

1. Click on the account
2. Click **"Update Balance"**
3. Enter the new balance
4. SmartBudget will create an adjustment transaction if needed

---

## Importing Transactions

SmartBudget supports multiple import formats, optimized for CIBC and other Canadian banks.

### Supported File Formats

1. **CSV Files** (.csv)
   - 3-column format: Date, Description, Amount
   - 4-column format: Date, Description, Credit, Debit
   - 5-column format: Account Number, Date, Description, Amount, Balance

2. **OFX/QFX Files** (.ofx, .qfx)
   - Standard banking export format
   - Contains detailed transaction metadata
   - Includes unique transaction IDs (FITID) for duplicate prevention

### How to Import Transactions

#### From CIBC Online Banking

1. Log into CIBC Online Banking
2. Navigate to your account
3. Select **"Download Transactions"**
4. Choose format: CSV or OFX
5. Select date range (e.g., last 90 days)
6. Download the file

#### Importing into SmartBudget

1. Navigate to the **Transactions** page
2. Click **"Import"** button
3. **Drag and drop** your file(s) or click to browse
4. SmartBudget will parse and preview the transactions
5. **Map to Account**: Select which account these transactions belong to
6. **Review Preview**: Check the parsed data for accuracy
7. **Duplicate Detection**: SmartBudget automatically identifies duplicates
8. Click **"Import Transactions"**
9. Wait for processing (typically 2-5 seconds per 1,000 transactions)

### Import Tips

- **Multiple Files**: You can import multiple files at once
- **Date Ranges**: Import incrementally to avoid duplicates
- **Account Mapping**: Ensure you select the correct account for each import
- **Duplicate Prevention**: SmartBudget uses transaction signatures to prevent duplicates
- **File Size**: Files up to 10 MB are supported (typically 50,000+ transactions)

### Manual Transaction Entry

To add a single transaction manually:

1. Go to **Transactions** page
2. Click **"Add Transaction"**
3. Fill in:
   - Date
   - Merchant/Description
   - Amount (negative for expenses, positive for income)
   - Category
   - Account
   - Notes (optional)
4. Click **"Save"**

---

## Understanding Categories

SmartBudget uses the **Plaid Personal Finance Category** (PFCv2) standard with 16 primary categories and 100+ subcategories.

### Primary Categories

1. **INCOME** - Wages, dividends, interest, refunds
2. **FOOD_AND_DRINK** - Groceries, restaurants, coffee shops
3. **TRANSPORTATION** - Gas, parking, public transit, ride-shares
4. **SHOPPING** - Clothing, electronics, general merchandise
5. **ENTERTAINMENT** - Movies, music, events, hobbies
6. **RENT_AND_UTILITIES** - Rent, electricity, internet, phone
7. **MEDICAL** - Healthcare, dental, pharmacy, veterinary
8. **PERSONAL_CARE** - Gym, hair salon, spa
9. **TRAVEL** - Flights, hotels, rental cars
10. **BANK_FEES** - ATM fees, overdraft, interest charges
11. **LOAN_PAYMENTS** - Mortgage, car loan, credit card payments
12. **TRANSFER** - Account transfers, savings
13. **GOVERNMENT** - Taxes, donations
14. **SERVICES** - Insurance, legal, childcare
15. **HOME_IMPROVEMENT** - Furniture, hardware, repairs
16. **GENERAL** - Miscellaneous, other

### Auto-Categorization

SmartBudget automatically categorizes your transactions using:

1. **Rule-Based System**: Fast keyword and pattern matching
2. **Machine Learning**: AI model trained on millions of transactions
3. **Merchant Normalization**: Identifies variations of the same merchant
4. **User Learning**: Improves based on your corrections

### Confidence Scores

Each auto-categorized transaction has a confidence score:

- **90-100%**: High confidence (green indicator)
- **70-89%**: Medium confidence (yellow indicator)
- **Below 70%**: Low confidence (red indicator - review recommended)

### Manually Categorizing Transactions

To change a transaction's category:

1. Click on the transaction in the list
2. Click **"Edit"** or click the category dropdown
3. Select the new category and subcategory
4. Click **"Save"**
5. SmartBudget learns from your correction

### Bulk Categorization

To categorize multiple transactions at once:

1. Select transactions using checkboxes
2. Click **"Bulk Actions"** → **"Categorize"**
3. Choose the category
4. Click **"Apply to Selected"**

### Research Unknown Merchants

If SmartBudget can't identify a merchant:

1. Click on the transaction
2. Click **"Research Merchant"** button
3. SmartBudget's AI assistant will search for merchant information
4. Review the suggested category and business details
5. Click **"Apply"** to accept the suggestion
6. The result is saved for future transactions from this merchant

---

## Using the Dashboard

The dashboard provides a comprehensive view of your finances at a glance.

### Overview Cards

The top row displays key metrics:

1. **Net Worth**
   - Total balance across all accounts
   - Month-over-month change
   - Sparkline showing 12-month trend

2. **Monthly Spending**
   - Current month expenses
   - Budget vs. actual with progress bar
   - Days remaining in the month

3. **Monthly Income**
   - Current month income
   - Comparison to average
   - Income sources breakdown

4. **Cash Flow**
   - Income minus expenses
   - Trend indicator
   - Projected end-of-month balance

### Visualizations

#### Spending Trends Chart

- **Area chart** showing spending over time by category
- **Timeframes**: Toggle between weekly, monthly, quarterly, yearly
- **Hover** over any point to see exact amounts
- **Click legend** items to show/hide categories

#### Category Breakdown

- **Pie/Donut chart** showing spending by category
- **Percentages** and dollar amounts displayed
- **Click slice** to drill down into subcategories
- **Color-coded** by category

#### Budget Progress

- **Progress bars** for each budgeted category
- **Color indicators**:
  - Green: Under budget
  - Yellow: Approaching limit (80-90%)
  - Red: Over budget
- **Projected overspend** warnings based on current spending rate

### Timeframe Selector

Choose your view period:

- **Today**
- **This Week** / Last 7 Days
- **This Month** / Last 30 Days
- **This Quarter**
- **This Year** / Last 12 Months
- **All Time**
- **Custom Date Range** (date picker)

**Special Timeframes:**
- **Bi-Weekly**: If you're paid bi-weekly, SmartBudget aligns views with your pay periods
- **Comparison Mode**: View period-over-period changes (month-over-month, year-over-year)

### Recent Transactions

- See your latest 10 transactions
- **Quick actions**: Edit, categorize, flag
- Click **"View All"** to go to full transaction list

### Upcoming Recurring Expenses

SmartBudget automatically detects recurring bills:

- **Next due date** and amount
- **Mark as paid** when complete
- **Set reminders** for upcoming bills

---

## Creating and Managing Budgets

Budgets help you control spending and save toward your goals.

### Budget Types

SmartBudget supports four budget types:

1. **Envelope Budgeting** (YNAB-style)
   - Assign every dollar to a category
   - Roll over unused amounts
   - Move money between envelopes

2. **Percentage-Based** (50/30/20 Rule)
   - 50% Needs (rent, groceries, utilities)
   - 30% Wants (entertainment, dining out)
   - 20% Savings & Debt

3. **Fixed Amount**
   - Set specific dollar amounts per category
   - Monthly, weekly, or custom periods

4. **Goal-Based**
   - Set savings goals
   - SmartBudget calculates required monthly allocation

### Creating a Budget

#### Using the Budget Wizard

1. Navigate to **Budgets** page
2. Click **"Create Budget"**
3. **Step 1**: Choose budget type
4. **Step 2**: Enter your monthly income
5. **Step 3**: Allocate to categories
   - SmartBudget suggests amounts based on your past spending
   - Adjust sliders or enter amounts directly
6. **Step 4**: Set start date and frequency
7. **Step 5**: Review and save

#### Quick Budget from Template

1. Click **"Use Template"**
2. Choose from:
   - **Beginner**: Based on 50/30/20 rule
   - **Previous Month**: Copy last month's budget
   - **Your Saved Templates**: Reuse custom budgets
3. Adjust as needed
4. Save

### Tracking Budget Performance

#### Real-Time Progress

- View spending vs. budget on dashboard
- **Progress bars** show percentage used
- **Color coding**: Green (safe), Yellow (approaching limit), Red (exceeded)

#### Budget Alerts

SmartBudget notifies you when:

- You reach 80% of a budget category
- You reach 90% of a budget category
- You exceed a budget category
- Unusual spending detected (50% above average)

#### Budget vs. Actual Reports

1. Go to **Budgets** page
2. Click on a budget
3. View **Analytics** tab:
   - Variance by category (over/under budget)
   - Historical performance
   - Suggested adjustments
   - Forecasting (projected end-of-month totals)

### Adjusting Budgets

#### Mid-Month Changes

1. Click on your active budget
2. Click **"Edit"**
3. Adjust category amounts
4. Changes apply immediately

#### Moving Money Between Categories

For envelope budgets:

1. Go to budget detail view
2. Click **"Move Funds"**
3. Select source and destination categories
4. Enter amount
5. Confirm

### Budget Templates

Save your budget as a template:

1. Open the budget
2. Click **"Save as Template"**
3. Name your template
4. Use it to quickly create future budgets

---

## Setting Financial Goals

Goals help you stay motivated and track progress toward financial milestones.

### Goal Types

1. **Savings Goals**
   - Emergency fund
   - Vacation fund
   - Down payment
   - General savings

2. **Debt Payoff**
   - Credit card debt
   - Student loans
   - Car loan
   - Mortgage

3. **Net Worth Goals**
   - Target net worth
   - Monthly increase targets

4. **Investment Goals**
   - Retirement savings
   - Education fund
   - Investment portfolio

### Creating a Goal

1. Navigate to **Goals** page
2. Click **"Add Goal"**
3. Fill in details:
   - **Goal Name**: e.g., "Emergency Fund"
   - **Goal Type**: Savings, Debt Payoff, etc.
   - **Target Amount**: e.g., $10,000
   - **Current Amount**: Starting point (optional)
   - **Target Date**: When you want to achieve this (optional)
   - **Icon & Color**: Customize appearance
4. Click **"Create Goal"**

### Tracking Progress

#### Goal Dashboard

- **Progress bar** showing completion percentage
- **Amount saved** vs. target
- **Projected completion date** based on current pace
- **Monthly contribution** needed to reach goal on time

#### Milestones

SmartBudget celebrates milestones:

- 25% complete
- 50% complete
- 75% complete
- Goal achieved!

#### Manual Updates

To update goal progress:

1. Click on the goal
2. Click **"Update Progress"**
3. Enter new current amount
4. Add a note (optional)
5. Save

#### Automatic Tracking (Future Feature)

SmartBudget can automatically track goals by:

- Monitoring specific accounts (savings account balance)
- Tracking category spending (debt payments)
- Monitoring net worth changes

---

## Advanced Features

### Split Transactions

Split a single transaction across multiple categories:

1. Click on the transaction
2. Click **"Split Transaction"**
3. Add categories and amounts:
   - e.g., Grocery store: $80 Groceries + $20 Household Items
4. Amounts must sum to the transaction total
5. Save

**Save Split Patterns**: For recurring split transactions (e.g., Costco purchases), save the pattern and apply it to future transactions automatically.

### Tags and Labels

Add custom tags to transactions:

1. Edit a transaction
2. Click **"Add Tags"**
3. Create or select tags:
   - "Business"
   - "Tax Deductible"
   - "Vacation"
   - "Reimbursable"
4. Use tags to filter and create custom reports

### Search and Filtering

#### Quick Search

Use the search bar to find:

- Merchant names
- Transaction notes
- Amounts (exact or range)

#### Advanced Filters

Click **"Filters"** to refine by:

- **Date Range**: Specific periods
- **Amount Range**: Min and max amounts
- **Categories**: One or multiple
- **Accounts**: Specific accounts
- **Tags**: Custom tags
- **Transaction Type**: Debit, Credit, Transfer
- **Status**: Reconciled, Recurring, etc.

**Save Filter Presets**: Save commonly used filters for quick access.

### Recurring Transaction Rules

SmartBudget auto-detects recurring transactions:

1. Go to **Transactions** → **Recurring**
2. View detected patterns
3. **Confirm** or **Adjust** the pattern:
   - Frequency (weekly, bi-weekly, monthly, etc.)
   - Expected amount
   - Category
4. **Alerts**: Get notified when a recurring transaction is missing or different than expected

### Export and Reporting

#### Export Transactions

1. Go to **Transactions** page
2. Apply filters (optional)
3. Click **"Export"**
4. Choose format:
   - **CSV**: Spreadsheet-compatible
   - **Excel**: .xlsx with formatting
   - **PDF**: Printable report
5. Download

#### Tax Reports

1. Go to **Reports** → **Tax Report**
2. Select tax year
3. SmartBudget groups transactions by tax-relevant categories:
   - Business expenses
   - Medical expenses
   - Charitable donations
   - Interest paid
4. Export for your tax preparer

#### Custom Reports

Create custom reports:

1. Go to **Reports** → **Custom**
2. Select:
   - Date range
   - Categories
   - Accounts
   - Grouping (by month, category, merchant)
3. View charts and tables
4. Export as PDF or CSV

### Transaction Notes and Attachments

#### Adding Notes

1. Edit a transaction
2. Add notes in the **"Notes"** field
3. Use for:
   - Business expense details
   - Who you were with
   - What the purchase was for

#### Uploading Receipts

1. Edit a transaction
2. Click **"Attach Receipt"**
3. Upload image (JPG, PNG, PDF)
4. SmartBudget stores the receipt
5. View receipts anytime by clicking the transaction

#### OCR (Optical Character Recognition)

SmartBudget can extract data from receipt images:

- Merchant name
- Date
- Total amount
- Line items

This feature helps auto-fill transaction details.

---

## Design System & Accessibility

SmartBudget features a comprehensive design system and accessibility features to ensure a consistent, beautiful, and inclusive experience for all users.

### Design System

#### Design Tokens

SmartBudget uses a centralized design token system for consistent styling across the entire application:

**Spacing System:**
- **Card Padding**: Consistent padding for all cards (mobile: 16px, default: 24px, large: 32px)
- **Page Containers**: Standardized page layouts with responsive padding
- **Section Spacing**: Vertical spacing between content sections (tight, default, relaxed, loose)
- **Gap System**: Grid and flex layouts with consistent gaps (8px, 16px, 24px, 32px)

**Typography Scale:**
- **Responsive Headings**: All headings scale from mobile to desktop for optimal readability
- **Page Titles**: Large, bold headings (24-30px) for main page titles
- **Section Headings**: Medium headings (18-24px) for content sections
- **Body Text**: Comfortable reading sizes (14-16px) with proper line height
- **Caption Text**: Small text (12px) for metadata and hints

**Color System:**
- **Semantic Colors**: Colors convey meaning (green for success, red for danger, yellow for warning)
- **Status Indicators**: Consistent colors for transaction types, budget status, and goal progress
- **Chart Colors**: Harmonious color palette for data visualizations
- **Colorblind-Friendly**: Accessible Okabe-Ito palette for critical charts (WCAG AAA compliant)
- **Dark Mode Support**: All colors adapt seamlessly to light and dark themes

**Elevation System:**
- **Card Shadows**: Subtle shadows differentiate cards from background
- **Interactive Elements**: Higher elevation for buttons and clickable items
- **Modal Overlays**: Maximum elevation for dialogs and sheets
- **Depth Hierarchy**: Important elements appear "closer" to the user

#### Animation Patterns

SmartBudget uses subtle, purposeful animations to enhance user experience:

**Transition Animations:**
- **Page Transitions**: Smooth fade-in when navigating between pages
- **Dialog Animations**: Modals slide and fade in from the center
- **Drawer Animations**: Mobile menu smoothly slides in from the right
- **Loading States**: Skeleton loaders with subtle shimmer effect

**Interaction Feedback:**
- **Hover Effects**: Buttons subtly scale up (5%) on hover
- **Active States**: Elements compress slightly when pressed
- **Focus Indicators**: Clear blue ring appears when navigating via keyboard
- **Success Feedback**: Checkmarks and success messages with celebration effect

**Performance Considerations:**
- **Fast Durations**: Quick 150-200ms transitions feel instant
- **GPU-Accelerated**: Transform and opacity animations use hardware acceleration
- **Reduced Motion**: All animations respect `prefers-reduced-motion` setting (see Accessibility)

### Accessibility Features

SmartBudget is designed to be accessible to all users, including those with disabilities. We follow WCAG 2.1 Level AA standards.

#### Keyboard Navigation

**Full Keyboard Support:**
- **Tab Navigation**: Navigate through all interactive elements with `Tab` and `Shift+Tab`
- **Enter/Space**: Activate buttons, links, and other controls
- **Escape**: Close dialogs, dropdowns, and other overlays
- **Arrow Keys**: Navigate within lists, dropdowns, and date pickers
- **Skip Link**: Press `Tab` on page load to skip directly to main content

**Focus Indicators:**
- **Visible Focus Ring**: Clear blue ring (2px) shows which element has keyboard focus
- **High Contrast**: Focus indicators meet WCAG 2.1 AAA contrast requirements
- **Focus Trap**: Dialogs keep focus within until closed, preventing confusion
- **Logical Order**: Tab order follows visual layout for predictable navigation

#### Screen Reader Support

**Semantic HTML:**
- **Heading Hierarchy**: Proper h1-h6 structure for easy navigation
- **Landmark Regions**: `<nav>`, `<main>`, `<aside>` elements identify page areas
- **Lists**: Transactions, budgets, and accounts use semantic list markup
- **Tables**: Data tables use proper `<table>`, `<thead>`, `<tbody>` structure

**ARIA Labels:**
- **Icon Buttons**: All icon-only buttons have descriptive `aria-label` attributes
- **Progress Bars**: Budget and goal progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Status Messages**: Important updates announced via `aria-live` regions
- **Form Inputs**: All inputs have associated `<label>` elements

**Accessible Components:**
- **Dialogs**: Use `aria-modal="true"` and proper focus management
- **Dropdowns**: Select elements have proper `aria-expanded` and `aria-controls`
- **Tooltips**: Additional information available via `aria-describedby`
- **Error Messages**: Form validation errors linked to inputs via `aria-describedby`

#### Visual Accessibility

**Color Contrast:**
- **Text Contrast**: All text meets WCAG AA standards (4.5:1 for normal, 3:1 for large)
- **Interactive Elements**: Buttons and links have sufficient contrast against backgrounds
- **Charts**: Data visualizations use colorblind-friendly palettes
- **Status Colors**: Don't rely on color alone; icons and text provide meaning

**Text Sizing:**
- **Minimum Sizes**: Body text is at least 14px (larger on mobile for readability)
- **Scalable Text**: All text respects browser zoom settings (up to 200%)
- **Line Height**: Comfortable 1.5-1.625 line height for body text
- **Readable Fonts**: System font stack for optimal rendering on all devices

**Touch Targets:**
- **Minimum Size**: All buttons and interactive elements are at least 44x44px (WCAG AA)
- **Adequate Spacing**: Sufficient space between touch targets to prevent mis-taps
- **Mobile-Optimized**: Bottom navigation bar items sized for easy thumb access

#### Reduced Motion Support

SmartBudget respects the `prefers-reduced-motion` setting in your operating system:

**When Reduced Motion is Enabled:**
- **Instant Transitions**: All animations reduced to near-instant (0.01ms)
- **No Parallax**: Scrolling effects disabled
- **No Rotation**: Icon rotation animations disabled
- **No Scale**: Hover and press scale effects disabled
- **Fade Only**: Subtle opacity changes only when necessary

**How to Enable:**
- **Windows**: Settings > Ease of Access > Display > Show animations
- **macOS**: System Preferences > Accessibility > Display > Reduce motion
- **iOS**: Settings > Accessibility > Motion > Reduce Motion
- **Android**: Settings > Accessibility > Remove animations

#### Dialog & Modal Accessibility

**Focus Management:**
- **Auto-Focus**: Dialogs automatically focus the first interactive element
- **Focus Trap**: Tab and Shift+Tab cycle within the dialog
- **Return Focus**: When closed, focus returns to the trigger button
- **Escape Key**: Press Escape to close dialogs

**Scrolling:**
- **Fixed Headers/Footers**: Dialog titles and action buttons remain visible
- **Body Scrolling**: Only the main content area scrolls (not the entire dialog)
- **Scroll Indicators**: Visual cues show when more content is available

#### Accessibility Testing

SmartBudget undergoes regular accessibility testing:
- **Automated Testing**: Axe-core accessibility tests run on every build
- **Keyboard Testing**: All features tested with keyboard-only navigation
- **Screen Reader Testing**: Verified with NVDA (Windows) and VoiceOver (macOS/iOS)
- **Color Contrast**: All color combinations tested with accessibility tools
- **Manual Audits**: Regular manual reviews for accessibility compliance

### Theme Support

#### Light and Dark Modes

SmartBudget supports both light and dark themes to match your preference and reduce eye strain:

**Light Mode:**
- **Clean & Bright**: White backgrounds with dark text for daylight use
- **High Contrast**: Strong contrast for outdoor visibility
- **Professional**: Traditional appearance for work environments

**Dark Mode:**
- **Reduced Eye Strain**: Dark backgrounds with light text for nighttime use
- **OLED-Friendly**: True blacks save battery on OLED screens
- **Reduced Blue Light**: Warmer tones for evening use

**Theme Toggle:**
- Located in the user menu (desktop) or drawer menu (mobile)
- System preference detected automatically
- Preference saved and synced across devices
- Smooth transition between themes with no flash

---

## Performance Features

SmartBudget is engineered for speed and efficiency, providing a fast experience even with thousands of transactions.

### React Query State Management

SmartBudget uses React Query (TanStack Query) for intelligent data fetching and state management:

#### Automatic Caching

**How It Works:**
- **First Load**: Data fetched from server and stored in cache
- **Subsequent Loads**: Data served instantly from cache while updating in background
- **Cache Duration**: Data remains fresh for 2-10 minutes depending on the resource
- **Background Refetch**: Stale data automatically refreshed when you return to a page

**Benefits:**
- **Instant Navigation**: Pages load immediately from cache
- **Reduced Server Load**: Fewer API calls mean faster responses
- **Offline Support**: View cached data even with poor connectivity
- **Battery Savings**: Less network activity extends mobile battery life

#### Optimistic Updates

When you create, edit, or delete data, SmartBudget updates the UI immediately:

**User Experience:**
- **Instant Feedback**: Changes appear immediately without waiting for server
- **No Loading Spinners**: Smooth, uninterrupted experience
- **Automatic Rollback**: If server rejects change, UI reverts automatically
- **Error Recovery**: Clear error messages with retry options

**Examples:**
- **Create Transaction**: New transaction appears in list instantly
- **Update Budget**: Budget amounts update immediately as you type
- **Delete Account**: Account removed from list without delay
- **Categorize Transaction**: Category updates without page reload

#### Smart Refetching

React Query intelligently refreshes data to keep your view up-to-date:

**Automatic Refetch Triggers:**
- **Window Focus**: Data refreshes when you return to the browser tab
- **Reconnect**: Data updates when internet connection restored
- **Mutation Success**: Related data refreshes after creating/updating records
- **Periodic Polling**: Optional auto-refresh for real-time data (disabled by default)

**Benefits:**
- **Always Up-to-Date**: See latest data without manual refresh
- **Multi-Device Sync**: Changes on one device appear on others
- **Collaborative**: Multiple users see consistent data

#### Loading States

SmartBudget provides clear feedback during data loading:

**Skeleton Loaders:**
- **Content-Shaped**: Placeholders match the layout of actual content
- **Shimmer Animation**: Subtle shimmer effect indicates loading
- **Instant Display**: Show immediately, no delay or blank screens
- **Smooth Transition**: Fade to real content when loaded

**Progressive Loading:**
- **Critical Data First**: Load essential information before secondary data
- **Lazy Loading**: Heavy components (charts, images) load on-demand
- **Infinite Scroll**: Transactions load in batches as you scroll

### Code Splitting & Lazy Loading

SmartBudget uses advanced techniques to minimize initial load time:

#### Dynamic Imports

**Heavy Libraries Deferred:**
- **Chart Libraries**: Recharts and D3 charts load only when needed (~130-160KB saved)
- **Date Pickers**: Calendar components load when opening date selector
- **File Parsers**: CSV/OFX parsers load only on import page
- **Analytics**: Advanced analytics charts load on-demand

**Benefits:**
- **Faster Initial Load**: Core app loads 40-50% faster
- **Smaller Bundles**: Users only download code they actually use
- **Better Performance**: Less JavaScript to parse and execute

#### Route-Based Splitting

Each page is a separate bundle that loads on-demand:
- **Dashboard**: Loads immediately (most visited page)
- **Transactions**: Loads when navigating to transactions page
- **Budgets**: Loads when accessing budget features
- **Settings**: Loads only when needed

### Redis Caching

SmartBudget uses Redis for server-side caching to accelerate data-intensive operations:

#### Dashboard Caching

**Cached Data:**
- **Overview Statistics**: Net worth, monthly spending, income, cash flow (5 min TTL)
- **Spending Trends**: Historical spending by category (5 min TTL)
- **Category Breakdown**: Current month category distribution (5 min TTL)
- **Category Heatmap**: 12-month spending heatmap (5 min TTL)
- **Cash Flow Sankey**: Income/expense flow diagram (5 min TTL)

**Cache Invalidation:**
- **Automatic**: Cache cleared when you create, update, or delete transactions
- **Smart**: Only affected user's cache is cleared, not everyone's
- **Instant Updates**: New data available immediately after mutations

**Performance Impact:**
- **First Load**: 500-1000ms to calculate dashboard (database query)
- **Cached Load**: 10-50ms to retrieve from Redis (50-100x faster)
- **With 10,000 Transactions**: Dashboard loads in <50ms instead of 1-2 seconds

#### ML Model Caching

**Cached ML Data:**
- **Training Data**: Categorization training dataset (cached until retrain)
- **Embeddings**: Merchant name embeddings (permanent cache, updated on training)
- **Model State**: Latest trained model state (cached until retrain)

**Benefits:**
- **Faster Categorization**: Instant category predictions without recalculation
- **Reduced CPU**: No need to recalculate embeddings for each transaction
- **Scalability**: Supports categorizing thousands of transactions per second

### Database Query Optimization

SmartBudget's database queries are optimized for speed:

**Optimization Techniques:**
- **Single-Pass Aggregation**: Calculate all statistics in one pass through data
- **Indexed Queries**: All common queries use database indexes for fast lookup
- **Efficient Filtering**: Date range filters applied at database level, not in-memory
- **Batch Operations**: Import and bulk operations use batch inserts (100-1000x faster)

**Performance Results:**
- **With 1,000 Transactions**: Dashboard loads in <200ms
- **With 10,000 Transactions**: Dashboard loads in <500ms
- **With 100,000 Transactions**: Dashboard loads in <2 seconds

### Network Optimization

**Request Optimization:**
- **Request Deduplication**: Identical requests merged into single API call
- **Parallel Loading**: Independent data loaded simultaneously
- **Compression**: API responses compressed with gzip (70-80% size reduction)
- **CDN**: Static assets served from edge locations near you

**Progressive Enhancement:**
- **Critical CSS**: Inline styles for above-the-fold content
- **Deferred Scripts**: Non-critical JavaScript loads after page interactive
- **Image Optimization**: Images served in next-gen formats (WebP, AVIF)
- **Font Optimization**: System fonts load instantly, custom fonts optional

---

## Tips and Best Practices

### Getting the Most from SmartBudget

#### 1. Import Regularly

- **Weekly imports** keep your data up-to-date
- Easier to review and categorize smaller batches
- Stay on top of your spending in real-time

#### 2. Review Auto-Categorization

- Check low-confidence transactions (below 70%)
- Correct miscategorizations immediately
- SmartBudget learns from your corrections

#### 3. Use Budgets Actively

- Review budget progress weekly
- Adjust budgets based on actual spending patterns
- Use budget alerts to stay on track

#### 4. Set Realistic Goals

- Start with achievable goals
- Break large goals into smaller milestones
- Celebrate progress to stay motivated

#### 5. Leverage Tags

- Tag business expenses for easy tax reporting
- Tag reimbursable expenses to track what's owed to you
- Create tags for specific projects or events

#### 6. Reconcile Accounts

- Mark transactions as **"Reconciled"** after matching with bank statements
- Helps identify missing or duplicate transactions
- Ensures your SmartBudget balance matches your bank

#### 7. Use Custom Date Ranges

- Align with your pay periods (if bi-weekly)
- Create seasonal budgets (holiday spending)
- Compare specific time periods

### Privacy and Security

#### Your Data is Safe

- **Encryption**: All data encrypted at rest and in transit (AES-256, TLS 1.3)
- **No Sharing**: Your financial data is never sold or shared
- **Bank Credentials**: SmartBudget never stores your online banking passwords
- **Read-Only**: Transaction imports use read-only files (CSV/OFX)

#### Best Practices

- Use a strong, unique password
- Enable two-factor authentication (2FA)
- Log out on shared devices
- Review connected sessions regularly

#### Data Export and Deletion

- **Export Your Data**: Download all data as JSON or CSV anytime
- **Delete Account**: Permanently delete your account and all data from the **Settings** page
- **GDPR Compliant**: Full data portability and right to deletion

---

## Troubleshooting

### Import Issues

#### "File format not recognized"

- **Solution**: Ensure file is CSV, OFX, or QFX
- Check file isn't corrupted
- Try re-downloading from your bank

#### "Duplicate transactions detected"

- **Expected**: SmartBudget prevents importing the same transactions twice
- Review the duplicates list
- Uncheck duplicates you want to skip
- Click "Import Non-Duplicates"

#### "Date format error"

- **Solution**: SmartBudget supports multiple date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- If parsing fails, try converting to standard CSV format
- Contact support with a sample file

#### "Amount parsing error"

- **Solution**: Ensure amounts use standard formats:
  - `-$50.00` or `$50.00-` for debits
  - `$50.00` or `+$50.00` for credits
  - No special characters except `.` and `-`

### Categorization Issues

#### "Transaction categorized incorrectly"

- **Solution**: Click the transaction → Edit → Change category
- SmartBudget learns from your correction
- If many transactions from the same merchant are wrong, correct one and SmartBudget will apply to similar transactions

#### "Low confidence score on many transactions"

- **Expected**: New accounts or unusual merchants may have lower confidence
- As you correct transactions, the ML model improves
- Use "Research Merchant" for unknown businesses

#### "Can't find a category"

- **Solution**: Use the search box in the category dropdown
- Check subcategories under primary categories
- Use "GENERAL" → "Other" for truly miscellaneous expenses

### Performance Issues

#### "Dashboard loading slowly"

- **Solution**:
  - Use shorter timeframes (month instead of all-time)
  - Clear browser cache
  - Check internet connection
  - Wait for background processing to complete

#### "Import taking a long time"

- **Normal**: Large files (10,000+ transactions) can take 30-60 seconds
- Import runs in background - you can navigate away
- You'll receive a notification when complete

### Account Issues

#### "Balance doesn't match bank statement"

- **Solution**:
  - Ensure all transactions are imported
  - Check for duplicate or missing transactions
  - Manually add any missing transactions
  - Use "Update Balance" to create an adjustment

#### "Can't delete account"

- **Reason**: Accounts with transactions can't be deleted
- **Solution**:
  - Archive the account instead (toggle "Active" off)
  - Or delete all transactions first (warning: permanent)

### Login and Access Issues

#### "Forgot password"

1. Click "Forgot Password" on login page
2. Enter your email
3. Check inbox for reset link
4. Create new password

#### "Email verification link expired"

1. Try logging in
2. You'll see "Resend Verification Email" link
3. Click to receive a new link

#### "Two-factor authentication not working"

- **Solution**:
  - Ensure device time is synced
  - Try backup codes (saved during 2FA setup)
  - Contact support for manual verification

---

## Getting Help

### Support Resources

- **Documentation**: This user guide and API documentation
- **FAQ**: Common questions at [Support Site URL]
- **Video Tutorials**: Step-by-step guides at [YouTube Channel]
- **Community Forum**: Connect with other users
- **Email Support**: support@smartbudget.app

### Feature Requests

Have an idea for SmartBudget?

- Visit our **Feature Request** page
- Upvote existing requests
- Submit new ideas
- Track development progress

### Report a Bug

Found an issue?

1. Go to **Settings** → **Report Bug**
2. Describe the problem
3. Include steps to reproduce
4. Attach screenshots (optional)
5. Submit

Our team reviews all bug reports and prioritizes fixes.

---

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts. All shortcuts are designed for accessibility and work with screen readers.

### Global Navigation

**Skip to Content:**
- `Tab` (on page load): Jump to main content, skipping navigation

**Menu Navigation:**
- `Tab`: Move forward through interactive elements
- `Shift + Tab`: Move backward through interactive elements
- `Enter` or `Space`: Activate the focused link or button
- `Escape`: Close dialogs, drawers, and dropdowns

### Page Navigation

**Quick Links** (Desktop only):
- Desktop users can use arrow keys to navigate through sidebar menu items
- `Enter`: Navigate to selected menu item

**Mobile Navigation:**
- Swipe gestures on mobile for drawer menu (slide from right edge)
- Tap bottom navigation icons to switch between main pages

### Transactions Page

- `Tab`: Navigate through transactions table
- `↑ / ↓`: Navigate between transaction rows (when focused on table)
- `Enter`: Open selected transaction details
- `Escape`: Close transaction detail dialog

**Filters:**
- `Tab` to filter panel, `Space` to expand/collapse
- Arrow keys to navigate filter options
- `Enter` to apply filters

### Budgets Page

- `Tab`: Navigate through budget cards
- `Enter`: Open budget details
- Arrow keys: Navigate budget categories

### Dashboard

- `Tab`: Navigate through stat cards and charts
- Chart interactions via keyboard (when focused):
  - Arrow keys: Navigate data points
  - `Enter`: View details for selected data point

### Dialog & Modal Shortcuts

**In Any Dialog:**
- `Escape`: Close dialog and return focus to trigger
- `Tab`: Cycle forward through dialog elements
- `Shift + Tab`: Cycle backward through dialog elements
- `Enter`: Submit form or confirm action (when focused on button)

**Form Inputs:**
- `Tab`: Move to next input field
- `Shift + Tab`: Move to previous input field
- `Space`: Toggle checkboxes
- `↑ / ↓`: Navigate dropdown options

### Accessibility Features

**Focus Management:**
- All interactive elements are keyboard accessible
- Focus indicators (blue ring) clearly show current position
- Focus trapped in dialogs until closed
- Focus returns to trigger element when closing dialogs

**Screen Reader Navigation:**
- `H`: Jump to next heading (NVDA, JAWS)
- `B`: Jump to next button
- `F`: Jump to next form element
- `L`: Jump to next link
- `R`: Jump to next landmark region (navigation, main, aside)

### Tips for Keyboard Users

1. **Use Tab Liberally**: Press Tab to discover keyboard shortcuts in each section
2. **Look for Focus Indicators**: Blue ring shows where you are on the page
3. **Escape to Close**: Press Escape to exit any dialog or overlay
4. **Enter to Confirm**: Press Enter on buttons to activate them
5. **Skip Navigation**: Press Tab immediately after page load to skip to main content

---

## What's Next?

Now that you understand SmartBudget's features, here's how to maximize your success:

### New in SmartBudget 2.0

SmartBudget has been completely redesigned with powerful new features:

**Mobile Experience:**
- ✨ **Bottom Navigation Bar**: Quick access to your most-used features on mobile
- ✨ **Responsive Design**: Beautiful, optimized layouts for phone, tablet, and desktop
- ✨ **Touch-Optimized**: All buttons sized perfectly for comfortable tapping
- ✨ **Drawer Menu**: Swipe-to-open menu for secondary features

**Performance Enhancements:**
- ⚡ **50% Faster Loading**: React Query caching makes navigation instant
- ⚡ **Optimistic Updates**: Changes appear immediately without waiting
- ⚡ **Redis Caching**: Dashboard loads 50-100x faster with caching
- ⚡ **Code Splitting**: Initial page loads 40-50% faster

**Design Improvements:**
- 🎨 **Design System**: Consistent spacing, typography, and colors throughout
- 🎨 **Colorblind-Friendly Charts**: Accessible color palettes for all users
- 🎨 **Smooth Animations**: Polished transitions that respect reduced motion preferences
- 🎨 **Dark Mode Enhancements**: Improved contrast and readability

**Accessibility:**
- ♿ **WCAG 2.1 AA Compliant**: Meets international accessibility standards
- ♿ **Full Keyboard Support**: Navigate entire app without a mouse
- ♿ **Screen Reader Optimized**: Works perfectly with NVDA, JAWS, and VoiceOver
- ♿ **Reduced Motion Support**: Respects user motion preferences

**Developer Experience:**
- 🔧 **TypeScript Strict Mode**: Caught 60+ potential bugs
- 🔧 **Comprehensive Testing**: 260+ E2E tests, 76 integration tests
- 🔧 **API Validation**: All endpoints validated with Zod schemas
- 🔧 **Security Hardening**: RBAC, rate limiting, and input validation

### Week 1: Setup
- ✅ Create account
- ✅ Add all bank accounts and credit cards
- ✅ Import last 3-6 months of transactions
- ✅ Review and correct categorization

### Week 2: Budget
- ✅ Create your first budget
- ✅ Set realistic spending limits
- ✅ Enable budget alerts

### Week 3: Goals
- ✅ Set 1-3 financial goals
- ✅ Define target amounts and dates
- ✅ Link goals to specific accounts or categories

### Week 4: Optimize
- ✅ Review spending insights
- ✅ Identify savings opportunities
- ✅ Adjust budgets based on actual spending
- ✅ Set up recurring transaction rules

### Monthly: Review
- 📅 Import new transactions
- 📅 Review budget performance
- 📅 Update goal progress
- 📅 Check for subscription optimizations

### Quarterly: Plan
- 📅 Analyze spending trends
- 📅 Adjust budgets for upcoming season
- 📅 Review and update goals
- 📅 Export tax-relevant transactions

---

## Conclusion

SmartBudget is designed to give you complete visibility and control over your finances. By following this guide and actively using the platform, you'll:

- ✨ Understand where your money goes
- ✨ Stay within budget with real-time tracking
- ✨ Achieve your financial goals faster
- ✨ Make data-driven financial decisions
- ✨ Reduce financial stress

**Happy budgeting!** 🎉

---

*Version 2.0 | Last Updated: January 2026 | Complete UI Redesign*
