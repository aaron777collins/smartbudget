/**
 * Account Data Fetching Hooks
 *
 * Custom React Query hooks for fetching and mutating account data.
 * Provides type-safe data fetching with automatic caching, background
 * refetching, and optimistic updates.
 *
 * @example
 * ```typescript
 * // List accounts
 * const { data: accounts } = useAccounts()
 *
 * // Get single account
 * const { data: account } = useAccount('account-id')
 *
 * // Create account
 * const createMutation = useCreateAccount()
 * createMutation.mutate({ name: 'Checking', type: 'CHECKING' })
 * ```
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { Account, AccountType } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Account with related data
 */
export interface AccountWithRelations extends Account {
  _count?: {
    transactions: number;
  };
  balance?: number;
}

/**
 * Account list query filters
 */
export interface AccountFilters extends Record<string, unknown> {
  type?: AccountType;
  active?: boolean;
  sortBy?: 'name' | 'type' | 'balance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Account create/update input
 */
export interface AccountInput {
  name: string;
  type: AccountType;
  institution?: string;
  accountNumber?: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  notes?: string;
}

/**
 * Account balance data
 */
export interface AccountBalance {
  accountId: string;
  currentBalance: number;
  availableBalance?: number;
  asOfDate: string;
  transactions?: Array<{
    date: string;
    balance: number;
  }>;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch list of accounts with filters
 *
 * @param filters - Query filters (type, active status)
 * @returns React Query result with accounts array
 *
 * @example
 * ```typescript
 * const { data: accounts, isLoading } = useAccounts({
 *   active: true,
 *   type: 'CHECKING',
 * })
 * ```
 */
export function useAccounts(
  filters: AccountFilters = {}
): UseQueryResult<AccountWithRelations[], Error> {
  return useQuery({
    queryKey: queryKeys.accounts.list(filters),
    queryFn: async () => {
      return apiClient.get<AccountWithRelations[]>('/api/accounts', {
        params: filters as Record<string, string | number | boolean>,
      });
    },
  });
}

/**
 * Fetch single account by ID
 *
 * @param id - Account ID
 * @param options - Query options
 * @returns React Query result with single account
 *
 * @example
 * ```typescript
 * const { data: account } = useAccount('account-123')
 * ```
 */
export function useAccount(
  id: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<AccountWithRelations, Error> {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: async () => {
      return apiClient.get<AccountWithRelations>(`/api/accounts/${id}`);
    },
    enabled: options.enabled !== false && !!id,
  });
}

/**
 * Fetch account balance and history
 *
 * @param id - Account ID
 * @param date - Optional date for historical balance
 * @param options - Query options
 * @returns React Query result with account balance
 *
 * @example
 * ```typescript
 * const { data: balance } = useAccountBalance('account-123', '2024-01-31')
 * ```
 */
export function useAccountBalance(
  id: string,
  date?: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<AccountBalance, Error> {
  return useQuery({
    queryKey: queryKeys.accounts.balance(id, date),
    queryFn: async () => {
      return apiClient.get<AccountBalance>(`/api/accounts/${id}/balance`, {
        params: date ? { date } : undefined,
      });
    },
    enabled: options.enabled !== false && !!id,
    // Balance changes frequently, use shorter stale time
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new account
 *
 * @returns Mutation hook for creating accounts with optimistic updates
 *
 * @example
 * ```typescript
 * const createAccount = useCreateAccount()
 *
 * createAccount.mutate({
 *   name: 'Chase Checking',
 *   type: 'CHECKING',
 *   institution: 'Chase',
 *   balance: 1000.00,
 *   currency: 'USD',
 *   color: '#0066CC',
 *   icon: 'bank',
 * })
 * ```
 */
export function useCreateAccount(): UseMutationResult<
  Account,
  Error,
  AccountInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccountInput) => {
      return apiClient.post<Account>('/api/accounts', data);
    },
    onMutate: async (newAccount) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.lists() });

      // Snapshot previous values for rollback
      const previousAccounts = queryClient.getQueriesData({
        queryKey: queryKeys.accounts.lists(),
      });

      // Optimistically add new account to all list caches
      queryClient.setQueriesData<AccountWithRelations[]>(
        { queryKey: queryKeys.accounts.lists() },
        (old) => {
          if (!old) return old;

          // Create optimistic account object (partial - server will set proper types)
          const optimisticAccount: AccountWithRelations = {
            id: `temp-${Date.now()}`, // Temporary ID
            userId: '', // Will be set by server
            name: newAccount.name,
            accountType: newAccount.type,
            institution: newAccount.institution || '',
            accountNumber: newAccount.accountNumber || null,
            currentBalance: 0 as any, // Decimal type from Prisma
            availableBalance: null,
            currency: newAccount.currency || 'USD',
            color: newAccount.color || '#2563EB',
            icon: newAccount.icon || 'wallet',
            isActive: newAccount.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return [optimisticAccount, ...old];
        }
      );

      return { previousAccounts };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousAccounts) {
        context.previousAccounts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all account lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
      // Invalidate dashboard queries as they may show account data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Update existing account
 *
 * @returns Mutation hook for updating accounts with optimistic updates
 *
 * @example
 * ```typescript
 * const updateAccount = useUpdateAccount()
 *
 * updateAccount.mutate({
 *   id: 'account-123',
 *   data: { name: 'Chase Savings', type: 'SAVINGS' }
 * })
 * ```
 */
export function useUpdateAccount(): UseMutationResult<
  Account,
  Error,
  { id: string; data: Partial<AccountInput> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch<Account>(`/api/accounts/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel ongoing queries for this account
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.lists() });

      // Snapshot previous values for rollback
      const previousAccount = queryClient.getQueryData<AccountWithRelations>(
        queryKeys.accounts.detail(id)
      );
      const previousAccountLists = queryClient.getQueriesData({
        queryKey: queryKeys.accounts.lists(),
      });

      // Optimistically update detail cache
      queryClient.setQueryData<AccountWithRelations>(
        queryKeys.accounts.detail(id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...data,
            updatedAt: new Date(),
          };
        }
      );

      // Optimistically update all list caches
      queryClient.setQueriesData<AccountWithRelations[]>(
        { queryKey: queryKeys.accounts.lists() },
        (old) => {
          if (!old) return old;
          return old.map((account) =>
            account.id === id
              ? {
                  ...account,
                  ...data,
                  updatedAt: new Date(),
                }
              : account
          );
        }
      );

      return { previousAccount, previousAccountLists };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousAccount) {
        queryClient.setQueryData(
          queryKeys.accounts.detail(variables.id),
          context.previousAccount
        );
      }
      if (context?.previousAccountLists) {
        context.previousAccountLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedAccount) => {
      // Invalidate the specific account detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.detail(updatedAccount.id),
      });
      // Invalidate account balance
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.balance(updatedAccount.id),
      });
      // Invalidate all account lists
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Delete account
 *
 * @returns Mutation hook for deleting accounts with optimistic updates
 *
 * @example
 * ```typescript
 * const deleteAccount = useDeleteAccount()
 *
 * deleteAccount.mutate('account-123')
 * ```
 */
export function useDeleteAccount(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<void>(`/api/accounts/${id}`);
    },
    onMutate: async (id) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.detail(id) });

      // Snapshot previous values for rollback
      const previousAccountLists = queryClient.getQueriesData({
        queryKey: queryKeys.accounts.lists(),
      });
      const previousAccount = queryClient.getQueryData<AccountWithRelations>(
        queryKeys.accounts.detail(id)
      );

      // Optimistically remove account from all list caches
      queryClient.setQueriesData<AccountWithRelations[]>(
        { queryKey: queryKeys.accounts.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((account) => account.id !== id);
        }
      );

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.accounts.detail(id) });

      return { previousAccountLists, previousAccount };
    },
    onError: (err, id, context) => {
      // Rollback optimistic updates on error
      if (context?.previousAccountLists) {
        context.previousAccountLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousAccount) {
        queryClient.setQueryData(
          queryKeys.accounts.detail(id),
          context.previousAccount
        );
      }
    },
    onSuccess: () => {
      // Invalidate all account lists
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      // Invalidate transaction lists (they may reference the deleted account)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });
}

/**
 * Sync account balance with institution
 *
 * @returns Mutation hook for syncing account balance
 *
 * @example
 * ```typescript
 * const syncBalance = useSyncAccountBalance()
 *
 * syncBalance.mutate('account-123')
 * ```
 */
export function useSyncAccountBalance(): UseMutationResult<
  AccountBalance,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      return apiClient.post<AccountBalance>(`/api/accounts/${accountId}/sync`);
    },
    onSuccess: (balance) => {
      // Invalidate account balance queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.balance(balance.accountId),
      });
      // Invalidate account detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.detail(balance.accountId),
      });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
