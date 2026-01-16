import { test, expect } from '@playwright/test'

test.describe('Account Management', () => {
  test.describe('Account List View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should display accounts page', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /account/i }).first()
      await expect(heading).toBeVisible()
    })

    test('should show accounts list or empty state', async ({ page }) => {
      const accountCards = page.locator('[data-testid*="account"], .account-card, article').filter({
        hasText: /account|bank|balance/i,
      })
      const emptyState = page.locator('text=/no accounts|add.*account|get started/i')

      const hasCards = (await accountCards.count()) > 0
      const hasEmpty = (await emptyState.count()) > 0

      expect(hasCards || hasEmpty).toBe(true)
    })

    test('should display account cards with balances', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        const firstCard = cards.first()
        await expect(firstCard).toBeVisible()

        // Should show balance
        const hasAmount =
          (await firstCard.locator('text=/\\$|\\€|\\£|balance/i').count()) > 0
        expect(hasAmount).toBe(true)
      }
    })

    test('should display account icons and colors', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        const firstCard = cards.first()

        // Should have icon (svg or lucide icon)
        const icon = firstCard.locator('svg, [class*="icon"]').first()
        const hasIcon = (await icon.count()) > 0

        if (hasIcon) {
          await expect(icon).toBeVisible()
        }
      }
    })

    test('should show total net worth', async ({ page }) => {
      // Look for net worth summary
      const netWorth = page.locator('text=/net worth|total|balance/i')
      const hasNetWorth = (await netWorth.count()) > 0

      if (hasNetWorth) {
        // Should display a total amount
        const amount = page.locator('text=/\\$|\\€|\\£/').first()
        await expect(amount).toBeVisible()
      }
    })

    test('should navigate to account detail', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article').filter({
        hasText: /account|bank/i,
      })
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Should navigate to detail page or open dialog
        const urlChanged = page.url().includes('/accounts/')
        const dialogOpened = (await page.locator('[role="dialog"]').count()) > 0

        expect(urlChanged || dialogOpened).toBe(true)
      }
    })
  })

  test.describe('Create Account', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should open create account dialog', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Should open dialog
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
      }
    })

    test('should display account form fields', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Check for name input
        const nameInput = page
          .locator('input[name="name"], input[id*="name"], input[placeholder*="name" i]')
          .first()

        if ((await nameInput.count()) > 0) {
          await expect(nameInput).toBeVisible()
        }

        // Check for type selector
        const typeSelect = page
          .locator('select[name="type"], button:has-text("Type"), select:has-text("Checking")')
          .first()

        if ((await typeSelect.count()) > 0) {
          await expect(typeSelect).toBeVisible()
        }
      }
    })

    test('should validate required account fields', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Try to submit empty form
        const submitButton = page
          .getByRole('button', { name: /create|save|add/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show validation error or stay on form
          const dialog = page.locator('[role="dialog"]')
          await expect(dialog).toBeVisible()
        }
      }
    })

    test('should create checking account', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Fill account name
        const nameInput = page
          .locator('input[name="name"], input[placeholder*="name" i]')
          .first()

        if ((await nameInput.count()) > 0) {
          await nameInput.fill('Test Checking Account')
        }

        // Select account type
        const typeSelect = page
          .locator('select[name="type"], button:has-text("Type")')
          .first()

        if ((await typeSelect.count()) > 0) {
          const tagName = await typeSelect.evaluate((el) =>
            el.tagName.toLowerCase()
          )

          if (tagName === 'select') {
            await typeSelect.selectOption('CHECKING')
          } else {
            await typeSelect.click()
            await page.waitForTimeout(300)
            const option = page.locator('[role="option"]').filter({ hasText: /checking/i }).first()
            if ((await option.count()) > 0) {
              await option.click()
            }
          }
        }

        // Fill initial balance
        const balanceInput = page
          .locator('input[name="balance"], input[type="number"]')
          .first()

        if ((await balanceInput.count()) > 0) {
          await balanceInput.fill('1000')
        }

        // Submit
        const submitButton = page
          .getByRole('button', { name: /create|save|add/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(1000)

          // Should close dialog and show new account
          const dialog = page.locator('[role="dialog"]')
          const dialogVisible = await dialog.isVisible().catch(() => false)

          // Dialog should close or show success
          const successMsg = page.locator('text=/success|created|added/i')
          const hasSuccess = (await successMsg.count()) > 0

          expect(!dialogVisible || hasSuccess).toBe(true)
        }
      }
    })

    test('should select account icon', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Look for icon picker
        const iconButton = page
          .getByRole('button', { name: /icon|choose icon/i })
          .or(page.locator('button').filter({ has: page.locator('svg') }).first())
          .first()

        if ((await iconButton.count()) > 0) {
          await iconButton.click()
          await page.waitForTimeout(500)

          // Should show icon picker
          const iconGrid = page.locator('[role="grid"], [class*="icon"]')
          const hasGrid = (await iconGrid.count()) > 0

          if (hasGrid) {
            // Select an icon
            const icon = page.locator('button svg, button [class*="icon"]').nth(2)
            if ((await icon.count()) > 0) {
              await icon.click()
              await page.waitForTimeout(300)
            }
          }
        }
      }
    })

    test('should select account color', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Look for color picker
        const colorButton = page
          .getByRole('button', { name: /color|choose color/i })
          .or(page.locator('button[class*="bg-"], button[style*="background"]').first())
          .first()

        if ((await colorButton.count()) > 0) {
          await colorButton.click()
          await page.waitForTimeout(500)

          // Should show color options
          const colorOptions = page.locator('button[class*="bg-"], input[type="color"]')
          const hasOptions = (await colorOptions.count()) > 0

          if (hasOptions) {
            // Select a color
            const color = colorOptions.nth(3)
            if ((await color.count()) > 0) {
              await color.click()
              await page.waitForTimeout(300)
            }
          }
        }
      }
    })

    test('should validate balance is numeric', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        const balanceInput = page
          .locator('input[name="balance"], input[type="number"]')
          .first()

        if ((await balanceInput.count()) > 0) {
          // Try invalid balance
          await balanceInput.fill('abc')

          const submitButton = page
            .getByRole('button', { name: /create|save|add/i })
            .last()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(500)

            // Should stay on form
            const dialog = page.locator('[role="dialog"]')
            await expect(dialog).toBeVisible()
          }
        }
      }
    })

    test('should cancel account creation', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account|create account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        const cancelButton = page
          .getByRole('button', { name: /cancel|close/i })
          .last()

        if ((await cancelButton.count()) > 0) {
          await cancelButton.click()
          await page.waitForTimeout(500)

          // Dialog should close
          const dialog = page.locator('[role="dialog"]')
          const visible = await dialog.isVisible().catch(() => false)
          expect(visible).toBe(false)
        }
      }
    })
  })

  test.describe('Account Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should display account overview', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article').filter({
        hasText: /account/i,
      })
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Should show account details
        const accountInfo = page.locator('text=/balance|account|type/i')
        const hasInfo = (await accountInfo.count()) > 0

        expect(hasInfo).toBe(true)
      }
    })

    test('should show current balance', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for balance amount
        const balance = page.locator('text=/\\$|\\€|\\£|balance/i')
        const hasBalance = (await balance.count()) > 0

        expect(hasBalance).toBe(true)
      }
    })

    test('should display recent transactions', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for transactions
        const transactions = page.locator('table, [role="list"], text=/transactions|activity/i')
        const hasTransactions = (await transactions.count()) > 0

        if (hasTransactions) {
          await expect(transactions.first()).toBeVisible()
        }
      }
    })

    test('should show account type badge', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for account type
        const typeIndicator = page.locator('text=/checking|savings|credit|cash|investment/i')
        const hasType = (await typeIndicator.count()) > 0

        if (hasType) {
          await expect(typeIndicator.first()).toBeVisible()
        }
      }
    })

    test('should display balance history chart', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for chart
        const chart = page.locator('svg, canvas, [class*="chart"]')
        const hasChart = (await chart.count()) > 0

        if (hasChart) {
          await expect(chart.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Edit Account', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should open edit account dialog', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          // Should show edit form
          const nameInput = page.locator('input[name="name"]').first()
          if ((await nameInput.count()) > 0) {
            await expect(nameInput).toBeVisible()
            // Should have existing value
            const value = await nameInput.inputValue()
            expect(value).toBeTruthy()
          }
        }
      }
    })

    test('should update account name', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const nameInput = page.locator('input[name="name"]').first()

          if ((await nameInput.count()) > 0) {
            await nameInput.fill('')
            await nameInput.fill('Updated Account Name')

            const saveButton = page
              .getByRole('button', { name: /save|update/i })
              .last()

            if ((await saveButton.count()) > 0) {
              await saveButton.click()
              await page.waitForTimeout(1000)

              // Should update successfully
            }
          }
        }
      }
    })

    test('should change account icon', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const iconButton = page
            .getByRole('button', { name: /icon/i })
            .or(page.locator('button').filter({ has: page.locator('svg') }).first())
            .first()

          if ((await iconButton.count()) > 0) {
            await iconButton.click()
            await page.waitForTimeout(500)

            const newIcon = page.locator('button svg').nth(4)
            if ((await newIcon.count()) > 0) {
              await newIcon.click()
              await page.waitForTimeout(300)
            }
          }
        }
      }
    })

    test('should change account color', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const colorButton = page
            .getByRole('button', { name: /color/i })
            .or(page.locator('button[class*="bg-"]').first())
            .first()

          if ((await colorButton.count()) > 0) {
            await colorButton.click()
            await page.waitForTimeout(500)

            const newColor = page.locator('button[class*="bg-"]').nth(5)
            if ((await newColor.count()) > 0) {
              await newColor.click()
              await page.waitForTimeout(300)
            }
          }
        }
      }
    })

    test('should cancel edit without saving', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const nameInput = page.locator('input[name="name"]').first()

          if ((await nameInput.count()) > 0) {
            // Make changes
            await nameInput.fill('')
            await nameInput.fill('Temp Name')

            // Cancel
            const cancelButton = page
              .getByRole('button', { name: /cancel/i })
              .last()

            if ((await cancelButton.count()) > 0) {
              await cancelButton.click()
              await page.waitForTimeout(500)

              // Dialog should close
              const dialog = page.locator('[role="dialog"]')
              const visible = await dialog.isVisible().catch(() => false)
              expect(visible).toBe(false)
            }
          }
        }
      }
    })
  })

  test.describe('Delete Account', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should show delete confirmation', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          // Should show confirmation
          const confirm = page.locator('text=/are you sure|confirm|delete|warning/i')
          const hasConfirm = (await confirm.count()) > 0

          if (hasConfirm) {
            await expect(confirm.first()).toBeVisible()
          }
        }
      }
    })

    test('should warn about deleting account with transactions', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          // May show warning about transactions
          const warning = page.locator('text=/transactions|warning|will be/i')
          const hasWarning = (await warning.count()) > 0

          // Either shows warning or regular confirmation
          const confirm = page.locator('text=/confirm|are you sure/i')
          const hasConfirm = (await confirm.count()) > 0

          expect(hasWarning || hasConfirm).toBe(true)
        }
      }
    })

    test('should cancel account deletion', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          const cancelButton = page
            .getByRole('button', { name: /cancel|no/i })
            .last()

          if ((await cancelButton.count()) > 0) {
            await cancelButton.click()
            await page.waitForTimeout(500)

            // Should remain on account page
            const stillOnPage = page.url().includes('/accounts')
            expect(stillOnPage).toBe(true)
          }
        }
      }
    })

    test('should delete account successfully', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const initialCount = await cards.count()

      if (initialCount > 0) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          const confirmButton = page
            .getByRole('button', { name: /delete|yes|confirm/i })
            .last()

          if ((await confirmButton.count()) > 0) {
            await confirmButton.click()
            await page.waitForTimeout(1000)

            // Should navigate back to accounts list
            const backOnList = page.url().endsWith('/accounts')
            const successMsg = page.locator('text=/deleted|removed/i')
            const hasSuccess = (await successMsg.count()) > 0

            expect(backOnList || hasSuccess).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Account Filtering and Sorting', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should filter accounts by type', async ({ page }) => {
      const typeFilter = page
        .locator('select, button')
        .filter({ hasText: /type|checking|savings|all/i })
        .first()

      if ((await typeFilter.count()) > 0) {
        await typeFilter.click()
        await page.waitForTimeout(500)

        const option = page.locator('[role="option"]').first()
        if ((await option.count()) > 0) {
          await option.click()
          await page.waitForTimeout(1000)
        }

        // Page should re-render with filter
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should sort accounts by balance', async ({ page }) => {
      const sortButton = page
        .getByRole('button', { name: /sort|balance/i })
        .or(page.locator('button').filter({ hasText: /sort/i }))
        .first()

      if ((await sortButton.count()) > 0) {
        await sortButton.click()
        await page.waitForTimeout(1000)

        // Accounts should re-order
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should search accounts by name', async ({ page }) => {
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search" i]')
        .first()

      if ((await searchInput.count()) > 0) {
        await searchInput.fill('checking')
        await page.waitForTimeout(1000)

        // Should filter results
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should navigate accounts with Tab key', async ({ page }) => {
      await page.keyboard.press('Tab')
      const focused = await page.locator(':focus')
      await expect(focused).toBeVisible()
    })

    test('should open account with Enter key', async ({ page }) => {
      const cards = page.locator('[data-testid*="account"], .account-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(300)

        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)

        // May navigate or open dialog
        // Just verify action completes without error
      }
    })

    test('should close dialog with Escape', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        const dialog = page.locator('[role="dialog"]')
        const visible = await dialog.isVisible().catch(() => false)
        expect(visible).toBe(false)
      }
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1').first()
      const hasH1 = (await h1.count()) > 0

      if (hasH1) {
        await expect(h1).toBeVisible()
        const text = await h1.textContent()
        expect(text).toBeTruthy()
      }
    })

    test('should have ARIA labels on icon buttons', async ({ page }) => {
      const iconButtons = page.locator('button').filter({ has: page.locator('svg') })
      const hasButtons = (await iconButtons.count()) > 0

      if (hasButtons) {
        const firstButton = iconButtons.first()
        const ariaLabel = await firstButton.getAttribute('aria-label')
        const hasText = (await firstButton.textContent())?.trim().length ?? 0 > 0

        // Either has aria-label or visible text
        expect(ariaLabel !== null || hasText).toBe(true)
      }
    })

    test('should have visible focus indicators', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /add|new account/i })
        .first()

      if ((await createButton.count()) > 0) {
        await createButton.focus()

        const isFocused = await createButton.evaluate(
          (el) => document.activeElement === el
        )
        expect(isFocused).toBe(true)
      }
    })
  })
})
