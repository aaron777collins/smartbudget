import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class')
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class')
  })

  it('should merge Tailwind classes correctly', () => {
    // twMerge should handle conflicting classes
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('formatCurrency', () => {
  describe('standard formatting', () => {
    it('should format standard amounts with USD by default', () => {
      expect(formatCurrency(100)).toBe('$100.00')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format with specific currency', () => {
      expect(formatCurrency(100, 'CAD')).toBe('CA$100.00')
      expect(formatCurrency(100, 'EUR')).toBe('€100.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-50)).toBe('-$50.00')
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(123.456)).toBe('$123.46')
      expect(formatCurrency(123.454)).toBe('$123.45')
    })
  })

  describe('compact formatting', () => {
    it('should format thousands with K suffix', () => {
      expect(formatCurrency(1000, true)).toBe('$1.0K')
      expect(formatCurrency(1500, true)).toBe('$1.5K')
      expect(formatCurrency(45300, true)).toBe('$45.3K')
    })

    it('should format millions with M suffix', () => {
      expect(formatCurrency(1000000, true)).toBe('$1.0M')
      expect(formatCurrency(2500000, true)).toBe('$2.5M')
    })

    it('should format small amounts without suffix', () => {
      expect(formatCurrency(999, true)).toBe('$999')
      expect(formatCurrency(100, true)).toBe('$100')
      expect(formatCurrency(0, true)).toBe('$0')
    })

    it('should support compact format with custom currency', () => {
      expect(formatCurrency(1500, true, 'CAD')).toBe('$1.5K')
      expect(formatCurrency(1000000, true, 'EUR')).toBe('$1.0M')
    })
  })

  describe('backward compatibility', () => {
    it('should handle old signature: formatCurrency(amount, currency)', () => {
      expect(formatCurrency(100, 'CAD')).toBe('CA$100.00')
      expect(formatCurrency(1234, 'USD')).toBe('$1,234.00')
    })

    it('should handle new signature: formatCurrency(amount, compact, currency)', () => {
      expect(formatCurrency(1234, false, 'CAD')).toBe('CA$1,234.00')
      expect(formatCurrency(1234, true, 'USD')).toBe('$1.2K')
    })
  })
})
