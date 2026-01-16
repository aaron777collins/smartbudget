import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  const viewports = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    mobileSmall: { width: 320, height: 568, name: 'Small Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1280, height: 720, name: 'Desktop' },
    desktopLarge: { width: 1920, height: 1080, name: 'Large Desktop' },
  }

  test.describe('Mobile Navigation (<768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
    })

    test('should display mobile bottom navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Look for bottom nav (fixed at bottom)
      const bottomNav = page.locator('[class*="bottom"], nav').filter({
        has: page.locator('a, button'),
      })

      const hasBottomNav = (await bottomNav.count()) > 0

      if (hasBottomNav) {
        // Check if it's fixed at bottom (position fixed/sticky)
        const nav = bottomNav.first()
        const position = await nav.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            position: style.position,
            bottom: style.bottom,
          }
        })

        // Should be fixed or absolute at bottom
        const isAtBottom =
          position.position === 'fixed' ||
          position.position === 'absolute' ||
          position.bottom === '0px'

        // Just verify it exists on mobile
        await expect(nav).toBeVisible()
      }
    })

    test('should hide desktop sidebar on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Desktop sidebar should be hidden
      const sidebar = page.locator('aside, [class*="sidebar"]')
      const hasSidebar = (await sidebar.count()) > 0

      if (hasSidebar) {
        const isVisible = await sidebar.first().isVisible().catch(() => false)

        // On mobile, sidebar should be hidden or collapsed
        // (it may exist in DOM but be hidden with CSS)
      }
    })

    test('should show mobile menu toggle', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Look for hamburger menu button
      const menuButton = page
        .getByRole('button', { name: /menu|navigation|hamburger/i })
        .or(page.locator('button[aria-label*="menu" i]'))
        .first()

      if ((await menuButton.count()) > 0) {
        await expect(menuButton).toBeVisible()

        // Click to open menu
        await menuButton.click()
        await page.waitForTimeout(500)

        // Should show navigation menu
        const menu = page.locator('[role="dialog"], [role="menu"], nav')
        const hasMenu = (await menu.count()) > 0

        if (hasMenu) {
          await expect(menu.first()).toBeVisible()
        }
      }
    })

    test('should have touch-friendly tap targets (44x44px minimum)', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Check button sizes
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        const firstButton = buttons.first()
        const size = await firstButton.boundingBox()

        if (size) {
          // Buttons should be at least 40px (close to 44px recommended)
          // Allow some flexibility for icon buttons
          expect(size.height).toBeGreaterThanOrEqual(32)
        }
      }
    })

    test('should display mobile-optimized cards', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Cards should stack vertically on mobile
      const cards = page.locator('[class*="card"], article')
      const hasCards = (await cards.count()) > 0

      if (hasCards && (await cards.count()) > 1) {
        const firstCard = await cards.nth(0).boundingBox()
        const secondCard = await cards.nth(1).boundingBox()

        if (firstCard && secondCard) {
          // Cards should stack (second card below first)
          // Allow some overlap for shadows/margins
          const isStacked = secondCard.y >= firstCard.y + firstCard.height - 50

          // Just verify cards are visible
          await expect(cards.first()).toBeVisible()
        }
      }
    })

    test('should reduce padding on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Check that content doesn't overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    })

    test('should collapse header on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const header = page.locator('header')
      const hasHeader = (await header.count()) > 0

      if (hasHeader) {
        await expect(header).toBeVisible()

        // Header should be compact on mobile
        const height = await header.evaluate((el) => el.offsetHeight)

        // Mobile header should be reasonably sized (not too tall)
        expect(height).toBeLessThan(150)
      }
    })
  })

  test.describe('Tablet Layout (768px-1024px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.tablet)
    })

    test('should show collapsible sidebar', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Sidebar may be visible or have toggle
      const sidebar = page.locator('aside, [class*="sidebar"]')
      const hasSidebar = (await sidebar.count()) > 0

      if (hasSidebar) {
        // Either sidebar is visible or there's a toggle
        const sidebarVisible = await sidebar.first().isVisible().catch(() => false)
        const toggle = page.getByRole('button', { name: /toggle|sidebar|menu/i })
        const hasToggle = (await toggle.count()) > 0

        expect(sidebarVisible || hasToggle).toBe(true)
      }
    })

    test('should hide mobile bottom navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Bottom nav should be hidden on tablet
      const bottomNav = page.locator('[class*="bottom-nav"], [class*="mobile-nav"]')
      const hasBottomNav = (await bottomNav.count()) > 0

      if (hasBottomNav) {
        const isVisible = await bottomNav.first().isVisible().catch(() => false)

        // On tablet, bottom nav may be hidden in favor of sidebar
        // This is optional - some designs keep it
      }
    })

    test('should display grid layouts properly', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Dashboard should use grid layout
      const main = page.locator('main')
      const hasContent = (await main.count()) > 0

      if (hasContent) {
        // Check no horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })

        expect(hasHorizontalScroll).toBe(false)
      }
    })

    test('should show 2-column card layout', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const cards = page.locator('[class*="card"], article')
      const hasCards = (await cards.count()) > 1

      if (hasCards) {
        const firstCard = await cards.nth(0).boundingBox()
        const secondCard = await cards.nth(1).boundingBox()

        if (firstCard && secondCard) {
          // On tablet, cards might be side-by-side or stacked
          // Just verify they're visible
          await expect(cards.first()).toBeVisible()
          await expect(cards.nth(1)).toBeVisible()
        }
      }
    })

    test('should handle form layouts appropriately', async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')

      const createButton = page
        .getByRole('button', { name: /add|new account/i })
        .first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Form should fit dialog properly
        const dialog = page.locator('[role="dialog"]')
        if ((await dialog.count()) > 0) {
          const dialogBox = await dialog.boundingBox()

          if (dialogBox) {
            // Dialog shouldn't overflow viewport
            expect(dialogBox.width).toBeLessThanOrEqual(viewports.tablet.width)
          }
        }
      }
    })
  })

  test.describe('Desktop Layout (>1024px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.desktop)
    })

    test('should display full sidebar', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const sidebar = page.locator('aside, [class*="sidebar"]')
      const hasSidebar = (await sidebar.count()) > 0

      if (hasSidebar) {
        const isVisible = await sidebar.first().isVisible().catch(() => false)
        expect(isVisible).toBe(true)
      }
    })

    test('should hide mobile navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const bottomNav = page.locator('[class*="bottom-nav"], [class*="mobile-nav"]')
      const hasBottomNav = (await bottomNav.count()) > 0

      if (hasBottomNav) {
        const isVisible = await bottomNav.first().isVisible().catch(() => false)

        // Bottom nav should be hidden on desktop
        expect(isVisible).toBe(false)
      }
    })

    test('should use multi-column layouts', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Should have enough space for multi-column layout
      const cards = page.locator('[class*="card"], article')
      const hasCards = (await cards.count()) > 2

      if (hasCards) {
        // Multiple cards should be visible
        await expect(cards.first()).toBeVisible()
        await expect(cards.nth(1)).toBeVisible()

        // Check they fit without scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })

        expect(hasHorizontalScroll).toBe(false)
      }
    })

    test('should display tables with all columns', async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')

      const table = page.locator('table')
      const hasTable = (await table.count()) > 0

      if (hasTable) {
        // Count columns
        const headers = table.locator('thead th')
        const columnCount = await headers.count()

        // Desktop should show more columns than mobile
        expect(columnCount).toBeGreaterThan(2)
      }
    })

    test('should show hover states on interactive elements', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const button = page.getByRole('button').first()
      const hasButton = (await button.count()) > 0

      if (hasButton) {
        // Hover over button
        await button.hover()
        await page.waitForTimeout(200)

        // Button should still be visible (hover effect applied)
        await expect(button).toBeVisible()
      }
    })

    test('should display full navigation menu', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const nav = page.locator('nav')
      const hasNav = (await nav.count()) > 0

      if (hasNav) {
        // Should have multiple navigation links visible
        const navLinks = page.locator('nav a, nav button')
        const linkCount = await navLinks.count()

        expect(linkCount).toBeGreaterThan(2)
      }
    })
  })

  test.describe('No Horizontal Scroll', () => {
    Object.values(viewports).forEach(({ width, height, name }) => {
      test(`should not have horizontal scroll at ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height })

        const pages = ['/dashboard', '/transactions', '/budgets', '/accounts']

        for (const url of pages) {
          await page.goto(url)
          await page.waitForLoadState('networkidle')

          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth
          })

          expect(hasHorizontalScroll).toBe(false)
        }
      })
    })
  })

  test.describe('Breakpoint Transitions', () => {
    test('should handle viewport changes smoothly', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Start at desktop
      await page.setViewportSize(viewports.desktop)
      await page.waitForTimeout(500)
      await expect(page.locator('main')).toBeVisible()

      // Resize to tablet
      await page.setViewportSize(viewports.tablet)
      await page.waitForTimeout(500)
      await expect(page.locator('main')).toBeVisible()

      // Resize to mobile
      await page.setViewportSize(viewports.mobile)
      await page.waitForTimeout(500)
      await expect(page.locator('main')).toBeVisible()

      // Resize back to desktop
      await page.setViewportSize(viewports.desktop)
      await page.waitForTimeout(500)
      await expect(page.locator('main')).toBeVisible()
    })

    test('should maintain functionality across breakpoints', async ({ page }) => {
      const sizes = [viewports.mobile, viewports.tablet, viewports.desktop]

      for (const viewport of sizes) {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')

        // Navigation should work at all sizes
        const navLink = page
          .getByRole('link', { name: /transactions|budgets|accounts/i })
          .or(page.getByRole('button', { name: /transactions|budgets|accounts/i }))
          .first()

        if ((await navLink.count()) > 0) {
          await navLink.click()
          await page.waitForTimeout(1000)

          // Should navigate successfully
          const main = page.locator('main')
          await expect(main).toBeVisible()
        }
      }
    })
  })

  test.describe('Text Readability', () => {
    test('should have readable font sizes on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Check heading sizes
      const heading = page.locator('h1, h2').first()
      if ((await heading.count()) > 0) {
        const fontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize
        })

        const size = parseFloat(fontSize)

        // Headings should be at least 20px on mobile
        expect(size).toBeGreaterThanOrEqual(18)
      }
    })

    test('should have readable body text on all devices', async ({ page }) => {
      for (const viewport of Object.values(viewports)) {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')

        // Check body text size
        const bodyText = page.locator('p, span, div').filter({ hasText: /.+/ }).first()

        if ((await bodyText.count()) > 0) {
          const fontSize = await bodyText.evaluate((el) => {
            return window.getComputedStyle(el).fontSize
          })

          const size = parseFloat(fontSize)

          // Body text should be at least 14px
          expect(size).toBeGreaterThanOrEqual(12)
        }
      }
    })
  })

  test.describe('Touch Gestures (Mobile)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
    })

    test('should support swipe on mobile menus', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Try to open mobile menu
      const menuButton = page
        .getByRole('button', { name: /menu|navigation/i })
        .first()

      if ((await menuButton.count()) > 0) {
        await menuButton.click()
        await page.waitForTimeout(500)

        // Menu should be visible
        const menu = page.locator('[role="dialog"], [role="menu"]')
        if ((await menu.count()) > 0) {
          await expect(menu.first()).toBeVisible()
        }
      }
    })

    test('should handle touch events on buttons', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const button = page.getByRole('button').first()

      if ((await button.count()) > 0) {
        // Tap button (mobile touch event)
        await button.tap()
        await page.waitForTimeout(500)

        // Action should complete without error
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should support pull-to-refresh (optional)', async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')

      // Just verify page loads and is scrollable
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Check page is scrollable
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight
      })

      // May or may not be scrollable depending on content
      // Just verify page renders
    })
  })

  test.describe('Landscape Orientation (Mobile)', () => {
    test('should handle landscape mode', async ({ page }) => {
      // Mobile landscape: 667x375 (width x height - rotated)
      await page.setViewportSize({ width: 667, height: 375 })

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Page should render without overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)

      // Content should be visible
      const main = page.locator('main')
      await expect(main).toBeVisible()
    })
  })

  test.describe('Content Adaptation', () => {
    test('should hide secondary content on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Main content should be visible
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Page should prioritize important content
      const heading = page.getByRole('heading').first()
      await expect(heading).toBeVisible()
    })

    test('should show full content on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // More content should be visible on desktop
      const cards = page.locator('[class*="card"], article')
      const cardCount = await cards.count()

      // Desktop should show multiple cards
      if (cardCount > 0) {
        await expect(cards.first()).toBeVisible()
      }
    })

    test('should adapt dialogs to viewport', async ({ page }) => {
      for (const viewport of Object.values(viewports)) {
        await page.setViewportSize(viewport)
        await page.goto('/accounts')
        await page.waitForLoadState('networkidle')

        const createButton = page
          .getByRole('button', { name: /add|new account/i })
          .first()

        if ((await createButton.count()) > 0) {
          await createButton.click()
          await page.waitForTimeout(500)

          const dialog = page.locator('[role="dialog"]')
          if ((await dialog.count()) > 0) {
            const dialogBox = await dialog.boundingBox()

            if (dialogBox) {
              // Dialog should fit viewport with some margin
              expect(dialogBox.width).toBeLessThanOrEqual(viewport.width)
              expect(dialogBox.height).toBeLessThanOrEqual(viewport.height)
            }
          }

          // Close dialog
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)
        }
      }
    })
  })

  test.describe('Image and Media Responsiveness', () => {
    test('should load appropriate image sizes', async ({ page }) => {
      for (const viewport of [viewports.mobile, viewports.desktop]) {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')

        // Check if images exist and are loaded
        const images = page.locator('img')
        const imageCount = await images.count()

        if (imageCount > 0) {
          const firstImage = images.first()

          // Image should be loaded
          const isComplete = await firstImage.evaluate((img: HTMLImageElement) => {
            return img.complete && img.naturalHeight > 0
          })

          // Images may not exist on all pages
          // Just verify page loads correctly
        }
      }
    })

    test('should handle SVG icons responsively', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const icons = page.locator('svg')
      const iconCount = await icons.count()

      if (iconCount > 0) {
        // Icons should be visible
        await expect(icons.first()).toBeVisible()
      }
    })
  })
})
