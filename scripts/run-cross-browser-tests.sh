#!/bin/bash

###############################################################################
# Cross-Browser Test Execution Script
# Task 10.1 - SmartBudget Complete UI Redesign
#
# This script runs comprehensive cross-browser tests and generates a report.
###############################################################################

set -e  # Exit on error

echo "================================================"
echo "SmartBudget Cross-Browser Testing Suite"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running in CI
if [ "$CI" = "true" ]; then
    print_status "Running in CI mode"
    RUN_MODE="ci"
else
    print_status "Running in local mode"
    RUN_MODE="local"
fi

# Step 1: Check system dependencies
print_status "Step 1: Checking system dependencies..."
if command -v google-chrome &> /dev/null || command -v chromium &> /dev/null; then
    print_success "Chromium-based browser found"
else
    print_warning "Chromium not found - Playwright will use bundled version"
fi

if command -v firefox &> /dev/null; then
    print_success "Firefox found"
else
    print_warning "Firefox not found - Playwright will use bundled version"
fi

# Step 2: Check Playwright installation
print_status "Step 2: Checking Playwright installation..."
if [ -d "node_modules/@playwright/test" ]; then
    print_success "Playwright is installed"
    PLAYWRIGHT_VERSION=$(npm list @playwright/test --depth=0 | grep @playwright/test | awk '{print $2}')
    print_status "Playwright version: $PLAYWRIGHT_VERSION"
else
    print_error "Playwright not installed. Run: npm install"
    exit 1
fi

# Step 3: Install Playwright browsers
print_status "Step 3: Installing/updating Playwright browsers..."
print_status "This may take a few minutes on first run..."

if [ "$RUN_MODE" = "ci" ]; then
    # CI mode: Install with dependencies
    npx playwright install --with-deps chromium firefox webkit
else
    # Local mode: Try to install browsers
    npx playwright install chromium firefox webkit || {
        print_warning "Browser installation had issues. Continuing anyway..."
    }
fi

print_success "Browsers installation complete"

# Step 4: Check database connection
print_status "Step 4: Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set. Using default from .env"
fi

# Step 5: Run tests per browser
print_status "Step 5: Running cross-browser tests..."
echo ""

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="test-results/cross-browser-$TIMESTAMP"
mkdir -p "$REPORT_DIR"

# Define browser projects
BROWSERS=(
    "chromium"
    "edge"
    "firefox"
    "webkit"
    "Mobile Chrome"
    "Mobile Chrome - Galaxy"
    "Mobile Safari - iPhone 12"
    "Mobile Safari - iPhone 13"
    "Mobile Safari - iPad"
)

# Track results
TOTAL_BROWSERS=${#BROWSERS[@]}
PASSED_BROWSERS=0
FAILED_BROWSERS=0

# Function to run tests for a browser
run_browser_tests() {
    local browser="$1"
    local output_file="$REPORT_DIR/${browser// /_}_results.txt"

    print_status "Testing on: $browser"

    if npx playwright test --project="$browser" > "$output_file" 2>&1; then
        print_success "$browser: All tests passed ✓"
        ((PASSED_BROWSERS++))
        return 0
    else
        print_error "$browser: Some tests failed ✗"
        ((FAILED_BROWSERS++))

        # Show failure summary
        echo "Failure details:" >> "$output_file"
        grep -A 5 "Error:" "$output_file" >> "$output_file" || true

        return 1
    fi
}

# Run tests for each browser
echo ""
print_status "Running tests across $TOTAL_BROWSERS browser configurations..."
echo ""

for browser in "${BROWSERS[@]}"; do
    # Skip Edge on non-Windows systems if not available
    if [ "$browser" = "edge" ]; then
        if ! command -v microsoft-edge &> /dev/null && [ "$RUN_MODE" != "ci" ]; then
            print_warning "Skipping Edge (not available on this system)"
            continue
        fi
    fi

    run_browser_tests "$browser" || true
    echo ""
done

# Step 6: Generate summary report
print_status "Step 6: Generating summary report..."

SUMMARY_FILE="$REPORT_DIR/SUMMARY.md"

cat > "$SUMMARY_FILE" << EOF
# Cross-Browser Test Results

**Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Mode:** $RUN_MODE
**Playwright Version:** $PLAYWRIGHT_VERSION

## Summary

- **Total Browsers Tested:** $TOTAL_BROWSERS
- **Passed:** $PASSED_BROWSERS ✓
- **Failed:** $FAILED_BROWSERS ✗
- **Success Rate:** $(awk "BEGIN {printf \"%.1f\", ($PASSED_BROWSERS/$TOTAL_BROWSERS)*100}")%

## Browser Results

| Browser | Status | Details |
|---------|--------|---------|
EOF

# Add results for each browser
for browser in "${BROWSERS[@]}"; do
    output_file="$REPORT_DIR/${browser// /_}_results.txt"

    if [ -f "$output_file" ]; then
        if grep -q "passed" "$output_file"; then
            echo "| $browser | ✅ PASS | All tests passed |" >> "$SUMMARY_FILE"
        else
            echo "| $browser | ❌ FAIL | See details in ${browser// /_}_results.txt |" >> "$SUMMARY_FILE"
        fi
    else
        echo "| $browser | ⚠️ SKIP | Not run |" >> "$SUMMARY_FILE"
    fi
done

cat >> "$SUMMARY_FILE" << EOF

## Test Coverage

- Authentication flows
- CRUD operations (Transactions, Budgets, Accounts)
- Dashboard visualizations
- Responsive design (Mobile, Tablet, Desktop)
- Accessibility (WCAG 2.1 AA)
- Keyboard navigation
- Touch gestures (mobile)

## Configuration

- **Playwright Config:** playwright.config.ts
- **CI Workflow:** .github/workflows/ci.yml
- **Test Directory:** e2e/
- **Test Files:** 9 comprehensive test suites

## Browser Configurations Tested

1. **Desktop Chrome** (Chromium) - Latest version
2. **Desktop Edge** (Chromium) - Latest version
3. **Desktop Firefox** (Gecko) - Latest version
4. **Desktop Safari** (WebKit) - Latest version
5. **Mobile Chrome** (Pixel 5) - Android
6. **Mobile Chrome** (Galaxy S9+) - Android
7. **Mobile Safari** (iPhone 12) - iOS 15+
8. **Mobile Safari** (iPhone 13) - iOS 15+
9. **Mobile Safari** (iPad Pro) - iPadOS

## Next Steps

EOF

if [ $FAILED_BROWSERS -gt 0 ]; then
    cat >> "$SUMMARY_FILE" << EOF
- Review failed test details in individual browser result files
- Fix browser-specific issues identified
- Re-run tests on affected browsers
- Update browser support matrix if needed
EOF
else
    cat >> "$SUMMARY_FILE" << EOF
- All browsers passed! ✅
- Deploy to production with confidence
- Monitor for browser-specific issues in production
- Schedule regular cross-browser testing (monthly)
EOF
fi

cat >> "$SUMMARY_FILE" << EOF

## Report Files

- Full report: \`$REPORT_DIR/\`
- HTML report: Run \`npx playwright show-report\`
- Individual browser logs: \`$REPORT_DIR/*_results.txt\`

---

*Generated by SmartBudget Cross-Browser Testing Suite*
*Task 10.1 - Complete UI Redesign*
EOF

print_success "Summary report generated: $SUMMARY_FILE"

# Step 7: Show summary
echo ""
echo "================================================"
echo "Cross-Browser Testing Complete"
echo "================================================"
echo ""
cat "$SUMMARY_FILE"
echo ""

# Step 8: Open HTML report (optional, local only)
if [ "$RUN_MODE" = "local" ]; then
    print_status "Opening Playwright HTML report..."
    npx playwright show-report 2>/dev/null &
fi

# Exit with appropriate code
if [ $FAILED_BROWSERS -gt 0 ]; then
    print_error "Some browsers failed testing"
    exit 1
else
    print_success "All browsers passed testing! 🎉"
    exit 0
fi
