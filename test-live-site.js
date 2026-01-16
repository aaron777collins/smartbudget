const { chromium } = require('playwright');

async function testLiveSite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Testing live site: budget.aaroncollins.info');
    console.log('='.repeat(50));

    // Test 1: Site accessibility
    console.log('\n1. Testing site accessibility...');
    await page.goto('https://budget.aaroncollins.info', { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`   ✓ Site loaded: ${title}`);

    // Test 2: CSS rendering
    console.log('\n2. Testing CSS rendering...');
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => links.length);
    console.log(`   ✓ Stylesheets loaded: ${stylesheets}`);

    const hasTailwind = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="hover:"], [class*="transition"], [class*="bg-"]');
      return elements.length > 0;
    });
    console.log(`   ✓ Tailwind classes present: ${hasTailwind}`);

    // Test 3: Navigation to signin
    console.log('\n3. Testing navigation to signin...');
    await page.goto('https://budget.aaroncollins.info/auth/signin', { waitUntil: 'networkidle' });
    console.log(`   ✓ Signin page loaded`);

    // Test 4: Username field check
    console.log('\n4. Testing username field...');
    const usernameLabel = await page.textContent('label[for="username"]').catch(() => null);
    if (usernameLabel && usernameLabel.includes('Username')) {
      console.log(`   ✓ Username label found: "${usernameLabel}"`);
    } else {
      console.log(`   ✗ Username label not found (found: ${usernameLabel})`);
    }

    const usernameInput = await page.$('input[name="username"], input#username');
    if (usernameInput) {
      console.log(`   ✓ Username input field present`);
    } else {
      console.log(`   ✗ Username input field not found`);
    }

    // Test 5: Login flow
    console.log('\n5. Testing login flow...');
    await page.fill('input[name="username"], input#username', 'aaron7c');
    await page.fill('input[name="password"], input#password', 'KingOfKings12345!');
    console.log(`   ✓ Credentials filled`);

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log(`   ✓ Successfully redirected to dashboard`);
    } else {
      console.log(`   ✗ Not redirected to dashboard (current: ${currentUrl})`);
    }

    // Test 6: Database connection
    console.log('\n6. Testing database connection...');
    await page.waitForTimeout(2000); // Wait for data to load
    const pageContent = await page.textContent('body');
    if (pageContent.includes('Dashboard') || pageContent.includes('SmartBudget')) {
      console.log(`   ✓ Dashboard content loaded`);
    } else {
      console.log(`   ✗ Dashboard content may not have loaded properly`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Live site testing complete!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testLiveSite();
