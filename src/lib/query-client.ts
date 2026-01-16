/**
 * React Query Configuration
 *
 * Centralizes data fetching, caching, and state management configuration
 * for the SmartBudget application using TanStack Query (React Query).
 *
 * @see https://tanstack.com/query/latest/docs/react/overview
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for all queries and mutations in the application
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Time before data is considered stale (5 minutes)
    // Stale data can still be shown, but will trigger a background refetch
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Time before inactive cache data is garbage collected (10 minutes)
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)

    // Don't refetch on window focus by default
    // This prevents unnecessary refetches when user switches tabs
    refetchOnWindowFocus: false,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Retry failed requests once before giving up
    retry: 1,

    // Retry delay increases exponentially (1s, 2s, 4s, ...)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Throw errors instead of returning them in the query result
    // This allows error boundaries to catch them
    throwOnError: false,
  },

  mutations: {
    // Don't retry mutations by default (idempotency not guaranteed)
    retry: 0,

    // Throw errors from mutations to error boundaries
    throwOnError: false,
  },
};

/**
 * Global QueryClient instance for the application
 *
 * This client manages:
 * - Query caching and invalidation
 * - Background refetching
 * - Request deduplication
 * - Optimistic updates
 * - Retry logic
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Creates a new QueryClient instance
 * Useful for testing or SSR scenarios where you need isolated clients
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

/**
 * Query key factory for consistent cache key generation
 *
 * This pattern ensures query keys are consistent across the app
 * and makes it easier to invalidate related queries.
 *
 * @example
 * const { data } = useQuery({
 *   queryKey: queryKeys.transactions.list({ accountId: '123' }),
 *   queryFn: () => fetchTransactions({ accountId: '123' })
 * })
 */
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    overview: (timeframe: string) => ['dashboard', 'overview', timeframe] as const,
    stats: (timeframe: string) => ['dashboard', 'stats', timeframe] as const,
  },

  // Transaction queries
  transactions: {
    all: ['transactions'] as const,
    lists: () => ['transactions', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
  },

  // Budget queries
  budgets: {
    all: ['budgets'] as const,
    lists: () => ['budgets', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['budgets', 'list', filters] as const,
    detail: (id: string) => ['budgets', 'detail', id] as const,
    analytics: (id: string) => ['budgets', 'analytics', id] as const,
  },

  // Account queries
  accounts: {
    all: ['accounts'] as const,
    lists: () => ['accounts', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['accounts', 'list', filters] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
    balance: (id: string, date?: string) => ['accounts', 'balance', id, date] as const,
  },

  // Category queries
  categories: {
    all: ['categories'] as const,
    lists: () => ['categories', 'list'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },

  // Tag queries
  tags: {
    all: ['tags'] as const,
    lists: () => ['tags', 'list'] as const,
    detail: (id: string) => ['tags', 'detail', id] as const,
  },

  // Goal queries
  goals: {
    all: ['goals'] as const,
    lists: () => ['goals', 'list'] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
    progress: (id: string) => ['goals', 'progress', id] as const,
  },

  // Insight queries
  insights: {
    all: ['insights'] as const,
    lists: () => ['insights', 'list'] as const,
    detail: (id: string) => ['insights', 'detail', id] as const,
  },

  // Recurring rule queries
  recurringRules: {
    all: ['recurring-rules'] as const,
    lists: () => ['recurring-rules', 'list'] as const,
    detail: (id: string) => ['recurring-rules', 'detail', id] as const,
  },

  // Merchant queries
  merchants: {
    all: ['merchants'] as const,
    normalized: (merchantName: string) => ['merchants', 'normalized', merchantName] as const,
    research: (merchantName: string) => ['merchants', 'research', merchantName] as const,
  },

  // Job queries
  jobs: {
    all: ['jobs'] as const,
    lists: () => ['jobs', 'list'] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
  },

  // User settings queries
  user: {
    all: ['user'] as const,
    settings: () => ['user', 'settings'] as const,
  },
} as const;
