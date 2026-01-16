/**
 * Design Tokens
 *
 * Centralized design system constants for consistent UI across the application.
 * These tokens map to Tailwind CSS classes and can be used throughout components.
 *
 * Usage:
 * import { DESIGN_TOKENS } from '@/lib/design-tokens'
 * <div className={DESIGN_TOKENS.spacing.card}>...</div>
 */

/**
 * Spacing tokens for consistent padding and margins
 */
export const SPACING = {
  // Card spacing
  card: {
    mobile: 'p-4',      // 1rem - 16px
    default: 'p-6',     // 1.5rem - 24px
    large: 'p-8',       // 2rem - 32px
  },

  // Page containers (standardized responsive padding)
  // Note: AppLayout already provides p-8 on main tag
  // Pages should use container with consistent padding
  page: {
    // Standard container pattern - use this for most pages
    container: 'container mx-auto p-6',

    // Responsive container (adjusts padding for mobile/desktop)
    containerResponsive: 'container mx-auto p-4 md:p-8',

    // Legacy patterns (deprecated, migrate to container)
    mobile: 'px-4 py-6',
    tablet: 'px-6 py-8',
    desktop: 'px-8 py-10',
  },

  // Alert/notification padding
  alert: {
    default: 'p-4',              // Standard alert padding
    compact: 'p-3',              // Compact alerts
  },

  // Empty state padding
  empty: 'py-12',                // Vertical padding for empty states

  // Section spacing (vertical spacing between sections)
  section: {
    tight: 'space-y-2',      // 0.5rem - 8px
    default: 'space-y-4',    // 1rem - 16px
    relaxed: 'space-y-6',    // 1.5rem - 24px
    loose: 'space-y-8',      // 2rem - 32px
  },

  // Stack spacing (vertical spacing in lists)
  stack: {
    tight: 'space-y-1',      // 0.25rem - 4px
    default: 'space-y-2',    // 0.5rem - 8px
    relaxed: 'space-y-3',    // 0.75rem - 12px
  },

  // Inline spacing (horizontal spacing)
  inline: {
    tight: 'space-x-1',      // 0.25rem - 4px
    default: 'space-x-2',    // 0.5rem - 8px
    relaxed: 'space-x-4',    // 1rem - 16px
    loose: 'space-x-6',      // 1.5rem - 24px
  },

  // Gap for grid/flex layouts
  gap: {
    tight: 'gap-2',          // 0.5rem - 8px
    default: 'gap-4',        // 1rem - 16px
    relaxed: 'gap-6',        // 1.5rem - 24px
    loose: 'gap-8',          // 2rem - 32px
  },
} as const;

/**
 * Animation tokens for consistent transitions and effects
 */
export const ANIMATION = {
  // Duration classes
  duration: {
    fast: 'duration-150',       // 150ms - Quick feedback
    normal: 'duration-200',     // 200ms - Standard transitions
    slow: 'duration-300',       // 300ms - Deliberate animations
    slower: 'duration-500',     // 500ms - Emphasized transitions
  },

  // Easing functions
  easing: {
    default: 'ease-in-out',     // Standard easing
    in: 'ease-in',              // Accelerating
    out: 'ease-out',            // Decelerating
    linear: 'ease-linear',      // Constant speed
  },

  // Complete transition classes (combines duration + property + easing)
  transition: {
    all: 'transition-all duration-200 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    shadow: 'transition-shadow duration-200 ease-in-out',
  },

  // Hover/focus states
  hover: {
    lift: 'hover:scale-105 transition-transform duration-200',
    shadow: 'hover:shadow-lg transition-shadow duration-200',
    opacity: 'hover:opacity-80 transition-opacity duration-200',
    brightness: 'hover:brightness-110 transition-all duration-200',
  },

  // Animation presets
  presets: {
    fadeIn: 'animate-fade-in',
    fadeOut: 'animate-fade-out',
    slideInFromTop: 'animate-slide-in-from-top',
    slideInFromBottom: 'animate-slide-in-from-bottom',
    slideInFromLeft: 'animate-slide-in-from-left',
    slideInFromRight: 'animate-slide-in-from-right',
    scaleIn: 'animate-scale-in',
    scaleOut: 'animate-scale-out',
    shimmer: 'animate-shimmer',
    spin: 'animate-spin',
  },
} as const;

/**
 * Elevation tokens for consistent shadows and depth
 */
export const ELEVATION = {
  none: 'shadow-none',           // No shadow
  low: 'shadow-sm',              // Subtle elevation for cards
  medium: 'shadow-md',           // Standard elevation for interactive elements
  high: 'shadow-lg',             // Prominent elevation for modals/popovers
  highest: 'shadow-xl',          // Maximum elevation for important overlays
  '2xl': 'shadow-2xl',           // Extra emphasis
  inner: 'shadow-inner',         // Inset shadow for inputs
} as const;

/**
 * Border radius tokens for consistent rounded corners
 */
export const RADIUS = {
  none: 'rounded-none',          // 0px - No rounding
  sm: 'rounded-sm',              // 2px - Subtle rounding
  default: 'rounded-md',         // 6px - Standard rounding
  md: 'rounded-md',              // 6px - Alias for default
  lg: 'rounded-lg',              // 8px - Large rounding
  xl: 'rounded-xl',              // 12px - Extra large rounding
  '2xl': 'rounded-2xl',          // 16px - Very large rounding
  '3xl': 'rounded-3xl',          // 24px - Maximum rounding
  full: 'rounded-full',          // 9999px - Perfect circle/pill
} as const;

/**
 * Typography tokens for text hierarchy
 */
export const TYPOGRAPHY = {
  // Display text (hero sections, large headings)
  display: {
    large: 'text-5xl font-bold tracking-tight',      // 48px
    default: 'text-4xl font-bold tracking-tight',    // 36px
    small: 'text-3xl font-bold tracking-tight',      // 30px
  },

  // Headings
  h1: 'text-3xl font-bold tracking-tight',           // 30px
  h2: 'text-2xl font-semibold tracking-tight',       // 24px
  h3: 'text-xl font-semibold',                       // 20px
  h4: 'text-lg font-semibold',                       // 18px
  h5: 'text-base font-semibold',                     // 16px
  h6: 'text-sm font-semibold',                       // 14px

  // Body text
  body: {
    large: 'text-lg leading-relaxed',                // 18px
    default: 'text-base leading-normal',             // 16px
    small: 'text-sm leading-normal',                 // 14px
  },

  // Utility text
  caption: 'text-xs text-muted-foreground',          // 12px
  label: 'text-sm font-medium',                      // 14px
  overline: 'text-xs font-semibold uppercase tracking-wider', // 12px
  code: 'font-mono text-sm',                         // Monospace 14px

  // Text weights
  weight: {
    light: 'font-light',         // 300
    normal: 'font-normal',       // 400
    medium: 'font-medium',       // 500
    semibold: 'font-semibold',   // 600
    bold: 'font-bold',           // 700
  },

  // Line heights
  leading: {
    tight: 'leading-tight',      // 1.25
    normal: 'leading-normal',    // 1.5
    relaxed: 'leading-relaxed',  // 1.625
    loose: 'leading-loose',      // 2
  },

  // Text truncation
  truncate: {
    single: 'truncate',                                    // Single line with ellipsis
    multiline: 'line-clamp-2',                             // 2 lines with ellipsis
    triple: 'line-clamp-3',                                // 3 lines with ellipsis
  },
} as const;

/**
 * Semantic color tokens
 * Maps semantic meaning to Tailwind color classes
 * These work with both light and dark mode
 */
export const COLORS = {
  // Status colors
  status: {
    success: {
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-500/30 dark:border-green-500/40',
      solid: 'bg-green-500',
      icon: 'text-green-600 dark:text-green-400',
    },
    warning: {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-500/30 dark:border-yellow-500/40',
      solid: 'bg-yellow-500',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    error: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-500/30 dark:border-red-500/40',
      solid: 'bg-red-500',
      icon: 'text-red-600 dark:text-red-400',
    },
    info: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30 dark:border-blue-500/40',
      solid: 'bg-blue-500',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  },

  // Semantic background colors
  surface: {
    base: 'bg-background',                           // Main background
    card: 'bg-card',                                 // Card background
    elevated: 'bg-card shadow-md',                   // Elevated card
    muted: 'bg-muted',                               // Muted background
    accent: 'bg-accent',                             // Accent background
  },

  // Text colors
  text: {
    primary: 'text-foreground',                      // Primary text
    secondary: 'text-muted-foreground',              // Secondary text
    accent: 'text-primary',                          // Accent text
    muted: 'text-muted-foreground',                  // Muted text
    inverse: 'text-primary-foreground',              // Inverse text (on primary bg)
  },

  // Border colors
  border: {
    default: 'border-border',                        // Default border
    muted: 'border-muted',                           // Subtle border
    accent: 'border-primary',                        // Accent border
    input: 'border-input',                           // Input border
  },

  // Interactive states
  interactive: {
    default: 'bg-primary text-primary-foreground',
    hover: 'hover:bg-primary/90',
    active: 'active:bg-primary/80',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },

  // Navigation icon colors (semantic categories)
  nav: {
    dashboard: 'text-sky-500 dark:text-sky-400',
    transactions: 'text-violet-500 dark:text-violet-400',
    budgets: 'text-orange-700 dark:text-orange-400',
    accounts: 'text-pink-700 dark:text-pink-400',
    recurring: 'text-purple-600 dark:text-purple-400',
    tags: 'text-cyan-600 dark:text-cyan-400',
    goals: 'text-emerald-500 dark:text-emerald-400',
    insights: 'text-green-700 dark:text-green-400',
    import: 'text-blue-500 dark:text-blue-400',
    jobs: 'text-indigo-500 dark:text-indigo-400',
    settings: 'text-gray-700 dark:text-gray-400',
  },

  // Chart and data visualization colors
  chart: {
    // Primary chart colors (ordered by visual harmony)
    primary: [
      'hsl(217.2 91.2% 59.8%)',  // Blue
      'hsl(142.1 76.2% 36.3%)',  // Green
      'hsl(38.8 92.7% 50.2%)',   // Orange
      'hsl(346.8 77.2% 49.8%)',  // Red
      'hsl(262.1 83.3% 57.8%)',  // Purple
      'hsl(189.9 94.5% 42.7%)',  // Cyan
      'hsl(330.3 81.2% 60.4%)',  // Pink
      'hsl(236.6 85% 62.7%)',    // Indigo
    ],

    // Category-based colors (for consistent category representation)
    categories: {
      income: 'hsl(142.1 76.2% 36.3%)',       // Green
      expense: 'hsl(346.8 77.2% 49.8%)',      // Red
      transfer: 'hsl(217.2 91.2% 59.8%)',     // Blue
      investment: 'hsl(262.1 83.3% 57.8%)',   // Purple
    },

    // Gradient color stops for heatmaps and intensity visualizations
    gradient: {
      blue: {
        start: 'hsl(214 100% 97%)',    // Very light blue
        middle: 'hsl(217.2 91.2% 59.8%)',  // Primary blue
        end: 'hsl(221.2 83.2% 30%)',   // Dark blue
      },
      green: {
        start: 'hsl(142 76% 96%)',     // Very light green
        middle: 'hsl(142.1 76.2% 36.3%)',  // Primary green
        end: 'hsl(142.1 70% 20%)',     // Dark green
      },
      red: {
        start: 'hsl(0 86% 97%)',       // Very light red
        middle: 'hsl(346.8 77.2% 49.8%)',  // Primary red
        end: 'hsl(346.8 70% 25%)',     // Dark red
      },
    },

    // Text colors for charts (theme-aware)
    text: {
      primary: 'hsl(222.2 47.4% 11.2%)',     // Dark text (light mode)
      secondary: 'hsl(215.4 16.3% 46.9%)',   // Gray text
      light: 'hsl(210 40% 98%)',             // Light text (dark mode)
    },
  },

  // Dashboard card gradients (theme-aware subtle gradients)
  gradient: {
    blue: 'bg-gradient-to-br from-card via-card to-blue-500/5 dark:to-blue-500/10',
    green: 'bg-gradient-to-br from-card via-card to-green-500/5 dark:to-green-500/10',
    purple: 'bg-gradient-to-br from-card via-card to-purple-500/5 dark:to-purple-500/10',
    orange: 'bg-gradient-to-br from-card via-card to-orange-500/5 dark:to-orange-500/10',
    pink: 'bg-gradient-to-br from-card via-card to-pink-500/5 dark:to-pink-500/10',
    cyan: 'bg-gradient-to-br from-card via-card to-cyan-500/5 dark:to-cyan-500/10',
  },

  // Account type colors (for account selection and display)
  account: {
    colors: [
      { hex: '#2563EB', name: 'Blue' },        // Blue
      { hex: '#10B981', name: 'Green' },       // Emerald/Green
      { hex: '#F59E0B', name: 'Amber' },       // Amber/Orange
      { hex: '#EF4444', name: 'Red' },         // Red
      { hex: '#8B5CF6', name: 'Purple' },      // Violet/Purple
      { hex: '#EC4899', name: 'Pink' },        // Pink
      { hex: '#14B8A6', name: 'Teal' },        // Teal
      { hex: '#6366F1', name: 'Indigo' },      // Indigo
    ],
  },

  // Trend indicators
  trend: {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  },

  // Budget usage thresholds
  budget: {
    safe: {
      text: 'text-green-600 dark:text-green-400',
      progress: 'bg-green-500',
    },
    warning: {
      text: 'text-yellow-600 dark:text-yellow-400',
      progress: 'bg-yellow-500',
    },
    danger: {
      text: 'text-red-600 dark:text-red-400',
      progress: 'bg-red-500',
    },
  },

  // Goal status colors
  goal: {
    notStarted: 'text-gray-600 dark:text-gray-400',
    inProgress: 'text-blue-600 dark:text-blue-400',
    completed: 'text-green-600 dark:text-green-400',
    paused: 'text-purple-600 dark:text-purple-400',
  },

  // Insight risk levels
  insight: {
    low: 'text-blue-600 dark:text-blue-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-red-600 dark:text-red-400',
  },
} as const;

/**
 * Layout tokens for consistent component sizing
 */
export const LAYOUT = {
  // Container widths
  container: {
    sm: 'max-w-screen-sm',       // 640px
    md: 'max-w-screen-md',       // 768px
    lg: 'max-w-screen-lg',       // 1024px
    xl: 'max-w-screen-xl',       // 1280px
    '2xl': 'max-w-screen-2xl',   // 1536px
    full: 'max-w-full',          // 100%
    app: 'max-w-[1400px]',       // App-specific max width
  },

  // Common widths
  width: {
    full: 'w-full',
    screen: 'w-screen',
    auto: 'w-auto',
    fit: 'w-fit',
  },

  // Common heights
  height: {
    full: 'h-full',
    screen: 'h-screen',
    auto: 'h-auto',
    fit: 'h-fit',
  },

  // Grid layouts
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))]',
  },

  // Flex layouts
  flex: {
    row: 'flex flex-row',
    col: 'flex flex-col',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
  },
} as const;

/**
 * Interaction tokens for buttons, links, and interactive elements
 */
export const INTERACTION = {
  // Touch targets (accessibility)
  touch: {
    minimum: 'min-h-[44px] min-w-[44px]',           // WCAG 2.1 AA minimum
    comfortable: 'min-h-[48px] min-w-[48px]',       // Comfortable size
  },

  // Focus states
  focus: {
    default: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    within: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
  },

  // Disabled states
  disabled: 'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',

  // Hover states (respects prefers-reduced-motion)
  hover: {
    scale: 'hover:scale-105',
    opacity: 'hover:opacity-80',
    brightness: 'hover:brightness-110',
  },
} as const;

/**
 * Responsive breakpoint helpers
 */
export const BREAKPOINTS = {
  mobile: {
    only: 'md:hidden',           // Show only on mobile
    up: '',                      // Mobile and up (default)
  },
  tablet: {
    only: 'hidden md:block lg:hidden',  // Show only on tablet
    up: 'md:',                   // Tablet and up prefix
    down: 'md:hidden',           // Mobile only
  },
  desktop: {
    only: 'hidden lg:block',     // Show only on desktop
    up: 'lg:',                   // Desktop and up prefix
    down: 'lg:hidden',           // Mobile and tablet
  },
} as const;

/**
 * Complete design tokens object
 * Combine all tokens into a single exportable object
 */
export const DESIGN_TOKENS = {
  spacing: SPACING,
  animation: ANIMATION,
  elevation: ELEVATION,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  colors: COLORS,
  layout: LAYOUT,
  interaction: INTERACTION,
  breakpoints: BREAKPOINTS,
} as const;

/**
 * Type exports for TypeScript autocomplete
 */
export type DesignTokens = typeof DESIGN_TOKENS;
export type SpacingTokens = typeof SPACING;
export type AnimationTokens = typeof ANIMATION;
export type ElevationTokens = typeof ELEVATION;
export type RadiusTokens = typeof RADIUS;
export type TypographyTokens = typeof TYPOGRAPHY;
export type ColorTokens = typeof COLORS;
export type LayoutTokens = typeof LAYOUT;
export type InteractionTokens = typeof INTERACTION;
export type BreakpointTokens = typeof BREAKPOINTS;

/**
 * Default export
 */
export default DESIGN_TOKENS;
