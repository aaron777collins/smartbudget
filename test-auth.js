const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to signin page...');
    await page.goto('http://localhost:3002/auth/signin', { waitUntil: 'networkidle' });

    console.log('2. Checking for Username field...');
    const usernameLabel = await page.locator('label:has-text("Username")').count();
    if (usernameLabel > 0) {
      console.log('✓ Username label found (not Email)');
    } else {
      console.log('✗ Username label NOT found');
      await page.screenshot({ path: '/tmp/signin-page.png' });
      process.exit(1);
    }

    const usernameInput = await page.locator('input[id="username"], input[placeholder*="username"]').count();
    if (usernameInput > 0) {
      console.log('✓ Username input field found');
    } else {
      console.log('✗ Username input field NOT found');
      process.exit(1);
    }

    console.log('3. Testing login with aaron7c...');
    await page.fill('input[id="username"], input[placeholder*="username"]', 'aaron7c');
    await page.fill('input[type="password"]', 'KingOfKings12345!');

    console.log('4. Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for navigation or error message
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('5. Current URL after login:', currentUrl);

    if (currentUrl.includes('/dashboard')) {
      console.log('✓ Successfully redirected to dashboard');
      console.log('✓ Authentication flow PASSED');

      // Check if dashboard loaded properly
      const dashboardContent = await page.content();
      if (dashboardContent.includes('Dashboard') || dashboardContent.includes('Welcome')) {
        console.log('✓ Dashboard content loaded');
      }
    } else if (currentUrl.includes('/signin')) {
      console.log('✗ Still on signin page - checking for errors...');
      const errorMessage = await page.locator('text=/error|invalid|failed/i').count();
      if (errorMessage > 0) {
        const error = await page.locator('text=/error|invalid|failed/i').first().textContent();
        console.log('Error message:', error);
      }
      await page.screenshot({ path: '/tmp/signin-failed.png' });
      process.exit(1);
    } else {
      console.log('Redirected to:', currentUrl);
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
