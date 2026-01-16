import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { format, formatRelative, formatDistance, parseISO } from 'date-fns';
import { apiClient } from '@/lib/api-client';

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
 * Date format presets matching common user preferences
 */
const DATE_FORMAT_MAP: Record<string, string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'MMM D, YYYY': 'MMM d, yyyy',
  'D MMM YYYY': 'd MMM yyyy',
};

/**
 * Options for date formatting
 */
export interface DateFormatOptions {
  /**
   * Custom format string (overrides user preference)
   * Uses date-fns format tokens
   */
  formatString?: string;

  /**
   * Return relative time (e.g., "2 days ago")
   */
  relative?: boolean;

  /**
   * Return distance from now (e.g., "in 3 hours")
   */
  distance?: boolean;

  /**
   * Add time to the formatted output
   */
  includeTime?: boolean;

  /**
   * Use short format (e.g., "12/31" instead of "12/31/2024")
   */
  short?: boolean;
}

/**
 * Custom hook for consistent date formatting based on user preferences
 *
 * Features:
 * - Automatically uses user's preferred date format from settings
 * - Falls back to 'MM/DD/YYYY' if user settings unavailable
 * - Supports relative dates ("2 days ago", "in 3 hours")
 * - Handles both Date objects and ISO string inputs
 * - Includes time formatting options
 *
 * @example
 * ```tsx
 * function TransactionDate({ date }: { date: string }) {
 *   const { formatDate, dateFormat } = useFormatDate();
 *
 *   return (
 *     <div>
 *       <p>Standard: {formatDate(date)}</p>
 *       <p>With time: {formatDate(date, { includeTime: true })}</p>
 *       <p>Relative: {formatDate(date, { relative: true })}</p>
 *       <p>Distance: {formatDate(date, { distance: true })}</p>
 *       <p>Current format: {dateFormat}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Object with formatDate function and current date format preference
 */
export function useFormatDate() {
  const { data: session } = useSession();

  // Fetch user settings to get date format preference
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['user-settings', session?.user?.id],
    queryFn: () => apiClient.get('/api/user/settings'),
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Get date format from settings, fallback to 'MM/DD/YYYY'
  const userDateFormat = settings?.dateFormat || 'MM/DD/YYYY';
  const dateFormatString = DATE_FORMAT_MAP[userDateFormat] || 'MM/dd/yyyy';

  /**
   * Parse a date input into a Date object
   * Handles Date objects, ISO strings, and timestamps
   */
  const parseDate = (date: Date | string | number): Date => {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === 'string') {
      return parseISO(date);
    }
    return new Date(date);
  };

  /**
   * Format a date using user preferences or custom options
   *
   * @param date - Date to format (Date object, ISO string, or timestamp)
   * @param options - Optional formatting configuration
   * @returns Formatted date string
   */
  const formatDate = (
    date: Date | string | number,
    options: DateFormatOptions = {}
  ): string => {
    const {
      formatString,
      relative = false,
      distance = false,
      includeTime = false,
      short = false,
    } = options;

    try {
      const dateObj = parseDate(date);

      // Handle invalid dates
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      // Relative format: "2 days ago", "yesterday", "last Monday"
      if (relative) {
        return formatRelative(dateObj, new Date());
      }

      // Distance format: "in 3 hours", "2 days ago"
      if (distance) {
        return formatDistance(dateObj, new Date(), { addSuffix: true });
      }

      // Custom format string
      if (formatString) {
        return format(dateObj, formatString);
      }

      // Short format (no year)
      if (short) {
        const shortFormat = dateFormatString.replace(/[yY]+/g, '').replace(/^[/\s-]+|[/\s-]+$/g, '');
        return format(dateObj, shortFormat);
      }

      // Standard format with optional time
      let formatStr = dateFormatString;
      if (includeTime) {
        formatStr = `${dateFormatString} HH:mm`;
      }

      return format(dateObj, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  /**
   * Format a date for form inputs (YYYY-MM-DD)
   * Always returns ISO date format regardless of user preference
   */
  const formatForInput = (date: Date | string | number): string => {
    try {
      const dateObj = parseDate(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Date input formatting error:', error);
      return '';
    }
  };

  /**
   * Format a date for display in tables (compact)
   */
  const formatCompact = (date: Date | string | number): string => {
    return formatDate(date, { short: true });
  };

  /**
   * Format a date with time (HH:mm)
   */
  const formatDateTime = (date: Date | string | number): string => {
    return formatDate(date, { includeTime: true });
  };

  /**
   * Get relative time (e.g., "2 days ago")
   */
  const formatRelativeTime = (date: Date | string | number): string => {
    return formatDate(date, { relative: true });
  };

  /**
   * Get distance from now (e.g., "in 3 hours")
   */
  const formatDistanceFromNow = (date: Date | string | number): string => {
    return formatDate(date, { distance: true });
  };

  return {
    /**
     * Format a date using user preferences or custom options
     */
    formatDate,

    /**
     * Format a date for form inputs (YYYY-MM-DD)
     */
    formatForInput,

    /**
     * Format a date compactly (without year)
     */
    formatCompact,

    /**
     * Format a date with time
     */
    formatDateTime,

    /**
     * Get relative time (e.g., "2 days ago")
     */
    formatRelativeTime,

    /**
     * Get distance from now (e.g., "in 3 hours")
     */
    formatDistanceFromNow,

    /**
     * Current user's preferred date format (e.g., 'MM/DD/YYYY')
     */
    dateFormat: userDateFormat,

    /**
     * date-fns format string for the user's preference
     */
    dateFormatString,

    /**
     * Whether user settings are still loading
     */
    isLoading: !settings && !!session?.user?.id,
  };
}
