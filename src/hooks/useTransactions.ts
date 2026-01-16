/**
 * Transaction Data Fetching Hooks
 *
 * Custom React Query hooks for fetching and mutating transaction data.
 * Provides type-safe data fetching with automatic caching, background
 * refetching, and optimistic updates.
 *
 * @example
 * ```typescript
 * // List transactions with filters
 * const { data, isLoading } = useTransactions({ accountId: '123' })
 *
 * // Get single transaction
 * const { data: transaction } = useTransaction('txn-id')
 *
 * // Create transaction
 * const createMutation = useCreateTransaction()
 * createMutation.mutate({ amount: 100, description: 'Groceries' })
 * ```
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { Transaction, TransactionType } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Transaction with related data
 */
export interface TransactionWithRelations extends Transaction {
  account?: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

/**
 * Transaction list query filters
 */
export interface TransactionFilters extends Record<string, unknown> {
  accountId?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string;
  excludeTags?: string;
  uncategorizedOnly?: boolean;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Transaction create/update input
 */
export interface TransactionInput {
  accountId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  date?: Date | string;
  categoryId?: string;
  subcategoryId?: string;
  merchantName?: string;
  notes?: string;
  tagIds?: string[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of transactions with filters
 *
 * @param filters - Query filters (accountId, dates, search, etc.)
 * @returns React Query result with transactions array
 *
 * @example
 * ```typescript
 * const { data: transactions, isLoading } = useTransactions({
 *   accountId: '123',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   type: 'EXPENSE',
 * })
 * ```
 */
export function useTransactions(
  filters: TransactionFilters = {}
): UseQueryResult<TransactionWithRelations[], Error> {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => {
      return apiClient.get<TransactionWithRelations[]>('/api/transactions', {
        params: filters as Record<string, string | number | boolean>,
      });
    },
  });
}

/**
 * Fetch single transaction by ID
 *
 * @param id - Transaction ID
 * @param options - Query options
 * @returns React Query result with single transaction
 *
 * @example
 * ```typescript
 * const { data: transaction } = useTransaction('txn-123')
 * ```
 */
export function useTransaction(
  id: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<TransactionWithRelations, Error> {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: async () => {
      return apiClient.get<TransactionWithRelations>(`/api/transactions/${id}`);
    },
    enabled: options.enabled !== false && !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new transaction
 *
 * @returns Mutation hook for creating transactions with optimistic updates
 *
 * @example
 * ```typescript
 * const createTransaction = useCreateTransaction()
 *
 * createTransaction.mutate({
 *   accountId: '123',
 *   amount: -50.00,
 *   type: 'EXPENSE',
 *   description: 'Groceries',
 *   categoryId: 'cat-food',
 * })
 * ```
 */
export function useCreateTransaction(): UseMutationResult<
  Transaction,
  Error,
  TransactionInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionInput) => {
      return apiClient.post<Transaction>('/api/transactions', data);
    },
    onMutate: async (newTransaction) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });

      // Snapshot previous values for rollback
      const previousTransactions = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Optimistically add new transaction to all list caches
      queryClient.setQueriesData<TransactionWithRelations[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;

          // Create optimistic transaction object (partial - server will set proper types)
          const optimisticTransaction: TransactionWithRelations = {
            id: `temp-${Date.now()}`, // Temporary ID
            userId: '', // Will be set by server
            accountId: newTransaction.accountId,
            amount: newTransaction.amount as any, // Decimal type from Prisma
            type: newTransaction.type,
            description: newTransaction.description || '',
            merchantName: newTransaction.merchantName || '',
            date: newTransaction.date ? new Date(newTransaction.date) : new Date(),
            postedDate: null,
            categoryId: newTransaction.categoryId || null,
            subcategoryId: newTransaction.subcategoryId || null,
            notes: newTransaction.notes || null,
            fitid: null,
            isReconciled: false,
            isRecurring: false,
            recurringRuleId: null,
            confidenceScore: null,
            userCorrected: false,
            rawData: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return [optimisticTransaction, ...old];
        }
      );

      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all transaction lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      // Invalidate dashboard queries as they depend on transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Update existing transaction
 *
 * @returns Mutation hook for updating transactions with optimistic updates
 *
 * @example
 * ```typescript
 * const updateTransaction = useUpdateTransaction()
 *
 * updateTransaction.mutate({
 *   id: 'txn-123',
 *   data: { categoryId: 'cat-dining' }
 * })
 * ```
 */
export function useUpdateTransaction(): UseMutationResult<
  Transaction,
  Error,
  { id: string; data: Partial<TransactionInput> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch<Transaction>(`/api/transactions/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel ongoing queries for this transaction
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });

      // Snapshot previous values for rollback
      const previousTransaction = queryClient.getQueryData<TransactionWithRelations>(
        queryKeys.transactions.detail(id)
      );
      const previousTransactionLists = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Optimistically update detail cache
      queryClient.setQueryData<TransactionWithRelations>(
        queryKeys.transactions.detail(id),
        (old) => {
          if (!old) return old;
          // Only update specific fields to avoid type conflicts with Decimal
          const updated = { ...old };
          if (data.accountId !== undefined) updated.accountId = data.accountId;
          if (data.type !== undefined) updated.type = data.type;
          if (data.description !== undefined) updated.description = data.description;
          if (data.date !== undefined) updated.date = new Date(data.date);
          if (data.categoryId !== undefined) updated.categoryId = data.categoryId;
          if (data.subcategoryId !== undefined) updated.subcategoryId = data.subcategoryId;
          if (data.merchantName !== undefined) updated.merchantName = data.merchantName;
          if (data.notes !== undefined) updated.notes = data.notes;
          updated.updatedAt = new Date();
          return updated;
        }
      );

      // Optimistically update all list caches
      queryClient.setQueriesData<TransactionWithRelations[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((txn) => {
            if (txn.id !== id) return txn;
            // Only update specific fields to avoid type conflicts
            const updated = { ...txn };
            if (data.accountId !== undefined) updated.accountId = data.accountId;
            if (data.type !== undefined) updated.type = data.type;
            if (data.description !== undefined) updated.description = data.description;
            if (data.date !== undefined) updated.date = new Date(data.date);
            if (data.categoryId !== undefined) updated.categoryId = data.categoryId;
            if (data.subcategoryId !== undefined) updated.subcategoryId = data.subcategoryId;
            if (data.merchantName !== undefined) updated.merchantName = data.merchantName;
            if (data.notes !== undefined) updated.notes = data.notes;
            updated.updatedAt = new Date();
            return updated;
          });
        }
      );

      return { previousTransaction, previousTransactionLists };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          queryKeys.transactions.detail(variables.id),
          context.previousTransaction
        );
      }
      if (context?.previousTransactionLists) {
        context.previousTransactionLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedTransaction) => {
      // Invalidate the specific transaction detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(updatedTransaction.id),
      });
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Delete transaction
 *
 * @returns Mutation hook for deleting transactions with optimistic updates
 *
 * @example
 * ```typescript
 * const deleteTransaction = useDeleteTransaction()
 *
 * deleteTransaction.mutate('txn-123')
 * ```
 */
export function useDeleteTransaction(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<void>(`/api/transactions/${id}`);
    },
    onMutate: async (id) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.detail(id) });

      // Snapshot previous values for rollback
      const previousTransactionLists = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });
      const previousTransaction = queryClient.getQueryData<TransactionWithRelations>(
        queryKeys.transactions.detail(id)
      );

      // Optimistically remove transaction from all list caches
      queryClient.setQueriesData<TransactionWithRelations[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((txn) => txn.id !== id);
        }
      );

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.transactions.detail(id) });

      return { previousTransactionLists, previousTransaction };
    },
    onError: (err, id, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTransactionLists) {
        context.previousTransactionLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          queryKeys.transactions.detail(id),
          context.previousTransaction
        );
      }
    },
    onSuccess: () => {
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Categorize transaction (manually or with AI)
 *
 * @returns Mutation hook for categorizing transactions with optimistic updates
 *
 * @example
 * ```typescript
 * const categorizeTransaction = useCategorizeTransaction()
 *
 * categorizeTransaction.mutate({
 *   id: 'txn-123',
 *   categoryId: 'cat-groceries',
 *   subcategoryId: 'sub-produce',
 * })
 * ```
 */
export function useCategorizeTransaction(): UseMutationResult<
  Transaction,
  Error,
  { id: string; categoryId: string; subcategoryId?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId, subcategoryId }) => {
      return apiClient.put<Transaction>(`/api/transactions/${id}/categorize`, {
        categoryId,
        subcategoryId,
      });
    },
    onMutate: async ({ id, categoryId, subcategoryId }) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });

      // Snapshot previous values for rollback
      const previousTransaction = queryClient.getQueryData<TransactionWithRelations>(
        queryKeys.transactions.detail(id)
      );
      const previousTransactionLists = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Optimistically update detail cache
      queryClient.setQueryData<TransactionWithRelations>(
        queryKeys.transactions.detail(id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            categoryId,
            subcategoryId: subcategoryId || null,
            updatedAt: new Date(),
          };
        }
      );

      // Optimistically update all list caches
      queryClient.setQueriesData<TransactionWithRelations[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((txn) =>
            txn.id === id
              ? {
                  ...txn,
                  categoryId,
                  subcategoryId: subcategoryId || null,
                  updatedAt: new Date(),
                }
              : txn
          );
        }
      );

      return { previousTransaction, previousTransactionLists };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          queryKeys.transactions.detail(variables.id),
          context.previousTransaction
        );
      }
      if (context?.previousTransactionLists) {
        context.previousTransactionLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedTransaction) => {
      // Invalidate the specific transaction
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(updatedTransaction.id),
      });
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      // Invalidate dashboard queries (categorization affects category breakdowns)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Bulk import transactions from CSV/OFX
 *
 * @returns Mutation hook for importing transactions
 *
 * @example
 * ```typescript
 * const importTransactions = useImportTransactions()
 *
 * const formData = new FormData()
 * formData.append('file', file)
 * formData.append('accountId', accountId)
 *
 * importTransactions.mutate(formData)
 * ```
 */
export function useImportTransactions(): UseMutationResult<
  { imported: number; skipped: number; errors: string[] },
  Error,
  FormData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Import endpoint expects FormData, not JSON
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all transaction lists to show imported transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
