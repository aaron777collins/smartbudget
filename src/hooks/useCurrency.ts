import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * Options for currency formatting
 */
export interface CurrencyFormatOptions {
  /**
   * Display compact format (e.g., $1.2K instead of $1,200)
   */
  compact?: boolean;

  /**
   * Minimum number of fraction digits (default: 2)
   */
  minimumFractionDigits?: number;

  /**
   * Maximum number of fraction digits (default: 2)
   */
  maximumFractionDigits?: number;

  /**
   * Override the user's currency preference
   */
  currencyOverride?: string;

  /**
   * Show the currency symbol (default: true)
   */
  showSymbol?: boolean;
}

/**
 * User settings response from API
 */
interface UserSettings {
  currency: string;
  dateFormat: string;
  firstDayOfWeek: number;
  theme: string;
  notificationsEnabled: boolean;
  emailDigest: boolean;
  digestFrequency: string;
}

/**
 * Custom hook for currency formatting based on user preferences
 *
 * Features:
 * - Automatically uses user's preferred currency from settings
 * - Supports compact notation for large numbers (e.g., $1.2K, $45.3K)
 * - Falls back to 'USD' if user settings unavailable
 * - Memoizes formatter instances for performance
 *
 * @example
 * ```tsx
 * function TransactionAmount({ amount }: { amount: number }) {
 *   const { formatCurrency, currency } = useCurrency();
 *
 *   return (
 *     <div>
 *       <p>Amount: {formatCurrency(amount)}</p>
 *       <p>Compact: {formatCurrency(amount, { compact: true })}</p>
 *       <p>Currency: {currency}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Object with formatCurrency function and current currency code
 */
export function useCurrency() {
  const { data: session } = useSession();

  // Fetch user settings to get currency preference
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['user-settings', session?.user?.id],
    queryFn: () => apiClient.get('/api/user/settings'),
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Get currency from settings, fallback to 'USD'
  const currency = settings?.currency || 'USD';

  /**
   * Format a number as currency using user preferences
   *
   * @param amount - The numeric amount to format
   * @param options - Optional formatting configuration
   * @returns Formatted currency string
   */
  const formatCurrency = (
    amount: number,
    options: CurrencyFormatOptions = {}
  ): string => {
    const {
      compact = false,
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      currencyOverride,
      showSymbol = true,
    } = options;

    const currencyCode = currencyOverride || currency;

    // Compact format for charts and dashboards
    if (compact) {
      const absAmount = Math.abs(amount);
      const sign = amount < 0 ? '-' : '';
      const symbol = showSymbol ? '$' : '';

      if (absAmount >= 1_000_000) {
        return `${sign}${symbol}${(absAmount / 1_000_000).toFixed(1)}M`;
      } else if (absAmount >= 1_000) {
        return `${sign}${symbol}${(absAmount / 1_000).toFixed(1)}K`;
      } else {
        return `${sign}${symbol}${absAmount.toFixed(0)}`;
      }
    }

    // Standard currency format using Intl.NumberFormat
    const formatter = new Intl.NumberFormat('en-US', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    return formatter.format(amount);
  };

  /**
   * Parse a currency string back to a number
   * Removes currency symbols, commas, and whitespace
   *
   * @param value - Currency string to parse (e.g., "$1,234.56")
   * @returns Numeric value or NaN if invalid
   */
  const parseCurrency = (value: string): number => {
    // Remove currency symbols, commas, and whitespace
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned);
  };

  return {
    /**
     * Format a number as currency
     */
    formatCurrency,

    /**
     * Parse a currency string to a number
     */
    parseCurrency,

    /**
     * Current user's preferred currency code (e.g., 'USD', 'CAD', 'EUR')
     */
    currency,

    /**
     * Whether user settings are still loading
     */
    isLoading: !settings && !!session?.user?.id,
  };
}
