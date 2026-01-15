const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to transactions page...');
    await page.goto('https://budget.aaroncollins.info/transactions', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'screenshots/categorization-1-transactions-page.png', fullPage: true });
    console.log('✓ Screenshot saved: categorization-1-transactions-page.png');

    // Check if we're redirected to sign-in
    const url = page.url();
    if (url.includes('/auth/signin')) {
      console.log('2. Not authenticated, signing in...');
      
      // Fill in credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
      
      console.log('✓ Signed in successfully');
      
      // Navigate back to transactions page
      await page.goto('https://budget.aaroncollins.info/transactions', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: 'screenshots/categorization-2-after-signin.png', fullPage: true });
    }

    console.log('3. Looking for "Add Transaction" button...');
    
    // Look for various possible button texts/selectors
    const addButtons = [
      'button:has-text("Add Transaction")',
      'button:has-text("New Transaction")',
      'button:has-text("Create Transaction")',
      'a:has-text("Add Transaction")',
      '[data-testid="add-transaction"]',
      'button.add-transaction'
    ];
    
    let addButton = null;
    for (const selector of addButtons) {
      try {
        addButton = await page.waitForSelector(selector, { timeout: 3000 });
        if (addButton) {
          console.log(`✓ Found add transaction button: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!addButton) {
      console.log('⚠ No add transaction button found, checking page content...');
      const content = await page.content();
      console.log('Page title:', await page.title());
      
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'screenshots/categorization-3-page-state.png', fullPage: true });
      
      // Try to find the transaction form or input fields directly
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input fields on page`);
      
      if (inputs.length === 0) {
        console.log('⚠ No input fields found. Page may require account setup first.');
        console.log('Let me check if there are any dialogs or modals...');
        
        const dialogs = await page.$$('[role="dialog"]');
        console.log(`Found ${dialogs.length} dialogs`);
      }
    } else {
      console.log('4. Clicking add transaction button...');
      await addButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/categorization-4-transaction-form.png', fullPage: true });
      
      console.log('5. Filling transaction details...');
      
      // Look for input fields in the form
      const descriptionInput = await page.waitForSelector('input[name="description"], input[placeholder*="description" i], label:has-text("Description") + input', { timeout: 5000 });
      await descriptionInput.fill('Coffee at Starbucks');
      
      const amountInput = await page.waitForSelector('input[name="amount"], input[type="number"], input[placeholder*="amount" i]', { timeout: 5000 });
      await amountInput.fill('-5.00');
      
      // Try to find merchant field
      try {
        const merchantInput = await page.waitForSelector('input[name="merchantName"], input[name="merchant"], input[placeholder*="merchant" i]', { timeout: 3000 });
        await merchantInput.fill('Starbucks');
      } catch (e) {
        console.log('⚠ Merchant field not found or not required');
      }
      
      await page.screenshot({ path: 'screenshots/categorization-5-form-filled.png', fullPage: true });
      
      console.log('6. Looking for auto-categorize or submit button...');
      
      // Look for auto-categorize button
      const autoCategorizeBtn = await page.$('button:has-text("Auto-Categorize"), button:has-text("Categorize")');
      if (autoCategorizeBtn) {
        console.log('✓ Found auto-categorize button, clicking...');
        await autoCategorizeBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/categorization-6-after-autocategorize.png', fullPage: true });
      }
      
      // Look for merchant research button
      const researchBtn = await page.$('button:has-text("Research Merchant"), button:has-text("Research")');
      if (researchBtn) {
        console.log('✓ Found merchant research button, clicking...');
        await researchBtn.click();
        await page.waitForTimeout(3000); // Claude API call takes time
        await page.screenshot({ path: 'screenshots/categorization-7-after-research.png', fullPage: true });
      }
      
      console.log('7. Saving transaction...');
      const saveBtn = await page.waitForSelector('button:has-text("Save"), button:has-text("Create"), button[type="submit"]', { timeout: 5000 });
      await saveBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/categorization-8-after-save.png', fullPage: true });
      
      console.log('✓ Transaction created successfully');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('All screenshots saved to screenshots/ directory');
    
  } catch (error) {
    console.error('Error during test:', error.message);
    await page.screenshot({ path: 'screenshots/categorization-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
