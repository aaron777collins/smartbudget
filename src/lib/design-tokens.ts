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
 * Extended Chart Color Palette - 8-category support for complex visualizations
 * These colors provide a broader palette for charts with many categories
 * All colors are WCAG AA compliant in their respective themes
 */
export const extendedChartColors = {
  light: [
    'hsl(221.2, 83.2%, 53.3%)',  // primary (blue)
    'hsl(160, 84%, 39%)',         // accent-emerald
    'hsl(38, 92%, 50%)',          // accent-amber
    'hsl(346, 87%, 63%)',         // accent-rose
    'hsl(280, 84%, 47%)',         // accent-purple
    'hsl(188, 94%, 43%)',         // accent-cyan
    'hsl(258, 90%, 66%)',         // accent-violet
    'hsl(173, 80%, 40%)',         // accent-teal
  ],
  dark: [
    'hsl(217.2, 91.2%, 59.8%)',   // primary (lighter blue)
    'hsl(160, 84%, 45%)',         // accent-emerald (lighter)
    'hsl(38, 92%, 55%)',          // accent-amber (lighter)
    'hsl(346, 87%, 68%)',         // accent-rose (lighter)
    'hsl(280, 84%, 55%)',         // accent-purple (lighter)
    'hsl(188, 94%, 50%)',         // accent-cyan (lighter)
    'hsl(258, 90%, 70%)',         // accent-violet (lighter)
    'hsl(173, 80%, 45%)',         // accent-teal (lighter)
  ],
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

/**
 * Helper function to get extended chart colors for multi-category visualizations
 * @param theme - 'light' or 'dark', defaults to 'light'
 * @returns Array of 8 HSL color strings optimized for the theme
 */
export function getExtendedChartColors(theme: 'light' | 'dark' = 'light'): readonly string[] {
  return extendedChartColors[theme];
}

/**
 * Helper function to get a specific chart color by index (with wrapping)
 * Useful for assigning colors to dynamic categories
 * @param index - Category index (0-based)
 * @param theme - 'light' or 'dark', defaults to current theme
 * @returns HSL color string for the category
 */
export function getChartColorByIndex(index: number, theme?: 'light' | 'dark'): string {
  const activeTheme = theme || getCurrentTheme();
  const colors = extendedChartColors[activeTheme];
  return colors[index % colors.length];
}

/**
 * Calculate relative luminance of an RGB color
 * Used for WCAG contrast ratio calculations
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance value (0-1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB components
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) formats
 * @param hex - Hex color string (with or without #)
 * @returns RGB object or null if invalid
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  // 3-digit hex (e.g., #FFF)
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  // 6-digit hex (e.g., #FFFFFF)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

/**
 * Determine whether white or black text provides better contrast on a given background color
 * Uses WCAG contrast ratio calculation (minimum 4.5:1 for AA compliance)
 *
 * @param backgroundColor - Hex color string (e.g., '#FF5733', '#3B82F6')
 * @returns 'white' or 'black' - the text color with better contrast
 *
 * @example
 * getContrastTextColor('#3B82F6') // returns 'white' (light blue background)
 * getContrastTextColor('#FFD700') // returns 'black' (gold background)
 */
export function getContrastTextColor(backgroundColor: string): 'white' | 'black' {
  const rgb = parseHexColor(backgroundColor);

  // Fallback to white if parsing fails
  if (!rgb) return 'white';

  const bgLuminance = getLuminance(rgb.r, rgb.g, rgb.b);

  // Luminance values for pure white (1) and pure black (0)
  const whiteLuminance = 1;
  const blackLuminance = 0;

  // Calculate contrast ratios
  const whiteContrast = (whiteLuminance + 0.05) / (bgLuminance + 0.05);
  const blackContrast = (bgLuminance + 0.05) / (blackLuminance + 0.05);

  // Return the color with higher contrast
  return whiteContrast > blackContrast ? 'white' : 'black';
}

/**
 * Convert hex color to rgba format with specified opacity
 * More reliable than appending opacity to hex string
 *
 * @param hexColor - Hex color string (e.g., '#FF5733', '#3B82F6')
 * @param opacity - Opacity value between 0 and 1 (default: 0.12)
 * @returns RGBA color string
 *
 * @example
 * hexToRgba('#3B82F6', 0.12) // returns 'rgba(59, 130, 246, 0.12)'
 */
export function hexToRgba(hexColor: string, opacity: number = 0.12): string {
  const rgb = parseHexColor(hexColor);

  // Fallback to transparent if parsing fails
  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Get category badge colors with proper contrast for both light and dark modes
 * Uses a subtle background with full color text for better readability
 *
 * @param categoryColor - Hex color string for the category
 * @returns Object with backgroundColor and color properties for inline styles
 *
 * @example
 * const styles = getCategoryBadgeColors('#3B82F6');
 * <Badge style={styles}>Category Name</Badge>
 */
export function getCategoryBadgeColors(categoryColor: string): {
  backgroundColor: string;
  color: string;
} {
  return {
    backgroundColor: hexToRgba(categoryColor, 0.12),
    color: categoryColor,
  };
}
