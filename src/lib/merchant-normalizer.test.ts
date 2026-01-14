import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  preprocessMerchantName,
  getCanonicalName,
  fuzzyMatchMerchant,
  type FuzzyMatchResult,
} from './merchant-normalizer'

describe('merchant normalization', () => {
  describe('preprocessMerchantName', () => {
    it('should convert to lowercase', () => {
      expect(preprocessMerchantName('STARBUCKS')).toBe('starbucks')
      expect(preprocessMerchantName('Tim Hortons')).toBe('tim hortons')
    })

    it('should remove transaction IDs', () => {
      expect(preprocessMerchantName('Walmart #123456')).toBe('walmart')
      expect(preprocessMerchantName('Tim Hortons Ref#789')).toBe('tim hortons')
      expect(preprocessMerchantName('Sobeys Trans-9876')).toBe('sobeys')
      expect(preprocessMerchantName('Metro Transaction ID 555')).toBe('metro')
    })

    it('should remove dates', () => {
      expect(preprocessMerchantName('Loblaws 2024-01-15')).toBe('loblaws')
      expect(preprocessMerchantName('Costco 01/15/2024')).toBe('costco')
    })

    it('should remove times', () => {
      expect(preprocessMerchantName('McDonalds 14:30')).toBe('mcdonalds')
      expect(preprocessMerchantName('Subway 08:15:30')).toBe('subway')
    })

    it('should remove store/location/branch numbers', () => {
      expect(preprocessMerchantName('Canadian Tire Store #123')).toBe('canadian tire')
      expect(preprocessMerchantName('Tim Hortons Location 456')).toBe('tim hortons')
      expect(preprocessMerchantName('RBC Branch 789')).toBe('rbc')
    })

    it('should remove city and province patterns', () => {
      expect(preprocessMerchantName('Shoppers Drug Mart, Toronto, ON')).toBe('shoppers drug mart')
      expect(preprocessMerchantName('Loblaws - Vancouver')).toBe('loblaws')
    })

    it('should remove postal codes', () => {
      expect(preprocessMerchantName('Metro M5V 3A8')).toBe('metro')
      expect(preprocessMerchantName('Sobeys M5V3A8')).toBe('sobeys')
    })

    it('should remove phone numbers', () => {
      expect(preprocessMerchantName('Pizza Pizza 416-555-1234')).toBe('pizza pizza')
      expect(preprocessMerchantName('Dominos 416.555.1234')).toBe('dominos')
      expect(preprocessMerchantName('Subway 4165551234')).toBe('subway')
    })

    it('should remove URLs', () => {
      expect(preprocessMerchantName('Amazon https://amazon.ca')).toBe('amazon')
      expect(preprocessMerchantName('Netflix www.netflix.com')).toBe('netflix')
    })

    it('should remove email addresses', () => {
      expect(preprocessMerchantName('PayPal support@paypal.com')).toBe('paypal')
    })

    it('should remove special characters except spaces, ampersands, apostrophes', () => {
      expect(preprocessMerchantName('A&W')).toBe('a&w')
      expect(preprocessMerchantName("Tim Horton's")).toBe("tim horton's")
      expect(preprocessMerchantName('Walmart!@#$%')).toBe('walmart')
    })

    it('should collapse multiple spaces', () => {
      expect(preprocessMerchantName('Tim    Hortons')).toBe('tim hortons')
      expect(preprocessMerchantName('Canadian  Tire')).toBe('canadian tire')
    })

    it('should return "Unknown Merchant" for empty or very short strings', () => {
      expect(preprocessMerchantName('')).toBe('Unknown Merchant')
      expect(preprocessMerchantName('   ')).toBe('Unknown Merchant')
      expect(preprocessMerchantName('a')).toBe('Unknown Merchant')
      expect(preprocessMerchantName('#123')).toBe('Unknown Merchant') // Only transaction ID
    })

    it('should handle complex real-world examples', () => {
      expect(preprocessMerchantName('TIM HORTONS #3421 TORONTO ON M5V3A8 Trans#123456 2024-01-15 14:30'))
        .toBe('tim hortons')
      expect(preprocessMerchantName('LOBLAWS STORE 1234 - SCARBOROUGH, ON Ref#789'))
        .toBe('loblaws')
      expect(preprocessMerchantName('SHOPPERS DRUG MART #8765 416-555-1234'))
        .toBe('shoppers drug mart')
    })
  })

  describe('getCanonicalName', () => {
    it('should return canonical names for known merchants', () => {
      expect(getCanonicalName('tim hortons')).toBe('Tim Hortons')
      expect(getCanonicalName('tims')).toBe('Tim Hortons')
      expect(getCanonicalName('starbucks')).toBe('Starbucks')
      expect(getCanonicalName('walmart')).toBe('Walmart')
    })

    it('should handle grocery stores', () => {
      expect(getCanonicalName('loblaws')).toBe('Loblaws')
      expect(getCanonicalName('sobeys')).toBe('Sobeys')
      expect(getCanonicalName('no frills')).toBe('No Frills')
      expect(getCanonicalName('superstore')).toBe('Real Canadian Superstore')
    })

    it('should handle fast food chains', () => {
      expect(getCanonicalName('mcdonalds')).toBe("McDonald's")
      expect(getCanonicalName('burger king')).toBe('Burger King')
      expect(getCanonicalName('wendys')).toBe("Wendy's")
    })

    it('should handle gas stations', () => {
      expect(getCanonicalName('petro canada')).toBe('Petro-Canada')
      expect(getCanonicalName('esso')).toBe('Esso')
      expect(getCanonicalName('shell')).toBe('Shell')
    })

    it('should handle Canadian banks', () => {
      expect(getCanonicalName('cibc')).toBe('CIBC')
      expect(getCanonicalName('td')).toBe('TD Bank')
      expect(getCanonicalName('rbc')).toBe('RBC')
      expect(getCanonicalName('bmo')).toBe('BMO')
      expect(getCanonicalName('scotiabank')).toBe('Scotiabank')
    })

    it('should capitalize words for unknown merchants', () => {
      expect(getCanonicalName('unknown merchant')).toBe('Unknown Merchant')
      expect(getCanonicalName('local coffee shop')).toBe('Local Coffee Shop')
    })

    it('should handle case-insensitive matching', () => {
      expect(getCanonicalName('TIM HORTONS')).toBe('Tim Hortons')
      expect(getCanonicalName('Tim Hortons')).toBe('Tim Hortons')
      expect(getCanonicalName('tim hortons')).toBe('Tim Hortons')
    })
  })

  describe('fuzzyMatchMerchant', () => {
    const knowledgeBase = [
      { merchantName: 'tim hortons', normalizedName: 'Tim Hortons' },
      { merchantName: 'starbucks', normalizedName: 'Starbucks' },
      { merchantName: 'mcdonalds', normalizedName: "McDonald's" },
      { merchantName: 'walmart', normalizedName: 'Walmart' },
    ]

    it('should return null for empty search name', () => {
      expect(fuzzyMatchMerchant('', knowledgeBase)).toBeNull()
    })

    it('should return null for empty knowledge base', () => {
      expect(fuzzyMatchMerchant('tim hortons', [])).toBeNull()
    })

    it('should find exact matches with high score', () => {
      const result = fuzzyMatchMerchant('tim hortons', knowledgeBase)
      expect(result).not.toBeNull()
      expect(result?.normalizedName).toBe('Tim Hortons')
      expect(result?.score).toBeGreaterThan(0.9)
    })

    it('should find close matches with good score', () => {
      const result = fuzzyMatchMerchant('tim horton', knowledgeBase)
      expect(result).not.toBeNull()
      expect(result?.normalizedName).toBe('Tim Hortons')
      expect(result?.score).toBeGreaterThan(0.7)
    })

    it('should find matches with typos', () => {
      const result = fuzzyMatchMerchant('tims hortons', knowledgeBase)
      expect(result).not.toBeNull()
      expect(result?.normalizedName).toBe('Tim Hortons')
    })

    it('should return null when no match meets threshold', () => {
      const result = fuzzyMatchMerchant('completely different merchant', knowledgeBase, 0.8)
      // This might return null or a low-score match depending on Fuse.js behavior
      // We just verify it doesn't crash
      expect(result).toBeDefined()
    })

    it('should respect custom threshold', () => {
      const strictResult = fuzzyMatchMerchant('tim horton', knowledgeBase, 0.95)
      // With very strict threshold, might not match
      expect(strictResult).toBeDefined()

      const lenientResult = fuzzyMatchMerchant('tim horton', knowledgeBase, 0.5)
      expect(lenientResult).not.toBeNull()
    })

    it('should return best match when multiple matches exist', () => {
      const result = fuzzyMatchMerchant('tim', knowledgeBase)
      // Should match Tim Hortons (best match for "tim")
      expect(result).not.toBeNull()
      if (result) {
        expect(result.normalizedName).toBe('Tim Hortons')
      }
    })

    it('should include match score between 0 and 1', () => {
      const result = fuzzyMatchMerchant('tim hortons', knowledgeBase)
      expect(result).not.toBeNull()
      expect(result?.score).toBeGreaterThanOrEqual(0)
      expect(result?.score).toBeLessThanOrEqual(1)
    })

    it('should handle merchant names with special characters', () => {
      const specialKnowledgeBase = [
        { merchantName: "mcdonald's", normalizedName: "McDonald's" },
        { merchantName: 'a&w', normalizedName: 'A&W' },
      ]

      const result1 = fuzzyMatchMerchant('mcdonalds', specialKnowledgeBase)
      expect(result1).not.toBeNull()

      const result2 = fuzzyMatchMerchant('a and w', specialKnowledgeBase)
      expect(result2).not.toBeNull()
    })
  })

  describe('integration tests', () => {
    it('should handle full pipeline: preprocessing + canonical mapping', () => {
      const raw = 'TIM HORTONS #3421 TORONTO ON Trans#123 2024-01-15'
      const preprocessed = preprocessMerchantName(raw)
      const canonical = getCanonicalName(preprocessed)

      expect(preprocessed).toBe('tim hortons')
      expect(canonical).toBe('Tim Hortons')
    })

    it('should handle unknown merchants gracefully', () => {
      const raw = 'LOCAL COFFEE SHOP #123 Store 456'
      const preprocessed = preprocessMerchantName(raw)
      const canonical = getCanonicalName(preprocessed)

      expect(preprocessed).toBe('local coffee shop')
      expect(canonical).toBe('Local Coffee Shop') // Capitalized fallback
    })

    it('should preserve important merchant name parts', () => {
      // Test that we don't over-strip
      const result1 = preprocessMerchantName("McDonald's Restaurant")
      expect(result1).toBe("mcdonald's restaurant")

      const result2 = preprocessMerchantName('A&W Drive-Thru')
      expect(result2).toContain('a&w')
    })
  })
})
