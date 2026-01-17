#!/bin/bash
# Script to replace hardcoded Tailwind colors with design tokens

# List of files to process
files=(
  "src/components/session-timeout-modal.tsx"
  "src/app/budgets/[id]/budget-detail-client.tsx"
  "src/app/insights/insights-client.tsx"
  "src/app/import/page.tsx"
  "src/app/jobs/page.tsx"
  "src/components/file-upload.tsx"
  "src/components/error-boundary.tsx"
  "src/app/auth/signin/page.tsx"
  "src/app/auth/signup/page.tsx"
  "src/app/error.tsx"
  "src/components/bug-report-form.tsx"
  "src/components/sidebar.tsx"
  "src/components/transactions/split-transaction-editor.tsx"
  "src/components/dashboard/monthly-income-card.tsx"
  "src/app/settings/page.tsx"
  "src/components/dashboard/monthly-spending-card.tsx"
  "src/components/dashboard/net-worth-card.tsx"
  "src/components/budgets/budget-wizard.tsx"
  "src/components/dashboard/cash-flow-card.tsx"
  "src/app/auth/error/page.tsx"
  "src/app/budgets/analytics/budget-analytics-client.tsx"
  "src/app/budgets/budgets-client.tsx"
  "src/components/dashboard/cash-flow-sankey.tsx"
  "src/components/dashboard/upcoming-expenses.tsx"
  "src/app/transactions/page.tsx"
  "src/components/onboarding/onboarding-flow.tsx"
  "src/app/dashboard/dashboard-client.tsx"
  "src/app/recurring/recurring-client.tsx"
  "src/components/header.tsx"
  "src/components/recurring/recurring-detection-dialog.tsx"
)

for file in "${files[@]}"; do
  filepath="/tmp/smartbudget/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."

    # Text colors - handle dark mode variants first (more specific patterns first)
    sed -i 's/text-gray-900 dark:text-gray-100/text-foreground/g' "$filepath"
    sed -i 's/text-gray-800 dark:text-gray-200/text-foreground/g' "$filepath"
    sed -i 's/text-gray-700 dark:text-gray-300/text-foreground/g' "$filepath"
    sed -i 's/text-gray-600 dark:text-gray-400/text-muted-foreground/g' "$filepath"
    sed -i 's/text-gray-500 dark:text-gray-500/text-muted-foreground/g' "$filepath"
    sed -i 's/text-gray-400 dark:text-gray-600/text-muted-foreground/g' "$filepath"
    sed -i 's/text-red-600 dark:text-red-400/text-error/g' "$filepath"
    sed -i 's/text-red-500 dark:text-red-400/text-error/g' "$filepath"
    sed -i 's/text-red-700 dark:text-red-300/text-error/g' "$filepath"
    sed -i 's/text-green-600 dark:text-green-400/text-success/g' "$filepath"
    sed -i 's/text-green-500 dark:text-green-400/text-success/g' "$filepath"
    sed -i 's/text-green-700 dark:text-green-300/text-success/g' "$filepath"
    sed -i 's/text-blue-600 dark:text-blue-400/text-primary/g' "$filepath"
    sed -i 's/text-blue-700 dark:text-blue-300/text-primary/g' "$filepath"
    sed -i 's/text-blue-900 dark:text-blue-100/text-primary/g' "$filepath"
    sed -i 's/text-yellow-600 dark:text-yellow-400/text-warning/g' "$filepath"
    sed -i 's/text-amber-600 dark:text-amber-400/text-warning/g' "$filepath"
    sed -i 's/text-orange-600 dark:text-orange-400/text-warning/g' "$filepath"

    # Simple text colors (no dark mode)
    sed -i 's/\btext-gray-900\b/text-foreground/g' "$filepath"
    sed -i 's/\btext-gray-800\b/text-foreground/g' "$filepath"
    sed -i 's/\btext-gray-700\b/text-foreground/g' "$filepath"
    sed -i 's/\btext-gray-600\b/text-muted-foreground/g' "$filepath"
    sed -i 's/\btext-gray-500\b/text-muted-foreground/g' "$filepath"
    sed -i 's/\btext-gray-400\b/text-muted-foreground/g' "$filepath"
    sed -i 's/\btext-red-600\b/text-error/g' "$filepath"
    sed -i 's/\btext-red-500\b/text-error/g' "$filepath"
    sed -i 's/\btext-red-800\b/text-error/g' "$filepath"
    sed -i 's/\btext-green-600\b/text-success/g' "$filepath"
    sed -i 's/\btext-green-500\b/text-success/g' "$filepath"
    sed -i 's/\btext-blue-600\b/text-primary/g' "$filepath"
    sed -i 's/\btext-blue-700\b/text-primary/g' "$filepath"
    sed -i 's/\btext-blue-900\b/text-primary/g' "$filepath"
    sed -i 's/\btext-blue-500\b/text-primary/g' "$filepath"
    sed -i 's/\btext-purple-600\b/text-primary/g' "$filepath"
    sed -i 's/\btext-purple-700\b/text-primary/g' "$filepath"
    sed -i 's/\btext-purple-900\b/text-primary/g' "$filepath"
    sed -i 's/\btext-violet-500\b/text-primary/g' "$filepath"
    sed -i 's/\btext-indigo-500\b/text-primary/g' "$filepath"
    sed -i 's/\btext-sky-500\b/text-primary/g' "$filepath"
    sed -i 's/\btext-cyan-600\b/text-info/g' "$filepath"
    sed -i 's/\btext-orange-700\b/text-warning/g' "$filepath"
    sed -i 's/\btext-amber-600\b/text-warning/g' "$filepath"
    sed -i 's/\btext-yellow-600\b/text-warning/g' "$filepath"
    sed -i 's/\btext-pink-700\b/text-primary/g' "$filepath"
    sed -i 's/\btext-emerald-500\b/text-success/g' "$filepath"

    # Background colors - handle dark mode variants first
    sed -i 's/bg-white dark:bg-gray-950/bg-card/g' "$filepath"
    sed -i 's/bg-white dark:bg-gray-900/bg-card/g' "$filepath"
    sed -i 's/bg-gray-50 dark:bg-gray-900/bg-muted/g' "$filepath"
    sed -i 's/bg-gray-100 dark:bg-gray-800/bg-muted/g' "$filepath"
    sed -i 's/bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800/bg-primary\/10 border border-primary\/20/g' "$filepath"
    sed -i 's/bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800/bg-error\/10 border border-error\/20/g' "$filepath"
    sed -i 's/bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800/bg-success\/10 border border-success\/20/g' "$filepath"
    sed -i 's/bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800/bg-warning\/10 border border-warning\/20/g' "$filepath"

    # Simple background colors (no dark mode)
    sed -i 's/\bbg-white\b/bg-card/g' "$filepath"
    sed -i 's/\bbg-gray-50\b/bg-muted/g' "$filepath"
    sed -i 's/\bbg-gray-100\b/bg-muted/g' "$filepath"
    sed -i 's/\bbg-gray-200\b/bg-muted/g' "$filepath"
    sed -i 's/\bbg-gray-300\b/bg-muted/g' "$filepath"
    sed -i 's/\bbg-blue-50\b/bg-primary\/10/g' "$filepath"
    sed -i 's/\bbg-blue-600\b/bg-primary/g' "$filepath"
    sed -i 's/\bbg-blue-700\b/bg-primary/g' "$filepath"
    sed -i 's/\bbg-red-50\b/bg-error\/10/g' "$filepath"
    sed -i 's/\bbg-green-50\b/bg-success\/10/g' "$filepath"
    sed -i 's/\bbg-yellow-50\b/bg-warning\/10/g' "$filepath"
    sed -i 's/\bbg-purple-50\b/bg-primary\/10/g' "$filepath"

    # Hover states
    sed -i 's/hover:bg-blue-700/hover:bg-primary\/90/g' "$filepath"
    sed -i 's/hover:bg-blue-600/hover:bg-primary\/90/g' "$filepath"
    sed -i 's/hover:bg-gray-50/hover:bg-muted/g' "$filepath"
    sed -i 's/hover:bg-gray-100/hover:bg-muted/g' "$filepath"

    # Border colors - handle dark mode variants first
    sed -i 's/border-gray-200 dark:border-gray-800/border-border/g' "$filepath"
    sed -i 's/border-gray-300 dark:border-gray-700/border-border/g' "$filepath"
    sed -i 's/border-blue-200 dark:border-blue-800/border-primary\/20/g' "$filepath"
    sed -i 's/border-red-200 dark:border-red-800/border-error\/20/g' "$filepath"

    # Simple border colors (no dark mode)
    sed -i 's/\bborder-gray-200\b/border-border/g' "$filepath"
    sed -i 's/\bborder-gray-300\b/border-border/g' "$filepath"
    sed -i 's/\bborder-blue-200\b/border-primary\/20/g' "$filepath"
    sed -i 's/\bborder-red-200\b/border-error\/20/g' "$filepath"
    sed -i 's/\bborder-green-200\b/border-success\/20/g' "$filepath"
    sed -i 's/\bborder-purple-200\b/border-primary\/20/g' "$filepath"

    # Focus ring colors
    sed -i 's/focus:ring-blue-500/focus:ring-ring/g' "$filepath"
    sed -i 's/focus:ring-blue-600/focus:ring-ring/g' "$filepath"

    echo "✓ Completed $file"
  else
    echo "⚠ File not found: $filepath"
  fi
done

echo ""
echo "All files processed!"
