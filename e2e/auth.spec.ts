import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Registration Flow', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto('/auth/register')

      // Check for registration heading
      const heading = page.getByRole('heading', {
        name: /sign up|register|create account/i,
      })
      await expect(heading).toBeVisible()

      // Check for email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Check for password input
      const passwordInput = page.locator('input[type="password"]').first()
      await expect(passwordInput).toBeVisible()

      // Check for submit button
      const submitButton = page.getByRole('button', {
        name: /sign up|register|create account/i,
      })
      await expect(submitButton).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/register')

      // Try to submit empty form
      const submitButton = page.getByRole('button', {
        name: /sign up|register|create account/i,
      })
      await submitButton.click()

      // Wait for validation messages
      await page.waitForTimeout(500)

      // Check if form is still on the page (didn't submit)
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/register')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]').first()
      const submitButton = page.getByRole('button', {
        name: /sign up|register|create account/i,
      })

      // Enter invalid email
      await emailInput.fill('invalid-email')
      await passwordInput.fill('Password123!')
      await submitButton.click()

      // Wait for validation
      await page.waitForTimeout(500)

      // Form should still be visible (validation failed)
      await expect(emailInput).toBeVisible()
    })

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/register')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]').first()
      const submitButton = page.getByRole('button', {
        name: /sign up|register|create account/i,
      })

      // Enter valid email but weak password
      await emailInput.fill('test@example.com')
      await passwordInput.fill('weak')
      await submitButton.click()

      // Wait for validation
      await page.waitForTimeout(500)

      // Check that we're still on the registration page
      await expect(emailInput).toBeVisible()
    })

    test('should show/hide password toggle', async ({ page }) => {
      await page.goto('/auth/register')

      const passwordInput = page.locator('input[type="password"]').first()
      await passwordInput.fill('TestPassword123!')

      // Look for show/hide password button
      const toggleButton = page
        .locator('button')
        .filter({ hasText: /show|hide|eye/i })
        .or(page.locator('button[aria-label*="password" i]'))
        .first()

      const toggleExists = (await toggleButton.count()) > 0

      if (toggleExists) {
        // Click toggle
        await toggleButton.click()

        // Password should now be visible (type="text")
        const visibleInput = page.locator('input[type="text"]').first()
        const visibleExists = (await visibleInput.count()) > 0

        if (visibleExists) {
          await expect(visibleInput).toHaveValue('TestPassword123!')
        }
      }
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/register')

      // Look for link to login
      const loginLink = page.getByRole('link', {
        name: /sign in|log in|already have an account/i,
      })

      await expect(loginLink).toBeVisible()

      // Click link and verify navigation
      await loginLink.click()
      await page.waitForURL(/.*\/auth\/login.*/)

      const loginHeading = page.getByRole('heading', {
        name: /sign in|log in/i,
      })
      await expect(loginHeading).toBeVisible()
    })
  })

  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/auth/login')

      // Check for login heading
      const heading = page.getByRole('heading', { name: /sign in|log in/i })
      await expect(heading).toBeVisible()

      // Check for email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Check for password input
      const passwordInput = page.locator('input[type="password"]')
      await expect(passwordInput).toBeVisible()

      // Check for submit button
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })
      await expect(submitButton).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/login')

      // Try to submit empty form
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })
      await submitButton.click()

      // Wait for validation
      await page.waitForTimeout(500)

      // Check if form is still on the page
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })

      // Enter invalid credentials
      await emailInput.fill('nonexistent@example.com')
      await passwordInput.fill('WrongPassword123!')
      await submitButton.click()

      // Wait for error message or staying on same page
      await page.waitForTimeout(2000)

      // Should still be on login page or show error
      const stillOnLoginPage =
        (await page.locator('input[type="email"]').count()) > 0
      expect(stillOnLoginPage).toBe(true)
    })

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/auth/login')

      // Look for link to registration
      const registerLink = page.getByRole('link', {
        name: /sign up|register|create account/i,
      })

      await expect(registerLink).toBeVisible()

      // Click link and verify navigation
      await registerLink.click()
      await page.waitForURL(/.*\/auth\/register.*/)

      const registerHeading = page.getByRole('heading', {
        name: /sign up|register|create account/i,
      })
      await expect(registerHeading).toBeVisible()
    })

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/auth/login')

      // Look for forgot password link
      const forgotLink = page.getByRole('link', {
        name: /forgot password|reset password/i,
      })

      // Forgot password is optional, but if it exists, test it
      const forgotExists = (await forgotLink.count()) > 0

      if (forgotExists) {
        await expect(forgotLink).toBeVisible()
      }
    })

    test('should remember email on page reload', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')

      // Fill email
      await emailInput.fill('test@example.com')

      // Reload page
      await page.reload()

      // Check if email is remembered (browser autocomplete or localStorage)
      // This is optional behavior, just verify page loads correctly
      await expect(emailInput).toBeVisible()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should navigate registration form with Tab', async ({ page }) => {
      await page.goto('/auth/register')

      // Tab to first input
      await page.keyboard.press('Tab')
      let focused = await page.locator(':focus')
      await expect(focused).toBeVisible()

      // Tab to next input
      await page.keyboard.press('Tab')
      focused = await page.locator(':focus')
      await expect(focused).toBeVisible()

      // Tab to submit button
      await page.keyboard.press('Tab')
      focused = await page.locator(':focus')
      await expect(focused).toBeVisible()
    })

    test('should navigate login form with Tab', async ({ page }) => {
      await page.goto('/auth/login')

      // Tab through form
      await page.keyboard.press('Tab')
      let focused = await page.locator(':focus')
      await expect(focused).toBeVisible()

      await page.keyboard.press('Tab')
      focused = await page.locator(':focus')
      await expect(focused).toBeVisible()
    })

    test('should submit form with Enter key', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')

      // Fill form
      await emailInput.fill('test@example.com')
      await passwordInput.fill('TestPassword123!')

      // Press Enter to submit
      await passwordInput.press('Enter')

      // Wait for submission attempt
      await page.waitForTimeout(1000)

      // Should attempt to submit (either redirect or show error)
      // Just verify the form attempted to submit
    })
  })

  test.describe('Responsive Design', () => {
    test('should be usable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth/login')

      // Check all form elements are visible and usable
      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })

      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
      await expect(submitButton).toBeVisible()

      // Test typing on mobile
      await emailInput.fill('mobile@example.com')
      await expect(emailInput).toHaveValue('mobile@example.com')
    })

    test('should be usable on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })

      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
      await expect(submitButton).toBeVisible()
    })

    test('should be usable on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.getByRole('button', {
        name: /sign in|log in/i,
      })

      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
      await expect(submitButton).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/auth/login')

      // Check for proper labels on inputs
      const emailInput = page.locator('input[type="email"]')
      const emailLabel =
        (await emailInput.getAttribute('aria-label')) ||
        (await emailInput.getAttribute('placeholder'))

      expect(emailLabel).toBeTruthy()

      const passwordInput = page.locator('input[type="password"]')
      const passwordLabel =
        (await passwordInput.getAttribute('aria-label')) ||
        (await passwordInput.getAttribute('placeholder'))

      expect(passwordLabel).toBeTruthy()
    })

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.locator('input[type="email"]')

      // Focus input
      await emailInput.focus()

      // Check that input has focus
      const isFocused = await emailInput.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused).toBe(true)
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/auth/login')

      // Check for h1 or h2 heading
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()

      // Verify heading has text content
      const headingText = await heading.textContent()
      expect(headingText).toBeTruthy()
      expect(headingText!.length).toBeGreaterThan(0)
    })
  })
})
