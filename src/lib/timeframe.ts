import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
} from "date-fns";
import type { TimeframeValue } from "@/components/dashboard/timeframe-selector";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Converts a TimeframeValue to an actual date range
 */
export function getDateRangeFromTimeframe(timeframe: TimeframeValue): DateRange | null {
  const now = new Date();

  switch (timeframe.period) {
    case "today":
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };

    case "this-week":
      return {
        startDate: startOfWeek(now),
        endDate: endOfWeek(now),
      };

    case "last-7-days":
      return {
        startDate: startOfDay(subDays(now, 6)), // 7 days including today
        endDate: endOfDay(now),
      };

    case "this-month":
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case "last-30-days":
      return {
        startDate: startOfDay(subDays(now, 29)), // 30 days including today
        endDate: endOfDay(now),
      };

    case "this-quarter":
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };

    case "this-year":
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };

    case "last-12-months":
      return {
        startDate: startOfMonth(subMonths(now, 11)), // 12 months including current
        endDate: endOfMonth(now),
      };

    case "all-time":
      // Return null to indicate no filtering
      return null;

    case "custom":
      if (timeframe.startDate && timeframe.endDate) {
        return {
          startDate: startOfDay(timeframe.startDate),
          endDate: endOfDay(timeframe.endDate),
        };
      }
      // If custom is selected but dates aren't set, default to this month
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    default:
      return null;
  }
}

/**
 * Builds query parameters for API calls based on timeframe
 */
export function buildTimeframeParams(timeframe: TimeframeValue): Record<string, string> {
  const dateRange = getDateRangeFromTimeframe(timeframe);

  if (!dateRange) {
    // All time - no parameters
    return {};
  }

  return {
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
  };
}

/**
 * Gets the number of months to fetch based on the timeframe
 * Useful for APIs that expect a "months" parameter
 */
export function getMonthsFromTimeframe(timeframe: TimeframeValue): number {
  switch (timeframe.period) {
    case "today":
    case "this-week":
    case "last-7-days":
      return 1;

    case "this-month":
    case "last-30-days":
      return 1;

    case "this-quarter":
      return 3;

    case "last-12-months":
    case "this-year":
      return 12;

    case "all-time":
      return 24; // Cap at 2 years for performance

    case "custom":
      if (timeframe.startDate && timeframe.endDate) {
        // Calculate months between dates
        const diffTime = Math.abs(timeframe.endDate.getTime() - timeframe.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.ceil(diffDays / 30);
        return Math.max(1, Math.min(months, 24)); // Between 1 and 24 months
      }
      return 1;

    default:
      return 12;
  }
}

/**
 * Gets the period parameter value for category breakdown API
 */
export function getPeriodForAPI(timeframe: TimeframeValue): "month" | "quarter" | "year" | "custom" {
  switch (timeframe.period) {
    case "today":
    case "this-week":
    case "last-7-days":
    case "this-month":
    case "last-30-days":
      return "month";

    case "this-quarter":
      return "quarter";

    case "this-year":
    case "last-12-months":
      return "year";

    case "all-time":
      return "year";

    case "custom":
      return "custom";

    default:
      return "month";
  }
}
