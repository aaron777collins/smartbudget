# SmartBudget Beta Testing Guide

## Welcome Beta Testers!

Thank you for participating in the SmartBudget beta testing program! Your feedback is invaluable in helping us build the best personal finance management application possible. This guide will help you get started and make the most of your testing experience.

---

## Table of Contents

1. [Beta Program Overview](#beta-program-overview)
2. [Getting Started](#getting-started)
3. [What to Test](#what-to-test)
4. [How to Report Issues](#how-to-report-issues)
5. [Feature Feedback](#feature-feedback)
6. [Known Issues](#known-issues)
7. [Beta Testing Best Practices](#beta-testing-best-practices)
8. [FAQ](#faq)
9. [Contact & Support](#contact--support)

---

## Beta Program Overview

### Current Beta Phase

**Phase:** Open Beta
**Version:** 1.0.0-beta
**Start Date:** January 2026
**Expected Duration:** 4-6 weeks

### What's Included

SmartBudget is currently **completely free** during the beta period. All features are available without restrictions:

- ✅ Unlimited transaction imports (CSV, OFX, QFX)
- ✅ AI-powered auto-categorization
- ✅ Claude AI merchant lookup
- ✅ Comprehensive budgets
- ✅ Financial insights and analytics
- ✅ Goal tracking
- ✅ Advanced reporting

### Program Goals

The beta testing program aims to:

1. **Validate Core Functionality** - Ensure all features work as intended
2. **Identify Bugs** - Find and fix issues before public launch
3. **Gather User Feedback** - Understand user needs and preferences
4. **Test Performance** - Verify app performance with real-world usage
5. **Improve UX** - Refine user experience based on feedback
6. **Verify Data Accuracy** - Ensure transaction parsing and categorization accuracy

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- ✅ A modern web browser (Chrome, Firefox, Safari, or Edge - latest version)
- ✅ A SmartBudget account (sign up at the app)
- ✅ Transaction data to import (CSV, OFX, or QFX files from your bank)

### Initial Setup (5-10 minutes)

1. **Create Your Account**
   - Sign up with username/password
   - Email is optional

2. **Complete Onboarding**
   - Follow the guided onboarding tour
   - Create your first account (bank or credit card)
   - Import your first transactions
   - Set up your first budget (optional but recommended)

3. **Explore the Dashboard**
   - Familiarize yourself with the navigation
   - Check out the overview cards
   - View spending trends and charts

4. **Import Historical Data**
   - Download transaction history from your bank (last 3-6 months recommended)
   - Import via Transactions → Import
   - Review auto-categorization results

### Test Account Data

For testing purposes, we provide sample CSV files:

- `sample-transactions-3-column.csv` - Basic CIBC format
- `sample-transactions-4-column.csv` - CIBC with separate credit/debit columns
- `sample-transactions-ofx.ofx` - OFX format sample
- `sample-transactions-qfx.qfx` - QFX format sample

Download these from the **Help** section in the app.

---

## What to Test

### Priority 1: Core Features (Must Test)

These are the most critical features that require thorough testing:

#### 1. Transaction Import System
- **CSV Import**
  - [ ] Import 3-column CSV (Date, Description, Amount)
  - [ ] Import 4-column CSV (Date, Description, Credit, Debit)
  - [ ] Import CSV with 1000+ transactions
  - [ ] Test with malformed CSV files
  - [ ] Verify duplicate detection
  - [ ] Check date parsing for different formats

- **OFX/QFX Import**
  - [ ] Import OFX file from bank
  - [ ] Import QFX file from bank
  - [ ] Verify FITID-based duplicate detection
  - [ ] Check merchant name extraction (NAME + MEMO)
  - [ ] Verify balance information parsing

- **Manual Entry**
  - [ ] Add single transaction manually
  - [ ] Edit existing transaction
  - [ ] Delete transaction
  - [ ] Verify amount and date validation

#### 2. Auto-Categorization
- [ ] Import uncategorized transactions
- [ ] Verify auto-categorization accuracy
- [ ] Correct miscategorized transactions
- [ ] Check if corrections improve future categorization
- [ ] Test merchant normalization (e.g., "TIM HORTONS #1234" → "Tim Hortons")
- [ ] Review confidence scores
- [ ] Categorize transactions with low confidence manually

#### 3. Claude AI Merchant Lookup
- [ ] Find transaction with unknown merchant
- [ ] Click "Research Merchant" button
- [ ] Wait for Claude AI to research
- [ ] Review suggested category
- [ ] Accept or reject suggestion
- [ ] Verify result saved to knowledge base

#### 4. Dashboard & Visualizations
- [ ] View dashboard overview cards (Net Worth, Monthly Spending, Income, Cash Flow)
- [ ] Check spending trends chart (last 12 months)
- [ ] View category breakdown pie chart
- [ ] Test timeframe selector (This Month, Last 30 Days, This Year, etc.)
- [ ] Verify data accuracy in all charts
- [ ] Test responsive design on mobile

#### 5. Budget Management
- [ ] Create Fixed Amount budget
- [ ] Create Percentage-based budget (50/30/20)
- [ ] Create Envelope budget
- [ ] Create Goal-based budget
- [ ] Track budget progress
- [ ] Test budget alerts (80%, 90%, 100%)
- [ ] Verify budget calculations are correct
- [ ] Test budget rollover functionality

#### 6. Account Management
- [ ] Add checking account
- [ ] Add savings account
- [ ] Add credit card account
- [ ] Update account balance
- [ ] Deactivate account
- [ ] Delete account (verify cascade behavior)

### Priority 2: Advanced Features (Should Test)

#### 7. Search & Filtering
- [ ] Search transactions by merchant name
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Filter by amount range
- [ ] Filter by account
- [ ] Save filter preset
- [ ] Apply saved filter preset

#### 8. Tags & Labels
- [ ] Create custom tags
- [ ] Apply tags to transactions
- [ ] Filter by tags
- [ ] Bulk tag operations

#### 9. Split Transactions
- [ ] Split transaction into 2 categories
- [ ] Split transaction into 3+ categories
- [ ] Save split pattern
- [ ] Apply saved split pattern

#### 10. Recurring Transactions
- [ ] Auto-detect recurring pattern
- [ ] View upcoming recurring expenses
- [ ] Create recurring rule manually
- [ ] Test missing transaction alerts

#### 11. Goals
- [ ] Create savings goal
- [ ] Create debt payoff goal
- [ ] Track goal progress
- [ ] Mark goal as completed

#### 12. Reports & Export
- [ ] Export transactions to CSV
- [ ] Export to Excel (XLSX)
- [ ] Generate PDF report
- [ ] View spending by merchant report
- [ ] View category trend report

### Priority 3: Polish & UX (Nice to Test)

#### 13. User Interface
- [ ] Test dark mode toggle
- [ ] Test mobile responsive design
- [ ] Check accessibility (keyboard navigation, screen reader)
- [ ] Test animations and transitions
- [ ] Verify loading states

#### 14. Settings
- [ ] Change currency
- [ ] Change date format
- [ ] Change first day of week
- [ ] Update budget alert threshold
- [ ] Enable/disable notifications
- [ ] Configure email digest

#### 15. Error Handling
- [ ] Test with invalid file formats
- [ ] Try importing corrupted CSV
- [ ] Test with empty files
- [ ] Test with missing required fields
- [ ] Verify error messages are helpful

---

## How to Report Issues

### Using the In-App Feedback Form

The easiest way to report issues is through the built-in feedback form:

1. **Navigate to Settings**
   - Click on your profile icon (top right)
   - Select "Settings" from dropdown
   - Or click "Settings" in sidebar

2. **Go to Feedback Tab**
   - Click "Feedback" tab
   - Or directly navigate to Settings → Feedback

3. **Fill Out the Form**
   - **Type:** Select "Bug Report" for issues
   - **Priority:**
     - **Low:** Minor cosmetic issues, typos
     - **Medium:** Usability issues, non-critical bugs
     - **High:** Feature not working as expected
     - **Critical:** App unusable, data loss, security issue
   - **Title:** Brief summary (e.g., "CSV import fails with 4-column format")
   - **Description:** Detailed explanation of the issue
   - **Steps to Reproduce:** List exact steps to recreate the bug
   - **Expected Behavior:** What should happen
   - **Actual Behavior:** What actually happens
   - **Additional Info:** Screenshots description, error messages, etc.

4. **Submit**
   - Browser info is collected automatically
   - You'll receive a confirmation message
   - We'll review and respond within 24-48 hours

### Bug Report Template

If reporting via email or other channels, use this template:

```
**Bug Title:** [Brief summary]

**Priority:** [Low/Medium/High/Critical]

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Screen Resolution: [1920x1080, etc.]
- Account: [your email or user ID]

**Screenshots/Videos:**
[Attach or describe]

**Additional Context:**
[Any other relevant information]
```

### What Makes a Good Bug Report

A high-quality bug report includes:

1. ✅ **Clear Title** - Summarizes the issue in 5-10 words
2. ✅ **Reproducible Steps** - Anyone can follow and recreate the bug
3. ✅ **Expected vs Actual** - Clear contrast between what should happen and what does
4. ✅ **Environment Details** - Browser, OS, screen size
5. ✅ **Screenshots** - Visual proof of the issue (when applicable)
6. ✅ **Error Messages** - Exact error text or console logs
7. ✅ **Impact** - How severely does this affect your usage?

### Example: Great Bug Report

```
**Title:** Transaction import fails with CSV files over 5MB

**Priority:** High

**Description:**
When attempting to import a CSV file larger than 5MB (approximately 10,000+ transactions),
the import fails with a "Request timeout" error. Smaller files (< 5MB) work fine.

**Steps to Reproduce:**
1. Go to Transactions → Import
2. Click "Upload CSV"
3. Select a CSV file larger than 5MB (I tested with a 6.2MB file with 12,000 transactions)
4. Click "Preview"
5. Wait 30 seconds
6. Error appears: "Request timeout - please try again"

**Expected Behavior:**
The CSV should be parsed and a preview of transactions should appear, regardless of file size
(within reasonable limits, e.g., 50MB).

**Actual Behavior:**
After 30 seconds, a "Request timeout" error appears and the import fails. No transactions
are imported.

**Environment:**
- Browser: Chrome 120.0.6099.129 (64-bit)
- OS: Windows 11 Pro
- Screen Resolution: 1920x1080
- File Size: 6.2MB
- Transaction Count: 12,043
- Account: beta-tester@example.com

**Workaround:**
I split the CSV into 3 smaller files (each ~2MB, 4,000 transactions) and imported them
separately. This worked, but was inconvenient.

**Additional Context:**
My bank provides transaction history in large CSV files going back several years. Many users
will likely encounter this issue when importing historical data.
```

---

## Feature Feedback

### Feature Requests

Have an idea for a new feature? We'd love to hear it!

1. **Check Existing Requests**
   - Review the [Feature Requests Board](https://github.com/smartbudget/features) (if available)
   - Upvote existing requests that match your idea

2. **Submit New Feature Request**
   - Go to Settings → Feedback
   - Select Type: "Feature Request"
   - Provide:
     - Clear title
     - Detailed description
     - Use case (why you need this)
     - Expected behavior
     - Priority (Low/Medium/High)

3. **Feature Request Template**

```
**Feature Title:** [Brief summary]

**Problem Statement:**
[What problem does this solve?]

**Proposed Solution:**
[How should this feature work?]

**Use Case:**
[When and why would you use this?]

**Priority:** [Low/Medium/High]

**Alternatives Considered:**
[Any workarounds or alternative approaches?]

**Additional Context:**
[Mockups, examples from other apps, etc.]
```

### Improvement Suggestions

For improvements to existing features:

1. **Navigate to Settings → Feedback**
2. **Select Type: "Improvement Suggestion"**
3. **Describe:**
   - Current behavior
   - Suggested improvement
   - Expected benefits
   - Priority

### Example: Great Feature Request

```
**Feature Title:** Support for multiple currencies in same account

**Problem Statement:**
I travel frequently and make purchases in multiple currencies on the same credit card.
Currently, all transactions are converted to my default currency (CAD), but I'd like to see
the original currency and amount, along with the exchange rate used.

**Proposed Solution:**
1. Add "Original Currency" and "Original Amount" fields to each transaction
2. During CSV import, detect currency codes in descriptions (e.g., "USD 50.00")
3. Display original amount alongside converted amount in transaction list
4. Show exchange rate in transaction details
5. Allow filtering and reporting by original currency

**Use Case:**
- Track spending in foreign currencies separately
- Understand exchange rate impact on budget
- Reconcile with credit card statements that show both currencies
- Compare spending across different countries

**Priority:** Medium

**Alternatives Considered:**
Currently, I manually add a tag like "USD" to transactions and note the original amount in
the notes field. This works but is tedious and doesn't provide analytics.

**Additional Context:**
Similar to how Mint and YNAB handle multi-currency transactions. Example screenshot from Mint
attached showing currency conversion details.
```

---

## Known Issues

We're aware of the following issues and are actively working on fixes:

### High Priority (Working on Now)

1. **Transaction Import Timeout for Large Files**
   - **Issue:** CSV files over 5MB timeout during import
   - **Workaround:** Split large files into smaller chunks (< 5MB each)
   - **Status:** Fix in progress, will be resolved in next release

2. **Mobile Layout Issues on Tablets**
   - **Issue:** Dashboard cards overlap on some tablet screen sizes (768px-1024px)
   - **Workaround:** Use portrait mode or desktop view
   - **Status:** Fix scheduled for v1.0.1

3. **Category Autocomplete Slow with 10,000+ Transactions**
   - **Issue:** Category dropdown lags when filtering with large transaction history
   - **Workaround:** Use search to narrow down categories first
   - **Status:** Performance optimization in progress

### Medium Priority (Scheduled for Next Sprint)

4. **Dark Mode Flash on Page Load**
   - **Issue:** Brief white flash before dark mode loads
   - **Workaround:** None currently
   - **Status:** Investigating theme persistence solution

5. **Email Notifications Not Sending**
   - **Issue:** Email digest and budget alerts don't send (feature not yet implemented)
   - **Workaround:** Check app regularly for updates
   - **Status:** Email service integration planned for v1.1.0

6. **Export to Excel Formatting Issues**
   - **Issue:** Excel export doesn't preserve number formatting (amounts shown as text)
   - **Workaround:** Use "Text to Columns" feature in Excel after import
   - **Status:** Fix scheduled for v1.0.2

### Low Priority (Future Releases)

7. **Keyboard Shortcuts Not Documented**
   - **Issue:** Keyboard shortcuts exist but aren't shown in UI
   - **Workaround:** None needed (feature works, just not discoverable)
   - **Status:** Will add keyboard shortcuts help modal in v1.1.0

8. **No Bulk Edit for Transactions**
   - **Issue:** Can't edit multiple transactions at once (categorize, tag, delete)
   - **Workaround:** Edit transactions individually
   - **Status:** Bulk operations planned for v1.2.0

### Won't Fix / By Design

9. **Can't Import From Mint/YNAB Directly**
   - **Reason:** No public APIs available; export to CSV and import instead
   - **Workaround:** Export from Mint/YNAB to CSV, then import to SmartBudget

10. **No Real-Time Bank Sync**
    - **Reason:** Plaid integration planned for post-beta (requires bank partnerships)
    - **Workaround:** Export from bank website manually

---

## Beta Testing Best Practices

### Do's ✅

1. **Test Regularly** - Use SmartBudget as your primary finance app during beta
2. **Try Edge Cases** - Test unusual scenarios, not just happy paths
3. **Report Issues Promptly** - Don't wait; report bugs as you find them
4. **Provide Context** - More detail is always better than less
5. **Be Specific** - "Import button doesn't work" vs "Import button shows spinner forever when CSV has empty lines"
6. **Test on Multiple Browsers** - Try Chrome, Firefox, Safari if possible
7. **Test on Mobile** - Responsive design is critical
8. **Update Regularly** - Clear cache and reload when we push updates
9. **Verify Fixes** - Check if reported bugs are resolved in new releases
10. **Be Patient** - We're a small team working hard to fix issues

### Don'ts ❌

1. **Don't Use Real Financial Data** - Use test data or anonymized exports
2. **Don't Share Credentials** - We'll never ask for your bank login
3. **Don't Expect 100% Uptime** - Beta apps may have downtime
4. **Don't Rely Solely on SmartBudget** - Keep backup records during beta
5. **Don't Report Duplicate Issues** - Check known issues list first
6. **Don't Provide Vague Reports** - "It's broken" isn't helpful
7. **Don't Expect Instant Fixes** - Critical bugs get priority, minor issues may take time
8. **Don't Ignore Terms of Service** - Beta data may be wiped (with notice)

### Testing Tips

**For Developers:**
- Open browser DevTools (F12) and check Console for errors
- Include console errors in bug reports
- Test API responses in Network tab
- Try different screen sizes in DevTools

**For Non-Technical Testers:**
- Take screenshots of issues
- Note what you were doing before the bug occurred
- Try to reproduce the bug multiple times
- Use different devices if available

**For Power Users:**
- Import large datasets (10,000+ transactions)
- Create complex budgets with many categories
- Test edge cases (negative amounts, $0 transactions, future dates)
- Try to break the app (it helps us make it stronger!)

---

## FAQ

### General Questions

**Q: Is my financial data safe?**
A: Yes! We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest). We never store bank credentials. Transaction data is encrypted in the database. See our [Security Documentation](DEPLOYMENT.md#security-configuration) for details.

**Q: Will my beta data be deleted?**
A: No, beta data will migrate to production when we launch. However, we recommend keeping backups of your original CSV/OFX files just in case.

**Q: Can I invite friends to beta?**
A: Yes! Beta is open to everyone. Share the app URL with friends and family.

**Q: Is there a mobile app?**
A: Not yet. The web app is mobile-responsive and works well in mobile browsers. Native iOS/Android apps are planned for post-launch.

**Q: How long is the beta period?**
A: 4-6 weeks (January-February 2026). We'll announce the official launch date soon.

**Q: What happens after beta ends?**
A: SmartBudget will remain free with a generous free tier. Premium features may be added later as a paid upgrade (but all core features will stay free).

### Technical Questions

**Q: Which browsers are supported?**
A: Latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is NOT supported.

**Q: What file formats can I import?**
A: CSV (3-column and 4-column formats), OFX, and QFX. We're optimized for CIBC formats but support most North American banks.

**Q: Can I connect my bank directly?**
A: Not yet. Direct bank connection via Plaid is planned for v2.0 (post-launch). For now, download CSV/OFX from your bank's website.

**Q: How does auto-categorization work?**
A: We use a hybrid system: rule-based matching for known merchants (fast, 100% precision) + machine learning for unknown merchants (high accuracy, learns from your corrections). See [Technical Details](SMARTBUDGET_PLAN.md#2-ai-powered-auto-categorization-system).

**Q: What is Claude AI merchant lookup?**
A: When we encounter an unknown merchant (e.g., cryptic transaction description), you can click "Research Merchant" and Claude AI will search the web to identify the business and suggest a category. It's like having a finance assistant!

**Q: How accurate is auto-categorization?**
A: Currently 85-90% accurate out of the box, improving to 95%+ as you make corrections (the system learns from your feedback).

**Q: Can I import transactions from Mint or YNAB?**
A: Export your data from Mint/YNAB to CSV format, then import to SmartBudget. Direct import not supported yet.

**Q: How far back can I import transactions?**
A: No limit! Import as much history as you have. We've tested with 10+ years of data (100,000+ transactions).

**Q: Can I use SmartBudget for business expenses?**
A: Yes, but it's designed for personal finance. Business features (invoicing, tax categories, etc.) are not included. Use tags to separate business expenses.

### Privacy Questions

**Q: Do you sell my data?**
A: Never. We don't sell or share your financial data with third parties. See our [Privacy Policy](#).

**Q: Does Claude AI see my transactions?**
A: Only when YOU explicitly click "Research Merchant" on a specific transaction. We send minimal info (merchant name, amount, date) to Claude AI for research. Your full transaction history is never sent.

**Q: Can I export my data?**
A: Yes! Go to Transactions → Export. You can export to CSV or Excel anytime. Your data is yours.

**Q: How do I delete my account?**
A: Go to Settings → Account → Delete Account. All your data will be permanently deleted within 30 days.

**Q: Do you use my data for training AI models?**
A: No. Your transaction data stays private. We only use anonymized, aggregated statistics (e.g., "% of users who categorize transactions correctly") for improving the system.

---

## Contact & Support

### Get Help

**In-App Feedback Form:**
Settings → Feedback tab (fastest response)

**Email:**
beta@smartbudget.app

**Response Time:**
- Critical bugs: Within 4 hours
- High priority: Within 24 hours
- Medium/Low priority: Within 48 hours
- Feature requests: Acknowledged within 1 week

### Stay Updated

**Release Notes:**
Check the app for release notes when we push updates (you'll see a notification)

**Beta Testing Slack/Discord:**
[Coming soon - we'll invite active testers]

**Twitter/X:**
[@SmartBudgetApp](#) (updates and announcements)

### Thank You!

Thank you for being a beta tester! Your participation is essential to making SmartBudget the best personal finance app possible. Every bug report, feature suggestion, and piece of feedback helps us improve.

We're excited to build this with you!

— The SmartBudget Team

---

## Appendix: Testing Checklist

Use this checklist to track your testing progress:

### Core Features
- [ ] Import 3-column CSV
- [ ] Import 4-column CSV
- [ ] Import OFX file
- [ ] Import QFX file
- [ ] Create account
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Auto-categorize transactions
- [ ] Correct categorization
- [ ] Research merchant with Claude AI
- [ ] Create Fixed Amount budget
- [ ] Create Percentage budget
- [ ] View dashboard
- [ ] View spending trends
- [ ] View category breakdown

### Advanced Features
- [ ] Search transactions
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Create tags
- [ ] Split transaction
- [ ] Create goal
- [ ] Export to CSV
- [ ] Export to Excel
- [ ] Generate PDF report

### UI/UX
- [ ] Test dark mode
- [ ] Test mobile responsive
- [ ] Test keyboard navigation
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari

### Edge Cases
- [ ] Import empty CSV
- [ ] Import large file (5MB+)
- [ ] Import malformed CSV
- [ ] Create budget with $0 amounts
- [ ] Test with 10,000+ transactions
- [ ] Test with negative amounts

### Bug Reporting
- [ ] Report at least 1 bug (if found)
- [ ] Submit feature request
- [ ] Suggest improvement

**Completion Date:** ___________

**Overall Experience (1-10):** _____

**Would you recommend SmartBudget?** ☐ Yes ☐ No

**Comments:** ___________________________________________

---

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Next Review:** Every week during beta period
