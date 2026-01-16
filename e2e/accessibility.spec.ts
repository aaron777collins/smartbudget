import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = [
  { name: 'Dashboard', url: '/' },
  { name: 'Transactions', url: '/transactions' },
  { name: 'Accounts', url: '/accounts' },
  { name: 'Goals', url: '/goals' },
  { name: 'Budgets', url: '/budgets' },
  { name: 'Insights', url: '/insights' },
]

test.describe('Accessibility Audit', () => {
  for (const page of pages) {
    test(`${page.name} page should have no accessibility violations`, async ({ page: pw }) => {
      await pw.goto(page.url)

      // Wait for the page to be fully loaded
      await pw.waitForLoadState('networkidle')

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page: pw })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  }

  test('Dashboard should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test tab navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName : null
    })

    // Should have some focusable element
    expect(focusedElement).toBeTruthy()
  })

  test('Theme toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme/i }).first()

    if (await themeToggle.isVisible()) {
      await themeToggle.focus()
      await page.keyboard.press('Enter')
      // Theme should toggle
      await page.waitForTimeout(500)
    }
  })

  test('All images should have alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.filter(img => !img.hasAttribute('alt')).length
    })

    expect(imagesWithoutAlt).toBe(0)
  })

  test('Proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const headings = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      return h.map(heading => heading.tagName)
    })

    // Should have at least one H1
    expect(headings.filter(h => h === 'H1').length).toBeGreaterThan(0)
  })

  test('Forms should have proper labels', async ({ page }) => {
    await page.goto('/transactions')
    await page.waitForLoadState('networkidle')

    // Run specific form accessibility checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('form')
      .analyze()

    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label' || v.id === 'label-title-only'
    )

    expect(labelViolations).toEqual([])
  })

  test('Color contrast should be sufficient', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Run color contrast check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('Links should have discernible text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const linksWithoutText = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'))
      return links.filter(link => !link.textContent?.trim() && !link.getAttribute('aria-label')).length
    })

    expect(linksWithoutText).toBe(0)
  })

  test('Page should have lang attribute', async ({ page }) => {
    await page.goto('/')

    const langAttr = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang')
    })

    expect(langAttr).toBeTruthy()
  })

  test('Dark mode should maintain accessibility', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Toggle dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(500)

    // Run accessibility scan in dark mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
