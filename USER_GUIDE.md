# SmartBudget User Guide

Welcome to **SmartBudget** - your comprehensive personal finance management system! This guide will help you get the most out of SmartBudget's powerful features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Accounts](#managing-accounts)
3. [Importing Transactions](#importing-transactions)
4. [Understanding Categories](#understanding-categories)
5. [Using the Dashboard](#using-the-dashboard)
6. [Creating and Managing Budgets](#creating-and-managing-budgets)
7. [Setting Financial Goals](#setting-financial-goals)
8. [Advanced Features](#advanced-features)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Visit the SmartBudget homepage
2. Click "Sign Up" in the top navigation
3. Choose a username and create a secure password
4. Optionally enter your email address
5. Log in with your new credentials (username and password)

### First-Time Setup

After logging in for the first time:

1. **Add Your First Account**: Set up your bank accounts and credit cards
2. **Import Transactions**: Upload your transaction history from CIBC or other banks
3. **Review Categories**: SmartBudget will automatically categorize your transactions
4. **Create a Budget**: Set spending limits for different categories
5. **Set Goals**: Define your financial objectives

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

Speed up your workflow with keyboard shortcuts:

### Global

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Open command palette
- `G then D`: Go to Dashboard
- `G then T`: Go to Transactions
- `G then B`: Go to Budgets
- `G then G`: Go to Goals
- `G then A`: Go to Accounts

### Transactions Page

- `N`: New transaction
- `I`: Import transactions
- `F`: Focus search/filter
- `↑ / ↓`: Navigate transactions
- `Enter`: Open selected transaction
- `E`: Edit selected transaction
- `Delete`: Delete selected transaction

### Dashboard

- `T`: Change timeframe
- `R`: Refresh data

---

## What's Next?

Now that you understand SmartBudget's features, here's how to maximize your success:

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

*Version 1.0 | Last Updated: January 2026*
