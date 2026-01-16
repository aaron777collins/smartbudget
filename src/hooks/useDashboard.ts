/**
 * Dashboard Data Fetching Hooks
 *
 * Custom React Query hooks for fetching dashboard overview and statistics.
 * Provides type-safe data fetching with automatic caching, background
 * refetching, and optimistic updates.
 *
 * @example
 * ```typescript
 * // Get dashboard overview
 * const { data } = useDashboardOverview('THIS_MONTH')
 *
 * // Get dashboard stats
 * const { data: stats } = useDashboardStats('LAST_30_DAYS')
 * ```
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';

// ============================================================================
// Types
// ============================================================================

/**
 * Dashboard timeframe options
 */
export type DashboardTimeframe =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_YEAR'
  | 'LAST_YEAR'
  | 'ALL_TIME';

/**
 * Dashboard overview data
 */
export interface DashboardOverview {
  timeframe: DashboardTimeframe;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    netWorth: number;
    savingsRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    netCashFlow: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string | null;
    categoryIcon: string | null;
    totalAmount: number;
    transactionCount: number;
    percentOfTotal: number;
  }>;
  topMerchants: Array<{
    merchantName: string;
    totalAmount: number;
    transactionCount: number;
    categories: string[];
  }>;
  accountBalances: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    currentBalance: number;
    changeAmount: number;
    changePercent: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
    categoryName?: string;
    accountName: string;
  }>;
}

/**
 * Dashboard statistics data
 */
export interface DashboardStats {
  timeframe: DashboardTimeframe;
  income: {
    total: number;
    average: number;
    median: number;
    trend: 'up' | 'down' | 'neutral';
    trendPercent: number;
  };
  expenses: {
    total: number;
    average: number;
    median: number;
    trend: 'up' | 'down' | 'neutral';
    trendPercent: number;
  };
  cashFlow: {
    net: number;
    average: number;
    trend: 'up' | 'down' | 'neutral';
    trendPercent: number;
  };
  budgets: {
    totalBudgeted: number;
    totalSpent: number;
    percentUsed: number;
    categoriesOverBudget: number;
    categoriesUnderBudget: number;
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    totalTarget: number;
    totalSaved: number;
    percentComplete: number;
  };
  insights: {
    highSpendingCategories: string[];
    unusualTransactions: number;
    recurringTransactions: number;
    uncategorizedTransactions: number;
  };
}

/**
 * Spending by category data
 */
export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  totalAmount: number;
  transactionCount: number;
  percentOfTotal: number;
  subcategories?: Array<{
    subcategoryId: string;
    subcategoryName: string;
    totalAmount: number;
    transactionCount: number;
    percentOfCategory: number;
  }>;
}

/**
 * Cash flow over time data
 */
export interface CashFlowData {
  period: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  runningBalance: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch dashboard overview data
 *
 * @param timeframe - Time period for dashboard data
 * @returns React Query result with dashboard overview
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useDashboardOverview('THIS_MONTH')
 * ```
 */
export function useDashboardOverview(
  timeframe: DashboardTimeframe = 'THIS_MONTH'
): UseQueryResult<DashboardOverview, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(timeframe),
    queryFn: async () => {
      return apiClient.get<DashboardOverview>('/api/dashboard/overview', {
        params: { timeframe },
      });
    },
    // Dashboard data changes frequently, use shorter stale time
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch dashboard statistics
 *
 * @param timeframe - Time period for statistics
 * @returns React Query result with dashboard stats
 *
 * @example
 * ```typescript
 * const { data: stats } = useDashboardStats('LAST_30_DAYS')
 * ```
 */
export function useDashboardStats(
  timeframe: DashboardTimeframe = 'THIS_MONTH'
): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(timeframe),
    queryFn: async () => {
      return apiClient.get<DashboardStats>('/api/dashboard/stats', {
        params: { timeframe },
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch spending breakdown by category
 *
 * @param timeframe - Time period for spending data
 * @param options - Query options
 * @returns React Query result with spending by category
 *
 * @example
 * ```typescript
 * const { data: spending } = useSpendingByCategory('THIS_MONTH')
 * ```
 */
export function useSpendingByCategory(
  timeframe: DashboardTimeframe = 'THIS_MONTH',
  options: { enabled?: boolean } = {}
): UseQueryResult<SpendingByCategory[], Error> {
  return useQuery({
    queryKey: ['dashboard', 'spending-by-category', timeframe] as const,
    queryFn: async () => {
      return apiClient.get<SpendingByCategory[]>('/api/dashboard/spending-by-category', {
        params: { timeframe },
      });
    },
    enabled: options.enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch cash flow over time
 *
 * @param timeframe - Time period for cash flow data
 * @param options - Query options
 * @returns React Query result with cash flow data
 *
 * @example
 * ```typescript
 * const { data: cashFlow } = useCashFlowOverTime('LAST_90_DAYS')
 * ```
 */
export function useCashFlowOverTime(
  timeframe: DashboardTimeframe = 'THIS_MONTH',
  options: { enabled?: boolean } = {}
): UseQueryResult<CashFlowData[], Error> {
  return useQuery({
    queryKey: ['dashboard', 'cash-flow', timeframe] as const,
    queryFn: async () => {
      return apiClient.get<CashFlowData[]>('/api/dashboard/cash-flow', {
        params: { timeframe },
      });
    },
    enabled: options.enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch net worth over time
 *
 * @param timeframe - Time period for net worth data
 * @param options - Query options
 * @returns React Query result with net worth data
 *
 * @example
 * ```typescript
 * const { data: netWorth } = useNetWorthOverTime('THIS_YEAR')
 * ```
 */
export function useNetWorthOverTime(
  timeframe: DashboardTimeframe = 'THIS_YEAR',
  options: { enabled?: boolean } = {}
): UseQueryResult<Array<{ date: string; netWorth: number; assets: number; liabilities: number }>, Error> {
  return useQuery({
    queryKey: ['dashboard', 'net-worth', timeframe] as const,
    queryFn: async () => {
      return apiClient.get<Array<{ date: string; netWorth: number; assets: number; liabilities: number }>>(
        '/api/dashboard/net-worth',
        { params: { timeframe } }
      );
    },
    enabled: options.enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (net worth changes less frequently)
  });
}

/**
 * Fetch budget performance overview
 *
 * @param timeframe - Time period for budget data
 * @param options - Query options
 * @returns React Query result with budget performance
 *
 * @example
 * ```typescript
 * const { data: budgetPerf } = useBudgetPerformance('THIS_MONTH')
 * ```
 */
/**
 * Budget performance response type
 */
export interface BudgetPerformanceData {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    status: 'safe' | 'warning' | 'danger';
  }>;
  overall: {
    totalBudgeted: number;
    totalSpent: number;
    percentUsed: number;
  };
}

export function useBudgetPerformance(
  timeframe: DashboardTimeframe = 'THIS_MONTH',
  options: { enabled?: boolean } = {}
): UseQueryResult<BudgetPerformanceData, Error> {
  return useQuery({
    queryKey: ['dashboard', 'budget-performance', timeframe] as const,
    queryFn: async () => {
      return apiClient.get<BudgetPerformanceData>('/api/dashboard/budget-performance', {
        params: { timeframe },
      });
    },
    enabled: options.enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
