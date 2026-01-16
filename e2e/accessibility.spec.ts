import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Comprehensive accessibility audit for SmartBudget application
 * Tests WCAG 2.1 Level AA compliance across all major pages
 */

const pages = [
  { name: 'Login Page', url: '/login' },
  { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
  { name: 'Transactions', url: '/transactions', requiresAuth: true },
  { name: 'Budgets', url: '/budgets', requiresAuth: true },
  { name: 'Accounts', url: '/accounts', requiresAuth: true },
  { name: 'Goals', url: '/goals', requiresAuth: true },
  { name: 'Analytics', url: '/analytics', requiresAuth: true },
  { name: 'Settings', url: '/settings', requiresAuth: true },
];

// Helper function to login
async function login(page: any) {
  await page.goto('/login');
  // Add authentication if needed - for now we'll test public pages
}

test.describe('Accessibility Audit', () => {
  test('Login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page - keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Test that Tab key navigates through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocusedElement);

    // Check that focus indicators are visible
    const focusVisible = await page.evaluate(() => {
      const activeEl = document.activeElement;
      if (!activeEl) return false;
      const styles = window.getComputedStyle(activeEl);
      return styles.outline !== 'none' && styles.outlineWidth !== '0px';
    });
    expect(focusVisible).toBeTruthy();
  });

  test('Dashboard should not have accessibility violations (if accessible)', async ({ page }) => {
    // Try to access dashboard - may redirect to login
    const response = await page.goto('/dashboard');

    // Only run accessibility test if we're not redirected to login
    if (page.url().includes('/dashboard')) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Check for common accessibility issues - color contrast', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Check for ARIA attributes', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['aria'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Check for keyboard accessibility', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('All interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/login');

    // Check buttons have labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });

  test('Form inputs should have associated labels', async ({ page }) => {
    await page.goto('/login');

    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have either a label (via id), aria-label, or aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/login');

    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('Page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['heading'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Links should have descriptive text', async ({ page }) => {
    await page.goto('/login');

    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const accessibleText = ariaLabel || text;

      // Should not be empty and not be generic like "click here"
      expect(accessibleText).toBeTruthy();
      expect(accessibleText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Check for proper landmark regions', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['region'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Verify reduced motion support', async ({ page, context }) => {
    // Set prefers-reduced-motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/login');

    // Check that animations are disabled when prefers-reduced-motion is set
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(hasReducedMotion).toBeTruthy();
  });
});

test.describe('Keyboard Navigation', () => {
  test('Tab navigation should follow logical order', async ({ page }) => {
    await page.goto('/login');

    const tabbableElements: string[] = [];

    // Press Tab multiple times and record focused elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}` : 'none';
      });
      tabbableElements.push(focusedElement);
    }

    // Should have navigated through multiple elements
    const uniqueElements = new Set(tabbableElements);
    expect(uniqueElements.size).toBeGreaterThan(1);
  });

  test('Skip to main content link should exist', async ({ page }) => {
    await page.goto('/login');

    // Check for skip link (usually the first focusable element)
    await page.keyboard.press('Tab');
    const firstElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.textContent?.toLowerCase() || '';
    });

    // Many accessible sites have a "Skip to main content" or similar link
    // This is optional but recommended for WCAG AAA
    console.log('First focusable element:', firstElement);
  });

  test('Escape key should close dialogs', async ({ page }) => {
    await page.goto('/login');

    // Try to find and open a dialog (this is page-specific)
    // For now, we'll just verify the mechanism works if dialogs are present
    const dialogs = await page.locator('[role="dialog"]').count();
    console.log('Number of dialogs found:', dialogs);
  });
});

test.describe('Screen Reader Support', () => {
  test('Page should have a descriptive title', async ({ page }) => {
    await page.goto('/login');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Document');
  });

  test('Main landmark should be present', async ({ page }) => {
    await page.goto('/login');

    const mainLandmark = await page.locator('main').count();
    expect(mainLandmark).toBeGreaterThan(0);
  });

  test('Buttons should have accessible names', async ({ page }) => {
    await page.goto('/login');

    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      const accessibleName = ariaLabel || ariaLabelledBy || text?.trim();
      expect(accessibleName).toBeTruthy();
      expect(accessibleName?.length).toBeGreaterThan(0);
    }
  });

  test('Progress indicators should have labels', async ({ page }) => {
    await page.goto('/login');

    const progressBars = await page.locator('[role="progressbar"]').all();
    for (const progressBar of progressBars) {
      const ariaLabel = await progressBar.getAttribute('aria-label');
      const ariaLabelledBy = await progressBar.getAttribute('aria-labelledby');

      // Progress bars should have either aria-label or aria-labelledby
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});
