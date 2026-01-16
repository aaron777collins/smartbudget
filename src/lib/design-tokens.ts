/**
 * Design Tokens - Semantic color system for SmartBudget
 *
 * This file defines semantic color tokens that work with both light and dark modes.
 * All color references in components should use these tokens instead of hardcoded Tailwind classes.
 *
 * NOTE: These tokens use the semantic CSS variables defined in globals.css
 * (--success, --error, --warning, --info) which have proper WCAG AA contrast ratios.
 */

/**
 * Status Colors - For indicating success, warning, error, and neutral states
 * Uses semantic Tailwind classes that map to CSS variables in globals.css
 */
export const statusColors = {
  success: {
    text: 'text-success',
    bg: 'bg-success',
    bgLight: 'bg-success/10',
    border: 'border-success',
    // For use with Progress component's [&>div] selector
    progressBar: '[&>div]:bg-success',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning',
    bgLight: 'bg-warning/10',
    border: 'border-warning',
    progressBar: '[&>div]:bg-warning',
  },
  error: {
    text: 'text-error',
    bg: 'bg-error',
    bgLight: 'bg-error/10',
    border: 'border-error',
    progressBar: '[&>div]:bg-error',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info',
    bgLight: 'bg-info/10',
    border: 'border-info',
    progressBar: '[&>div]:bg-info',
  },
  neutral: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    bgLight: 'bg-muted/10',
    border: 'border-muted',
    progressBar: '[&>div]:bg-muted',
  },
} as const;

/**
 * Income Category Colors - For visualizing different income sources
 */
export const incomeCategoryColors = {
  primary: 'bg-success',
  secondary: 'bg-success/80',
  tertiary: 'bg-success/60',
  other: 'bg-muted',
} as const;

/**
 * Badge Colors - For status badges and tags
 */
export const badgeColors = {
  warning: 'bg-warning',
  alert: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
  error: 'bg-error',
} as const;

/**
 * Trend Indicators - For showing financial trends (up, down, neutral)
 */
export const trendColors = {
  positive: {
    text: 'text-success',
    icon: 'text-success',
  },
  negative: {
    text: 'text-error',
    icon: 'text-error',
  },
  neutral: {
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
} as const;

/**
 * Chart Colors - For D3 and other data visualizations
 * These are hex values that can be used in SVG and canvas elements
 *
 * Note: These should match the Tailwind color palette for consistency
 */
export const chartColors = {
  // Light mode colors
  light: {
    text: '#374151',      // gray-700 - readable text on light backgrounds
    textMuted: '#6B7280', // gray-500 - muted text (secondary labels)
    grid: '#E5E7EB',      // gray-200 - subtle grid lines
    background: '#FFFFFF', // white
    primary: '#3B82F6',   // blue-500
    secondary: '#10B981', // green-500
    tertiary: '#F59E0B',  // amber-500
    accent: '#8B5CF6',    // violet-500
    linkDefault: '#6B7280', // gray-500 - default link color
  },
  // Dark mode colors
  dark: {
    text: '#D1D5DB',      // gray-300 - readable text on dark backgrounds
    textMuted: '#9CA3AF', // gray-400 - muted text (secondary labels)
    grid: '#374151',      // gray-700 - subtle grid lines
    background: '#1F2937', // gray-800
    primary: '#60A5FA',   // blue-400
    secondary: '#34D399', // green-400
    tertiary: '#FBBF24',  // amber-400
    accent: '#A78BFA',    // violet-400
    linkDefault: '#9CA3AF', // gray-400 - default link color
  },
} as const;

/**
 * Budget Status Colors - For budget progress indicators
 */
export const budgetStatusColors = {
  underBudget: {
    text: statusColors.success.text,
    progressBar: statusColors.success.progressBar,
  },
  nearLimit: {
    text: statusColors.warning.text,
    progressBar: statusColors.warning.progressBar,
  },
  overBudget: {
    text: statusColors.error.text,
    progressBar: statusColors.error.progressBar,
  },
  noBudget: {
    text: statusColors.info.text,
    progressBar: statusColors.info.progressBar,
  },
} as const;

/**
 * Helper function to get budget status color based on percentage
 */
export function getBudgetStatusColor(percentage: number | null): {
  text: string;
  progressBar: string;
} {
  if (percentage === null) return budgetStatusColors.noBudget;
  if (percentage < 80) return budgetStatusColors.underBudget;
  if (percentage < 100) return budgetStatusColors.nearLimit;
  return budgetStatusColors.overBudget;
}

/**
 * Helper function to get trend color based on direction
 */
export function getTrendColor(trend: 'up' | 'down' | 'neutral'): {
  text: string;
  icon: string;
} {
  switch (trend) {
    case 'up':
      return trendColors.positive;
    case 'down':
      return trendColors.negative;
    default:
      return trendColors.neutral;
  }
}

/**
 * Helper function to get income category color by index
 */
export function getIncomeCategoryColor(index: number): string {
  const colors = [
    incomeCategoryColors.primary,
    incomeCategoryColors.secondary,
    incomeCategoryColors.tertiary,
  ];
  return colors[index % colors.length] || incomeCategoryColors.other;
}

/**
 * Helper function to get chart colors based on theme
 * @param theme - 'light' or 'dark', defaults to 'light'
 * @returns Chart colors for the specified theme
 */
export function getChartColors(theme: 'light' | 'dark' = 'light') {
  return chartColors[theme];
}

/**
 * Helper function to detect current theme from document
 * Works with next-themes which adds 'dark' class to html element
 * @returns 'light' or 'dark' based on current theme
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
