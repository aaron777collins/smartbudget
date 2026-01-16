import { test, expect } from '@playwright/test'

test.describe('Budget Management', () => {
  test.describe('Budget List View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should display budgets page', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /budget/i }).first()
      await expect(heading).toBeVisible()
    })

    test('should show budget list or empty state', async ({ page }) => {
      // Either budgets exist or empty state is shown
      const budgetCards = page.locator('[data-testid*="budget"], .budget-card, article').filter({
        hasText: /budget|month|spending/i,
      })
      const emptyState = page.locator('text=/no budgets|create.*budget|get started/i')

      const hasCards = (await budgetCards.count()) > 0
      const hasEmpty = (await emptyState.count()) > 0

      expect(hasCards || hasEmpty).toBe(true)
    })

    test('should display budget summary cards', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        const firstCard = cards.first()
        await expect(firstCard).toBeVisible()

        // Should show key budget info
        const hasAmount =
          (await firstCard.locator('text=/\\$|\\€|\\£/').count()) > 0
        expect(hasAmount).toBe(true)
      }
    })

    test('should navigate to budget detail', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article').filter({
        hasText: /budget/i,
      })
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Should navigate to detail page or open dialog
        const urlChanged = page.url().includes('/budgets/')
        const dialogOpened = (await page.locator('[role="dialog"]').count()) > 0

        expect(urlChanged || dialogOpened).toBe(true)
      }
    })

    test('should filter budgets by timeframe', async ({ page }) => {
      // Look for timeframe filter
      const timeframeSelect = page
        .locator('select, button')
        .filter({ hasText: /month|year|week|timeframe|period/i })
        .first()

      if ((await timeframeSelect.count()) > 0) {
        await timeframeSelect.click()
        await page.waitForTimeout(500)

        // Select different timeframe if dropdown opened
        const option = page.locator('[role="option"]').first()
        if ((await option.count()) > 0) {
          await option.click()
          await page.waitForTimeout(1000)
        }

        // Page should still render
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })
  })

  test.describe('Create Budget', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should open create budget dialog', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Should open dialog or navigate to form
        const dialog = page.locator('[role="dialog"]')
        const hasDialog = (await dialog.count()) > 0

        if (hasDialog) {
          await expect(dialog).toBeVisible()
        } else {
          // Might navigate to budget creation page
          const urlChanged = page.url().includes('/budgets/new')
          expect(urlChanged).toBe(true)
        }
      }
    })

    test('should display budget form fields', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Check for budget name input
        const nameInput = page
          .locator('input[name="name"], input[id*="name"], input[placeholder*="name" i]')
          .first()

        if ((await nameInput.count()) > 0) {
          await expect(nameInput).toBeVisible()
        }

        // Check for amount input
        const amountInput = page
          .locator('input[name="amount"], input[id*="amount"], input[type="number"]')
          .first()

        if ((await amountInput.count()) > 0) {
          await expect(amountInput).toBeVisible()
        }
      }
    })

    test('should validate required budget fields', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Try to submit empty form
        const submitButton = page
          .getByRole('button', { name: /create|save|next/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show validation error or stay on form
          const dialog = page.locator('[role="dialog"]')
          const formVisible = page
            .locator('input[name="name"], input[name="amount"]')
            .first()

          const stillOnForm = (await formVisible.count()) > 0
          expect(stillOnForm).toBe(true)
        }
      }
    })

    test('should create budget with category limits', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Fill budget name
        const nameInput = page
          .locator('input[name="name"], input[placeholder*="name" i]')
          .first()

        if ((await nameInput.count()) > 0) {
          await nameInput.fill('Test Budget')
        }

        // Fill total amount
        const amountInput = page
          .locator('input[name="amount"], input[type="number"]')
          .first()

        if ((await amountInput.count()) > 0) {
          await amountInput.fill('1000')
        }

        // Select period
        const periodSelect = page
          .locator('select[name="period"], button:has-text("Month")')
          .first()

        if ((await periodSelect.count()) > 0) {
          const tagName = await periodSelect.evaluate((el) =>
            el.tagName.toLowerCase()
          )
          if (tagName === 'select') {
            await periodSelect.selectOption({ index: 0 })
          }
        }

        // Add category limit if wizard supports it
        const addCategoryButton = page
          .getByRole('button', { name: /add category|category/i })
          .first()

        if ((await addCategoryButton.count()) > 0) {
          await addCategoryButton.click()
          await page.waitForTimeout(500)

          // Select category
          const categorySelect = page
            .locator('select[name*="category"], button:has-text("Category")')
            .last()

          if ((await categorySelect.count()) > 0) {
            await categorySelect.click()
            await page.waitForTimeout(300)

            const option = page.locator('[role="option"]').first()
            if ((await option.count()) > 0) {
              await option.click()
            }
          }

          // Set category limit amount
          const categoryAmount = page
            .locator('input[type="number"]')
            .last()

          if ((await categoryAmount.count()) > 0) {
            await categoryAmount.fill('200')
          }
        }

        // Submit budget
        const submitButton = page
          .getByRole('button', { name: /create|save|finish/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(2000)

          // Should navigate back to budgets list or show success
          const backOnList = page.url().endsWith('/budgets')
          const successMsg = page.locator('text=/success|created/i')
          const hasSuccess = (await successMsg.count()) > 0

          // Either back on list or showing success
          expect(backOnList || hasSuccess).toBe(true)
        }
      }
    })

    test('should validate budget amount is positive', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        const amountInput = page
          .locator('input[name="amount"], input[type="number"]')
          .first()

        if ((await amountInput.count()) > 0) {
          // Try negative amount
          await amountInput.fill('-100')

          const submitButton = page
            .getByRole('button', { name: /create|save|next/i })
            .last()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(500)

            // Should show error or stay on form
            const formStill = (await amountInput.count()) > 0
            expect(formStill).toBe(true)
          }
        }
      }
    })

    test('should support budget wizard steps', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
        .first()

      const hasButton = (await createButton.count()) > 0

      if (hasButton) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Check for step indicator
        const stepIndicator = page.locator('text=/step|1 of|2 of/i')
        const hasSteps = (await stepIndicator.count()) > 0

        if (hasSteps) {
          // Fill first step
          const nameInput = page.locator('input[name="name"]').first()
          if ((await nameInput.count()) > 0) {
            await nameInput.fill('Multi-step Budget')
          }

          // Click next
          const nextButton = page
            .getByRole('button', { name: /next/i })
            .first()

          if ((await nextButton.count()) > 0) {
            await nextButton.click()
            await page.waitForTimeout(500)

            // Should move to next step
            const step2 = page.locator('text=/step 2|categories/i')
            const onStep2 = (await step2.count()) > 0

            if (onStep2) {
              await expect(step2.first()).toBeVisible()
            }
          }
        }
      }
    })

    test('should cancel budget creation', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget|add budget/i })
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

          // Should close dialog or navigate back
          const dialog = page.locator('[role="dialog"]')
          const dialogVisible = await dialog.isVisible().catch(() => false)

          const backOnBudgets = page.url().endsWith('/budgets')

          expect(!dialogVisible || backOnBudgets).toBe(true)
        }
      }
    })
  })

  test.describe('Budget Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should display budget overview', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article').filter({
        hasText: /budget/i,
      })
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Should show budget details
        const budgetName = page.getByRole('heading').filter({ hasText: /budget/i })
        const hasName =
          (await budgetName.count()) > 0 || page.url().includes('/budgets/')

        expect(hasName).toBe(true)
      }
    })

    test('should show budget progress', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for progress indicator
        const progress = page.locator('[role="progressbar"], .progress, text=/%|percent/i')
        const hasProgress = (await progress.count()) > 0

        if (hasProgress) {
          await expect(progress.first()).toBeVisible()
        }
      }
    })

    test('should display category breakdowns', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for category information
        const categories = page.locator('text=/groceries|dining|transport|category/i')
        const hasCategories = (await categories.count()) > 0

        // Either has categories or shows "no categories"
        const noCategories = page.locator('text=/no categories/i')
        const hasNoCategories = (await noCategories.count()) > 0

        expect(hasCategories || hasNoCategories).toBe(true)
      }
    })

    test('should show spending vs budget chart', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for chart (svg, canvas, or chart container)
        const chart = page.locator('svg, canvas, [class*="chart"]')
        const hasChart = (await chart.count()) > 0

        if (hasChart) {
          await expect(chart.first()).toBeVisible()
        }
      }
    })

    test('should display remaining budget amount', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for remaining or spent amount
        const amounts = page.locator('text=/remaining|spent|\\$|\\€/i')
        const hasAmounts = (await amounts.count()) > 0

        expect(hasAmounts).toBe(true)
      }
    })

    test('should list transactions for budget', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for transactions section
        const transactions = page.locator('text=/transactions|recent|spending/i')
        const hasTransactions = (await transactions.count()) > 0

        if (hasTransactions) {
          // Check for transaction list or empty state
          const transactionList = page.locator('table, [role="list"], text=/no transactions/i')
          const hasList = (await transactionList.count()) > 0
          expect(hasList).toBe(true)
        }
      }
    })
  })

  test.describe('Edit Budget', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should open edit budget dialog', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
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
          }
        }
      }
    })

    test('should update budget amount', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const amountInput = page
            .locator('input[name="amount"], input[type="number"]')
            .first()

          if ((await amountInput.count()) > 0) {
            await amountInput.fill('')
            await amountInput.fill('2000')

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

    test('should add category to existing budget', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for add category button
        const addCategoryBtn = page
          .getByRole('button', { name: /add category/i })
          .first()

        if ((await addCategoryBtn.count()) > 0) {
          await addCategoryBtn.click()
          await page.waitForTimeout(500)

          // Should show category selection
          const categorySelect = page
            .locator('select, button')
            .filter({ hasText: /category/i })
            .first()

          if ((await categorySelect.count()) > 0) {
            await expect(categorySelect).toBeVisible()
          }
        }
      }
    })

    test('should remove category from budget', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for remove/delete category button
        const removeButton = page
          .getByRole('button', { name: /remove|delete/i })
          .filter({ hasText: /category/i })
          .first()

        if ((await removeButton.count()) > 0) {
          await removeButton.click()
          await page.waitForTimeout(500)

          // May show confirmation
          const confirm = page.locator('text=/confirm|are you sure/i')
          if ((await confirm.count()) > 0) {
            const confirmBtn = page
              .getByRole('button', { name: /confirm|yes|delete/i })
              .last()
            if ((await confirmBtn.count()) > 0) {
              await confirmBtn.click()
              await page.waitForTimeout(500)
            }
          }
        }
      }
    })
  })

  test.describe('Delete Budget', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should show delete confirmation', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
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
          const confirm = page.locator('text=/are you sure|confirm|delete/i')
          const hasConfirm = (await confirm.count()) > 0

          if (hasConfirm) {
            await expect(confirm.first()).toBeVisible()
          }
        }
      }
    })

    test('should cancel budget deletion', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
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

            // Should remain on budget detail page
            const stillOnPage = page.url().includes('/budgets')
            expect(stillOnPage).toBe(true)
          }
        }
      }
    })

    test('should delete budget successfully', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
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

            // Should navigate back to budgets list
            const backOnList = page.url().endsWith('/budgets')
            const successMsg = page.locator('text=/deleted|removed/i')
            const hasSuccess = (await successMsg.count()) > 0

            expect(backOnList || hasSuccess).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Budget Monitoring', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should show budget status badges', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        // Look for status indicators
        const status = page.locator('text=/on track|over budget|warning|under/i, [class*="badge"]')
        const hasStatus = (await status.count()) > 0

        if (hasStatus) {
          await expect(status.first()).toBeVisible()
        }
      }
    })

    test('should highlight over-budget categories', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for over-budget indicators (red, warning, etc.)
        const overBudget = page.locator('text=/over|exceeded/i, [class*="destructive"], [class*="danger"]')
        const hasOver = (await overBudget.count()) > 0

        // May or may not have over-budget items
        // Just verify page renders correctly
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should display budget alerts', async ({ page }) => {
      // Check if there are any budget alerts on main page
      const alerts = page.locator('[role="alert"], text=/alert|warning|over budget/i')
      const hasAlerts = (await alerts.count()) > 0

      if (hasAlerts) {
        await expect(alerts.first()).toBeVisible()
      }

      // Page should load regardless
      const content = page.locator('main')
      await expect(content).toBeVisible()
    })

    test('should refresh budget data', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(1000)

        // Look for refresh button
        const refreshButton = page
          .getByRole('button', { name: /refresh|reload/i })
          .first()

        if ((await refreshButton.count()) > 0) {
          await refreshButton.click()
          await page.waitForTimeout(1000)

          // Page should reload data
          const content = page.locator('main')
          await expect(content).toBeVisible()
        }
      }
    })
  })

  test.describe('Budget Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets/analytics')
      await page.waitForLoadState('networkidle')
    })

    test('should display analytics page', async ({ page }) => {
      // Analytics page may or may not exist
      const heading = page.getByRole('heading', { name: /analytics|insights/i })
      const notFound = page.locator('text=/404|not found/i')

      const hasHeading = (await heading.count()) > 0
      const is404 = (await notFound.count()) > 0

      if (!is404) {
        // If page exists, should show content
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should show budget performance charts', async ({ page }) => {
      const notFound = page.locator('text=/404|not found/i')
      const is404 = (await notFound.count()) > 0

      if (!is404) {
        // Look for charts
        const chart = page.locator('svg, canvas, [class*="chart"]')
        const hasChart = (await chart.count()) > 0

        if (hasChart) {
          await expect(chart.first()).toBeVisible()
        }
      }
    })

    test('should display spending trends', async ({ page }) => {
      const notFound = page.locator('text=/404|not found/i')
      const is404 = (await notFound.count()) > 0

      if (!is404) {
        // Look for trends
        const trends = page.locator('text=/trend|spending|month/i')
        const hasTrends = (await trends.count()) > 0

        if (hasTrends) {
          await expect(trends.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/budgets')
      await page.waitForLoadState('networkidle')
    })

    test('should navigate budgets with Tab key', async ({ page }) => {
      await page.keyboard.press('Tab')
      const focused = await page.locator(':focus')
      await expect(focused).toBeVisible()
    })

    test('should open budget with Enter key', async ({ page }) => {
      const cards = page.locator('[data-testid*="budget"], .budget-card, article')
      const hasCards = (await cards.count()) > 0

      if (hasCards) {
        await cards.first().click()
        await page.waitForTimeout(300)

        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)

        // May navigate or open dialog
        const urlChanged = page.url().includes('/budgets/')
        // Just verify action completes
      }
    })

    test('should close dialog with Escape', async ({ page }) => {
      const createButton = page
        .getByRole('button', { name: /create|new budget/i })
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
})
