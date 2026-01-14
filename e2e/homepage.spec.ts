import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Check if the page loads
    await expect(page).toHaveTitle(/SmartBudget/)

    // Check for main heading or logo
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // Check for common navigation elements
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })
})
