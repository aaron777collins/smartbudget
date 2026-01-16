/**
 * Central export file for all custom hooks
 *
 * This barrel export makes it easier to import hooks throughout the application.
 *
 * @example
 * ```tsx
 * // Before:
 * import { useCurrency } from '@/hooks/useCurrency';
 * import { useFormatDate } from '@/hooks/useFormatDate';
 * import { useDebounce } from '@/hooks/useDebounce';
 *
 * // After:
 * import { useCurrency, useFormatDate, useDebounce } from '@/hooks';
 * ```
 */

// Currency formatting hooks
export { useCurrency } from './useCurrency';
export type { CurrencyFormatOptions } from './useCurrency';

// Date formatting hooks
export { useFormatDate } from './useFormatDate';
export type { DateFormatOptions } from './useFormatDate';

// Debounce hooks
export { useDebounce, useDebounceCallback } from './useDebounce';
export type { DebounceCallbackOptions } from './useDebounce';

// Media query and responsive hooks
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallScreen,
  useIsLargeScreen,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  useBreakpoint,
  useViewport,
  BREAKPOINTS,
} from './useMediaQuery';

// Counter animation hook
export { useCounterAnimation } from './use-counter-animation';

// Data fetching hooks (React Query wrappers)
export {
  useAccounts,
  useAccount,
  useAccountBalance,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useSyncAccountBalance,
} from './useAccounts';

export {
  useBudgets,
  useBudget,
  useBudgetAnalytics,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useUpdateBudgetCategory,
} from './useBudgets';

export {
  useTransactions,
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategorizeTransaction,
  useImportTransactions,
} from './useTransactions';

export {
  useDashboardOverview,
  useDashboardStats,
  useSpendingByCategory,
  useCashFlowOverTime,
  useNetWorthOverTime,
  useBudgetPerformance,
} from './useDashboard';

// Re-export types from data fetching hooks
export type { TransactionFilters } from './useTransactions';
