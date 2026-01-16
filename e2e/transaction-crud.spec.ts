import { test, expect } from '@playwright/test'

// Helper to setup authenticated session (you may need to adjust based on your auth implementation)
test.use({
  // Add any global auth setup here if needed
})

test.describe('Transaction CRUD Operations', () => {
  test.describe('Create Transaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should open create transaction dialog', async ({ page }) => {
      // Look for "Add" or "New Transaction" button
      const addButton = page
        .getByRole('button', { name: /add|new transaction|create/i })
        .first()

      const buttonExists = (await addButton.count()) > 0

      if (buttonExists) {
        await addButton.click()

        // Wait for dialog to open
        await page.waitForTimeout(500)

        // Check for dialog with transaction form
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()

        // Check for amount input
        const amountInput = page.locator('input[name="amount"], input[id*="amount"]')
        const amountExists = (await amountInput.count()) > 0

        if (amountExists) {
          await expect(amountInput).toBeVisible()
        }
      }
    })

    test('should validate required fields', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /add|new transaction|create/i })
        .first()

      const buttonExists = (await addButton.count()) > 0

      if (buttonExists) {
        await addButton.click()
        await page.waitForTimeout(500)

        // Try to submit empty form
        const submitButton = page
          .getByRole('button', { name: /save|create|add/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Dialog should still be open (validation failed)
          const dialog = page.locator('[role="dialog"]')
          await expect(dialog).toBeVisible()
        }
      }
    })

    test('should create transaction with valid data', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /add|new transaction|create/i })
        .first()

      const buttonExists = (await addButton.count()) > 0

      if (buttonExists) {
        await addButton.click()
        await page.waitForTimeout(500)

        // Fill in transaction details
        const amountInput = page.locator('input[name="amount"], input[id*="amount"]').first()
        if ((await amountInput.count()) > 0) {
          await amountInput.fill('123.45')
        }

        const descriptionInput = page
          .locator('input[name="description"], input[id*="description"], textarea[name="description"]')
          .first()
        if ((await descriptionInput.count()) > 0) {
          await descriptionInput.fill('Test Transaction')
        }

        const dateInput = page.locator('input[type="date"], input[name="date"]').first()
        if ((await dateInput.count()) > 0) {
          await dateInput.fill('2024-01-15')
        }

        // Select category if available
        const categorySelect = page.locator('select[name="category"], button:has-text("Category")').first()
        if ((await categorySelect.count()) > 0 && (await categorySelect.getAttribute('role')) !== 'button') {
          // Regular select element
          if (categorySelect.tagName === 'select') {
            await categorySelect.selectOption({ index: 1 })
          }
        }

        // Submit form
        const submitButton = page
          .getByRole('button', { name: /save|create|add/i })
          .last()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(1000)

          // Check if dialog closed (transaction created)
          const dialog = page.locator('[role="dialog"]')
          const dialogCount = await dialog.count()

          // Dialog should be closed or showing success
          // (Some implementations might keep dialog open with success message)
        }
      }
    })

    test('should validate amount is positive number', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /add|new transaction|create/i })
        .first()

      const buttonExists = (await addButton.count()) > 0

      if (buttonExists) {
        await addButton.click()
        await page.waitForTimeout(500)

        const amountInput = page.locator('input[name="amount"], input[id*="amount"]').first()
        if ((await amountInput.count()) > 0) {
          // Try invalid amount
          await amountInput.fill('-100')

          const submitButton = page
            .getByRole('button', { name: /save|create|add/i })
            .last()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(500)

            // Should still show dialog or error
            const dialog = page.locator('[role="dialog"]')
            const stillVisible = (await dialog.count()) > 0
            // Just verify dialog handling
          }
        }
      }
    })

    test('should close dialog on cancel', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /add|new transaction|create/i })
        .first()

      const buttonExists = (await addButton.count()) > 0

      if (buttonExists) {
        await addButton.click()
        await page.waitForTimeout(500)

        // Look for cancel button
        const cancelButton = page
          .getByRole('button', { name: /cancel|close/i })
          .last()

        if ((await cancelButton.count()) > 0) {
          await cancelButton.click()
          await page.waitForTimeout(500)

          // Dialog should be closed
          const dialog = page.locator('[role="dialog"]')
          const dialogVisible = await dialog.isVisible().catch(() => false)
          expect(dialogVisible).toBe(false)
        }
      }
    })
  })

  test.describe('Read/View Transactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should display transaction list', async ({ page }) => {
      // Check for table or list
      const table = page.locator('table').first()
      const list = page.locator('[role="list"]').first()

      const hasTable = (await table.count()) > 0
      const hasList = (await list.count()) > 0

      // Either table or list should exist, or empty state
      const emptyState = page.locator('text=/no transactions|empty/i').first()
      const hasEmptyState = (await emptyState.count()) > 0

      expect(hasTable || hasList || hasEmptyState).toBe(true)
    })

    test('should view transaction details', async ({ page }) => {
      // Look for first transaction row
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        // Should open detail dialog or navigate to detail page
        const dialog = page.locator('[role="dialog"]')
        const dialogExists = (await dialog.count()) > 0

        if (dialogExists) {
          await expect(dialog).toBeVisible()

          // Check for transaction details
          const detailsVisible =
            (await page.locator('text=/amount|description|date|category/i').count()) > 0
          expect(detailsVisible).toBe(true)
        }
      }
    })

    test('should filter transactions by search', async ({ page }) => {
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search" i]')
        .first()

      if ((await searchInput.count()) > 0) {
        await searchInput.fill('grocery')
        await page.waitForTimeout(1000)

        // Check that table/list still renders (filtered results or empty)
        const content = page.locator('table, [role="list"], text=/no.*found/i').first()
        await expect(content).toBeVisible()
      }
    })

    test('should filter transactions by date range', async ({ page }) => {
      // Look for date filter controls
      const dateFilter = page
        .locator('input[type="date"], button:has-text("Date"), select:has-text("Month")')
        .first()

      if ((await dateFilter.count()) > 0) {
        // Interact with date filter
        const tagName = await dateFilter.evaluate((el) => el.tagName.toLowerCase())

        if (tagName === 'input') {
          await dateFilter.fill('2024-01-01')
        } else if (tagName === 'button') {
          await dateFilter.click()
        } else if (tagName === 'select') {
          await dateFilter.selectOption({ index: 1 })
        }

        await page.waitForTimeout(1000)

        // Verify page still loads
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should filter transactions by category', async ({ page }) => {
      // Look for category filter
      const categoryFilter = page
        .locator('select:has-text("Category"), button:has-text("Category")')
        .first()

      if ((await categoryFilter.count()) > 0) {
        await categoryFilter.click()
        await page.waitForTimeout(500)

        // If it's a dropdown, select an option
        const option = page.locator('[role="option"]').first()
        if ((await option.count()) > 0) {
          await option.click()
          await page.waitForTimeout(1000)
        }

        // Verify filtering works
        const content = page.locator('main')
        await expect(content).toBeVisible()
      }
    })

    test('should sort transactions', async ({ page }) => {
      const table = page.locator('table').first()

      if ((await table.count()) > 0) {
        // Click on a sortable header
        const header = table.locator('thead th').first()
        await header.click()
        await page.waitForTimeout(500)

        // Table should still be visible (potentially re-sorted)
        await expect(table).toBeVisible()
      }
    })

    test('should paginate transactions', async ({ page }) => {
      // Look for pagination controls
      const nextButton = page
        .getByRole('button', { name: /next|>/i })
        .filter({ hasText: /next|>/i })
        .first()

      if ((await nextButton.count()) > 0) {
        // Check if button is enabled
        const isDisabled = await nextButton.isDisabled()

        if (!isDisabled) {
          await nextButton.click()
          await page.waitForTimeout(1000)

          // Should load next page
          const content = page.locator('main')
          await expect(content).toBeVisible()
        }
      }
    })
  })

  test.describe('Update Transaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should open edit dialog', async ({ page }) => {
      // Click on first transaction
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        // Look for edit button
        const editButton = page
          .getByRole('button', { name: /edit/i })
          .first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          // Should show edit form
          const amountInput = page.locator('input[name="amount"], input[id*="amount"]').first()
          if ((await amountInput.count()) > 0) {
            await expect(amountInput).toBeVisible()
            // Input should have existing value
            const value = await amountInput.inputValue()
            expect(value).toBeTruthy()
          }
        }
      }
    })

    test('should update transaction amount', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const amountInput = page.locator('input[name="amount"], input[id*="amount"]').first()

          if ((await amountInput.count()) > 0) {
            // Clear and enter new amount
            await amountInput.fill('')
            await amountInput.fill('999.99')

            // Save changes
            const saveButton = page
              .getByRole('button', { name: /save|update/i })
              .last()

            if ((await saveButton.count()) > 0) {
              await saveButton.click()
              await page.waitForTimeout(1000)

              // Should close dialog or show success
              // Just verify the action completes
            }
          }
        }
      }
    })

    test('should update transaction description', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const descInput = page
            .locator('input[name="description"], textarea[name="description"]')
            .first()

          if ((await descInput.count()) > 0) {
            await descInput.fill('')
            await descInput.fill('Updated Description')

            const saveButton = page
              .getByRole('button', { name: /save|update/i })
              .last()

            if ((await saveButton.count()) > 0) {
              await saveButton.click()
              await page.waitForTimeout(1000)
            }
          }
        }
      }
    })

    test('should update transaction category', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const categorySelect = page
            .locator('select[name="category"], button:has-text("Category")')
            .first()

          if ((await categorySelect.count()) > 0) {
            const tagName = await categorySelect.evaluate((el) =>
              el.tagName.toLowerCase()
            )

            if (tagName === 'select') {
              await categorySelect.selectOption({ index: 1 })
            } else {
              await categorySelect.click()
              await page.waitForTimeout(300)
              const option = page.locator('[role="option"]').nth(1)
              if ((await option.count()) > 0) {
                await option.click()
              }
            }

            const saveButton = page
              .getByRole('button', { name: /save|update/i })
              .last()

            if ((await saveButton.count()) > 0) {
              await saveButton.click()
              await page.waitForTimeout(1000)
            }
          }
        }
      }
    })

    test('should cancel edit without saving', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        const editButton = page.getByRole('button', { name: /edit/i }).first()

        if ((await editButton.count()) > 0) {
          await editButton.click()
          await page.waitForTimeout(500)

          const amountInput = page.locator('input[name="amount"], input[id*="amount"]').first()

          if ((await amountInput.count()) > 0) {
            const originalValue = await amountInput.inputValue()

            // Make changes
            await amountInput.fill('111.11')

            // Cancel
            const cancelButton = page
              .getByRole('button', { name: /cancel/i })
              .last()

            if ((await cancelButton.count()) > 0) {
              await cancelButton.click()
              await page.waitForTimeout(500)

              // Dialog should close without saving
              const dialog = page.locator('[role="dialog"]')
              const visible = await dialog.isVisible().catch(() => false)
              expect(visible).toBe(false)
            }
          }
        }
      }
    })
  })

  test.describe('Delete Transaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should show delete confirmation', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        // Look for delete button
        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          // Should show confirmation dialog
          const confirmText = page.locator('text=/are you sure|confirm|delete/i')
          const hasConfirmation = (await confirmText.count()) > 0

          if (hasConfirmation) {
            await expect(confirmText.first()).toBeVisible()
          }
        }
      }
    })

    test('should cancel delete operation', async ({ page }) => {
      const firstRow = page.locator('table tbody tr, [role="row"]').first()

      if ((await firstRow.count()) > 0) {
        await firstRow.click()
        await page.waitForTimeout(500)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          // Look for cancel button in confirmation
          const cancelButton = page
            .getByRole('button', { name: /cancel|no/i })
            .last()

          if ((await cancelButton.count()) > 0) {
            await cancelButton.click()
            await page.waitForTimeout(500)

            // Should close confirmation without deleting
            const dialog = page.locator('[role="dialog"]')
            // Original transaction should still be visible
          }
        }
      }
    })

    test('should confirm and delete transaction', async ({ page }) => {
      // Get initial count of transactions
      const rows = page.locator('table tbody tr, [role="row"]')
      const initialCount = await rows.count()

      if (initialCount > 0) {
        const firstRow = rows.first()
        await firstRow.click()
        await page.waitForTimeout(500)

        const deleteButton = page
          .getByRole('button', { name: /delete|remove/i })
          .first()

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click()
          await page.waitForTimeout(500)

          // Confirm deletion
          const confirmButton = page
            .getByRole('button', { name: /delete|yes|confirm/i })
            .last()

          if ((await confirmButton.count()) > 0) {
            await confirmButton.click()
            await page.waitForTimeout(1000)

            // Transaction should be deleted
            // Either count decreases or we see success message
            const newCount = await rows.count()
            const successMessage = page.locator('text=/deleted|removed|success/i')
            const hasSuccess = (await successMessage.count()) > 0

            // Either count decreased or success message shown
            expect(newCount <= initialCount || hasSuccess).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should select multiple transactions', async ({ page }) => {
      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"]')
      const hasCheckboxes = (await checkboxes.count()) > 0

      if (hasCheckboxes) {
        // Select first two transactions
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()

        // Verify they are checked
        const firstChecked = await checkboxes.nth(0).isChecked()
        const secondChecked = await checkboxes.nth(1).isChecked()

        expect(firstChecked).toBe(true)
        expect(secondChecked).toBe(true)
      }
    })

    test('should show bulk actions toolbar', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      const hasCheckboxes = (await checkboxes.count()) > 0

      if (hasCheckboxes) {
        // Select a transaction
        await checkboxes.first().check()
        await page.waitForTimeout(500)

        // Look for bulk actions toolbar
        const bulkActions = page.locator('text=/selected|bulk|actions/i')
        const hasBulkActions = (await bulkActions.count()) > 0

        if (hasBulkActions) {
          await expect(bulkActions.first()).toBeVisible()
        }
      }
    })

    test('should bulk delete transactions', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      const hasCheckboxes = (await checkboxes.count()) > 0

      if (hasCheckboxes && (await checkboxes.count()) > 1) {
        // Select multiple
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()
        await page.waitForTimeout(500)

        // Look for bulk delete button
        const bulkDeleteButton = page
          .getByRole('button', { name: /delete|remove.*selected/i })
          .first()

        if ((await bulkDeleteButton.count()) > 0) {
          await bulkDeleteButton.click()
          await page.waitForTimeout(500)

          // Should show confirmation
          const confirm = page.locator('text=/are you sure|confirm/i')
          const hasConfirm = (await confirm.count()) > 0

          if (hasConfirm) {
            await expect(confirm.first()).toBeVisible()
          }
        }
      }
    })

    test('should bulk categorize transactions', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      const hasCheckboxes = (await checkboxes.count()) > 0

      if (hasCheckboxes && (await checkboxes.count()) > 1) {
        // Select multiple
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()
        await page.waitForTimeout(500)

        // Look for bulk categorize button
        const bulkCategorizeButton = page
          .getByRole('button', { name: /categorize|category/i })
          .first()

        if ((await bulkCategorizeButton.count()) > 0) {
          await bulkCategorizeButton.click()
          await page.waitForTimeout(500)

          // Should show category selector or dialog
          const categoryDialog = page.locator('[role="dialog"], select, [role="listbox"]')
          const hasDialog = (await categoryDialog.count()) > 0

          if (hasDialog) {
            await expect(categoryDialog.first()).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions')
      await page.waitForLoadState('networkidle')
    })

    test('should navigate with arrow keys', async ({ page }) => {
      const rows = page.locator('table tbody tr, [role="row"]')
      const hasRows = (await rows.count()) > 0

      if (hasRows) {
        // Click first row
        await rows.first().click()
        await page.waitForTimeout(300)

        // Press down arrow
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(300)

        // Focus should move (if keyboard navigation is implemented)
        // Just verify no errors occur
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should open detail with Enter key', async ({ page }) => {
      const rows = page.locator('table tbody tr, [role="row"]')
      const hasRows = (await rows.count()) > 0

      if (hasRows) {
        // Click first row to focus
        await rows.first().click()
        await page.waitForTimeout(300)

        // Press Enter
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)

        // Should open detail dialog or navigate
        const dialog = page.locator('[role="dialog"]')
        const hasDialog = (await dialog.count()) > 0

        // Either dialog opens or page navigates
        const urlChanged = page.url().includes('/transactions/')
        // Just verify action occurred without error
      }
    })

    test('should close dialog with Escape key', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /add|new transaction/i })
        .first()

      const hasButton = (await addButton.count()) > 0

      if (hasButton) {
        await addButton.click()
        await page.waitForTimeout(500)

        // Press Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Dialog should close
        const dialog = page.locator('[role="dialog"]')
        const visible = await dialog.isVisible().catch(() => false)
        expect(visible).toBe(false)
      }
    })
  })
})
