import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDateRangeFromTimeframe,
  buildTimeframeParams,
  getMonthsFromTimeframe,
  getPeriodForAPI,
} from './timeframe'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

describe('timeframe utilities', () => {
  beforeEach(() => {
    // Mock current date to Jan 15, 2024 for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  describe('getDateRangeFromTimeframe', () => {
    it('should return correct range for "today"', () => {
      const result = getDateRangeFromTimeframe({ period: 'today' })
      expect(result).not.toBeNull()
      expect(result?.startDate.getDate()).toBe(15)
      expect(result?.endDate.getDate()).toBe(15)
    })

    it('should return correct range for "this-month"', () => {
      const result = getDateRangeFromTimeframe({ period: 'this-month' })
      expect(result).not.toBeNull()
      expect(result?.startDate.getDate()).toBe(1)
      expect(result?.endDate.getDate()).toBe(31) // January has 31 days
    })

    it('should return null for "all-time"', () => {
      const result = getDateRangeFromTimeframe({ period: 'all-time' })
      expect(result).toBeNull()
    })

    it('should handle custom date range', () => {
      const customStart = new Date('2024-01-01')
      const customEnd = new Date('2024-01-31')
      const result = getDateRangeFromTimeframe({
        period: 'custom',
        startDate: customStart,
        endDate: customEnd,
      })
      expect(result).not.toBeNull()
      expect(result?.startDate.getDate()).toBe(1)
      expect(result?.endDate.getDate()).toBe(31)
    })

    it('should default to this month for custom without dates', () => {
      const result = getDateRangeFromTimeframe({ period: 'custom' })
      expect(result).not.toBeNull()
      expect(result?.startDate.getMonth()).toBe(0) // January
      expect(result?.endDate.getMonth()).toBe(0)
    })

    it('should return correct range for "last-7-days"', () => {
      const result = getDateRangeFromTimeframe({ period: 'last-7-days' })
      expect(result).not.toBeNull()
      // Should include today, so 7 days including current
      const daysDiff = Math.ceil(
        (result!.endDate.getTime() - result!.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(6) // 7 days including today = 6 days difference
    })

    it('should return correct range for "last-30-days"', () => {
      const result = getDateRangeFromTimeframe({ period: 'last-30-days' })
      expect(result).not.toBeNull()
      const daysDiff = Math.ceil(
        (result!.endDate.getTime() - result!.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(29) // 30 days including today = 29 days difference
    })
  })

  describe('buildTimeframeParams', () => {
    it('should return empty object for all-time', () => {
      const result = buildTimeframeParams({ period: 'all-time' })
      expect(result).toEqual({})
    })

    it('should return ISO date strings for valid timeframe', () => {
      const result = buildTimeframeParams({ period: 'today' })
      expect(result).toHaveProperty('startDate')
      expect(result).toHaveProperty('endDate')
      expect(typeof result.startDate).toBe('string')
      expect(typeof result.endDate).toBe('string')
      // Should be valid ISO strings
      expect(new Date(result.startDate).toISOString()).toBe(result.startDate)
    })

    it('should handle custom date range', () => {
      const customStart = new Date('2024-01-01')
      const customEnd = new Date('2024-01-31')
      const result = buildTimeframeParams({
        period: 'custom',
        startDate: customStart,
        endDate: customEnd,
      })
      expect(result.startDate).toBe(startOfDay(customStart).toISOString())
      expect(result.endDate).toBe(endOfDay(customEnd).toISOString())
    })
  })

  describe('getMonthsFromTimeframe', () => {
    it('should return 1 month for daily/weekly periods', () => {
      expect(getMonthsFromTimeframe({ period: 'today' })).toBe(1)
      expect(getMonthsFromTimeframe({ period: 'this-week' })).toBe(1)
      expect(getMonthsFromTimeframe({ period: 'last-7-days' })).toBe(1)
    })

    it('should return 1 month for monthly periods', () => {
      expect(getMonthsFromTimeframe({ period: 'this-month' })).toBe(1)
      expect(getMonthsFromTimeframe({ period: 'last-30-days' })).toBe(1)
    })

    it('should return 3 months for quarterly period', () => {
      expect(getMonthsFromTimeframe({ period: 'this-quarter' })).toBe(3)
    })

    it('should return 12 months for yearly periods', () => {
      expect(getMonthsFromTimeframe({ period: 'this-year' })).toBe(12)
      expect(getMonthsFromTimeframe({ period: 'last-12-months' })).toBe(12)
    })

    it('should return 24 months for all-time (capped)', () => {
      expect(getMonthsFromTimeframe({ period: 'all-time' })).toBe(24)
    })

    it('should calculate months for custom range', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-06-30') // ~6 months
      const result = getMonthsFromTimeframe({
        period: 'custom',
        startDate,
        endDate,
      })
      expect(result).toBeGreaterThanOrEqual(6)
      expect(result).toBeLessThanOrEqual(7)
    })

    it('should cap custom range at 24 months', () => {
      const startDate = new Date('2020-01-01')
      const endDate = new Date('2024-01-01') // 4 years
      const result = getMonthsFromTimeframe({
        period: 'custom',
        startDate,
        endDate,
      })
      expect(result).toBe(24) // Should be capped at 24
    })
  })

  describe('getPeriodForAPI', () => {
    it('should return "month" for daily/weekly/monthly periods', () => {
      expect(getPeriodForAPI({ period: 'today' })).toBe('month')
      expect(getPeriodForAPI({ period: 'this-week' })).toBe('month')
      expect(getPeriodForAPI({ period: 'this-month' })).toBe('month')
      expect(getPeriodForAPI({ period: 'last-30-days' })).toBe('month')
    })

    it('should return "quarter" for quarterly period', () => {
      expect(getPeriodForAPI({ period: 'this-quarter' })).toBe('quarter')
    })

    it('should return "year" for yearly periods', () => {
      expect(getPeriodForAPI({ period: 'this-year' })).toBe('year')
      expect(getPeriodForAPI({ period: 'last-12-months' })).toBe('year')
      expect(getPeriodForAPI({ period: 'all-time' })).toBe('year')
    })

    it('should return "custom" for custom period', () => {
      expect(getPeriodForAPI({ period: 'custom' })).toBe('custom')
    })
  })
})
