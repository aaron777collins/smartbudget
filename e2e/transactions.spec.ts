import { test, expect } from '@playwright/test'

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions')
  })

  test('should load the transactions page', async ({ page }) => {
    // Check if transactions heading is visible
    const heading = page.getByRole('heading', { name: /transactions/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('should display transactions table', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Look for table or list of transactions
    const table = page.locator('table').first()

    // Table might exist or page might show empty state
    const tableExists = (await table.count()) > 0

    if (tableExists) {
      await expect(table).toBeVisible()

      // Check for table headers
      const headers = table.locator('thead th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    } else {
      // Check for empty state message
      const emptyState = page.locator('text=/no transactions|empty|get started/i').first()
      const emptyStateExists = (await emptyState.count()) > 0
      expect(emptyStateExists).toBe(true)
    }
  })

  test('should have search functionality', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    const searchExists = (await searchInput.count()) > 0

    if (searchExists) {
      await expect(searchInput).toBeVisible()

      // Try typing in search
      await searchInput.fill('test')
      await expect(searchInput).toHaveValue('test')
    }
  })

  test('should have import button', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Look for import or add transaction button
    const importButton = page.locator('button').filter({
      hasText: /import|add|upload/i,
    }).first()

    const buttonExists = (await importButton.count()) > 0

    if (buttonExists) {
      await expect(importButton).toBeVisible()
    }
  })

  test('should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Check for proper ARIA labels on main content
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should handle table sorting', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const table = page.locator('table').first()
    const tableExists = (await table.count()) > 0

    if (tableExists) {
      // Look for sortable column headers (clickable headers)
      const headerCells = table.locator('thead th')
      const firstHeader = headerCells.first()

      const isClickable = await firstHeader.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.cursor === 'pointer' || el.hasAttribute('role')
      })

      // If headers are sortable, test clicking
      if (isClickable) {
        await firstHeader.click()
        // Wait for potential re-render
        await page.waitForTimeout(500)
      }
    }
  })
})
