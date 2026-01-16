/**
 * Budget Data Fetching Hooks
 *
 * Custom React Query hooks for fetching and mutating budget data.
 * Provides type-safe data fetching with automatic caching, background
 * refetching, and optimistic updates.
 *
 * @example
 * ```typescript
 * // List budgets
 * const { data: budgets } = useBudgets({ active: true })
 *
 * // Get single budget
 * const { data: budget } = useBudget('budget-id')
 *
 * // Create budget
 * const createMutation = useCreateBudget()
 * createMutation.mutate({ name: '2024 Budget', type: 'MONTHLY' })
 * ```
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { Budget, BudgetType, BudgetPeriod } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Budget with related data
 */
export interface BudgetWithRelations extends Budget {
  categories?: Array<{
    id: string;
    budgetId: string;
    categoryId: string;
    amount: number;
    category: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      icon: string | null;
    };
  }>;
  _count?: {
    categories: number;
  };
}

/**
 * Budget list query filters
 */
export interface BudgetFilters extends Record<string, unknown> {
  active?: boolean;
  type?: BudgetType;
  period?: BudgetPeriod;
  sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Budget category input
 */
export interface BudgetCategoryInput {
  categoryId: string;
  amount: number;
}

/**
 * Budget create/update input
 */
export interface BudgetInput {
  name: string;
  type: BudgetType;
  period: BudgetPeriod;
  startDate: Date | string;
  endDate?: Date | string;
  totalAmount?: number;
  rolloverUnspent?: boolean;
  isActive?: boolean;
  categories?: BudgetCategoryInput[];
}

/**
 * Budget analytics data
 */
export interface BudgetAnalytics {
  budgetId: string;
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  percentSpent: number;
  percentIncome: number;
  remainingBudget: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    percentSpent: number;
    remaining: number;
    status: 'safe' | 'warning' | 'danger';
  }>;
  trends?: {
    dailyAverage: number;
    projectedTotal: number;
    onTrack: boolean;
  };
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch list of budgets with filters
 *
 * @param filters - Query filters (active status, type, period)
 * @returns React Query result with budgets array
 *
 * @example
 * ```typescript
 * const { data: budgets, isLoading } = useBudgets({
 *   active: true,
 *   type: 'MONTHLY',
 * })
 * ```
 */
export function useBudgets(
  filters: BudgetFilters = {}
): UseQueryResult<BudgetWithRelations[], Error> {
  return useQuery({
    queryKey: queryKeys.budgets.list(filters),
    queryFn: async () => {
      return apiClient.get<BudgetWithRelations[]>('/api/budgets', {
        params: filters as Record<string, string | number | boolean>,
      });
    },
  });
}

/**
 * Fetch single budget by ID
 *
 * @param id - Budget ID
 * @param options - Query options
 * @returns React Query result with single budget
 *
 * @example
 * ```typescript
 * const { data: budget } = useBudget('budget-123')
 * ```
 */
export function useBudget(
  id: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<BudgetWithRelations, Error> {
  return useQuery({
    queryKey: queryKeys.budgets.detail(id),
    queryFn: async () => {
      return apiClient.get<BudgetWithRelations>(`/api/budgets/${id}`);
    },
    enabled: options.enabled !== false && !!id,
  });
}

/**
 * Fetch budget analytics and spending data
 *
 * @param id - Budget ID
 * @param options - Query options
 * @returns React Query result with budget analytics
 *
 * @example
 * ```typescript
 * const { data: analytics } = useBudgetAnalytics('budget-123')
 * ```
 */
export function useBudgetAnalytics(
  id: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<BudgetAnalytics, Error> {
  return useQuery({
    queryKey: queryKeys.budgets.analytics(id),
    queryFn: async () => {
      return apiClient.get<BudgetAnalytics>(`/api/budgets/${id}/analytics`);
    },
    enabled: options.enabled !== false && !!id,
    // Analytics data changes frequently, use shorter stale time
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new budget
 *
 * @returns Mutation hook for creating budgets
 *
 * @example
 * ```typescript
 * const createBudget = useCreateBudget()
 *
 * createBudget.mutate({
 *   name: 'January 2024 Budget',
 *   type: 'MONTHLY',
 *   period: 'MONTHLY',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   categories: [
 *     { categoryId: 'cat-food', amount: 500 },
 *     { categoryId: 'cat-transport', amount: 200 },
 *   ],
 * })
 * ```
 */
export function useCreateBudget(): UseMutationResult<
  Budget,
  Error,
  BudgetInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BudgetInput) => {
      return apiClient.post<Budget>('/api/budgets', data);
    },
    onSuccess: () => {
      // Invalidate all budget lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.lists() });
    },
  });
}

/**
 * Update existing budget
 *
 * @returns Mutation hook for updating budgets
 *
 * @example
 * ```typescript
 * const updateBudget = useUpdateBudget()
 *
 * updateBudget.mutate({
 *   id: 'budget-123',
 *   data: { isActive: false }
 * })
 * ```
 */
export function useUpdateBudget(): UseMutationResult<
  Budget,
  Error,
  { id: string; data: Partial<BudgetInput> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch<Budget>(`/api/budgets/${id}`, data);
    },
    onSuccess: (updatedBudget) => {
      // Invalidate the specific budget detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.detail(updatedBudget.id),
      });
      // Invalidate budget analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.analytics(updatedBudget.id),
      });
      // Invalidate all budget lists
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.lists() });
    },
  });
}

/**
 * Delete budget
 *
 * @returns Mutation hook for deleting budgets
 *
 * @example
 * ```typescript
 * const deleteBudget = useDeleteBudget()
 *
 * deleteBudget.mutate('budget-123')
 * ```
 */
export function useDeleteBudget(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<void>(`/api/budgets/${id}`);
    },
    onSuccess: () => {
      // Invalidate all budget lists
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.lists() });
    },
  });
}

/**
 * Update budget category allocation
 *
 * @returns Mutation hook for updating category budgets
 *
 * @example
 * ```typescript
 * const updateCategory = useUpdateBudgetCategory()
 *
 * updateCategory.mutate({
 *   budgetId: 'budget-123',
 *   categoryId: 'cat-food',
 *   amount: 600,
 * })
 * ```
 */
export function useUpdateBudgetCategory(): UseMutationResult<
  Budget,
  Error,
  { budgetId: string; categoryId: string; amount: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, categoryId, amount }) => {
      return apiClient.patch<Budget>(`/api/budgets/${budgetId}/categories/${categoryId}`, {
        amount,
      });
    },
    onSuccess: (updatedBudget) => {
      // Invalidate the specific budget
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.detail(updatedBudget.id),
      });
      // Invalidate budget analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.analytics(updatedBudget.id),
      });
      // Invalidate all budget lists
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.lists() });
    },
  });
}
