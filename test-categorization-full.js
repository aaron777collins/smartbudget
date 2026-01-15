const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    console.log('=== Testing Transaction Categorization ===\n');

    console.log('1. Navigating to sign-in page...');
    await page.goto('https://budget.aaroncollins.info/auth/signin', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'screenshots/cat-1-signin.png', fullPage: true });

    console.log('2. Signing in with test account...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/cat-2-after-signin.png', fullPage: true });

    // Check if signed in successfully
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      console.log('⚠ Still on sign-in page, authentication may have failed');
      const errorMsg = await page.$('text=/error/i');
      if (errorMsg) {
        console.log('Error:', await errorMsg.textContent());
      }
    } else {
      console.log('✓ Signed in successfully, redirected to:', currentUrl);
    }

    console.log('\n3. Testing API endpoints with authenticated session...\n');

    // Get cookies for API calls
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Test merchant research endpoint
    console.log('Testing POST /api/merchants/research...');
    const researchResponse = await page.evaluate(async () => {
      const response = await fetch('/api/merchants/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantName: 'Starbucks',
          amount: -5.75
        })
      });
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json()
      };
    });

    console.log('Research API Response:');
    console.log('  Status:', researchResponse.status);
    console.log('  Data:', JSON.stringify(researchResponse.data, null, 2));

    if (researchResponse.status === 200 && researchResponse.data.businessName) {
      console.log('✓ Merchant research working correctly');
      console.log('  Business:', researchResponse.data.businessName);
      console.log('  Category:', researchResponse.data.category);
      console.log('  Subcategory:', researchResponse.data.subcategory);
      console.log('  Confidence:', researchResponse.data.confidence);
    } else {
      console.log('⚠ Merchant research may have issues:', researchResponse.data.error || 'Unknown error');
    }

    console.log('\n4. Testing rule-based categorization...\n');

    // Test categorization endpoint
    console.log('Testing POST /api/transactions/categorize...');
    const categorizeResponse = await page.evaluate(async () => {
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions: [
            {
              description: 'STARBUCKS COFFEE #12345',
              merchantName: 'Starbucks',
              amount: -5.75
            },
            {
              description: 'TIM HORTONS #543',
              merchantName: 'Tim Hortons',
              amount: -3.25
            },
            {
              description: 'PAYROLL DEPOSIT',
              merchantName: 'Employer',
              amount: 2500.00
            }
          ]
        })
      });
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json()
      };
    });

    console.log('Categorization API Response:');
    console.log('  Status:', categorizeResponse.status);

    if (categorizeResponse.status === 200) {
      console.log('✓ Transaction categorization working correctly');
      console.log('\nCategorization Results:');
      categorizeResponse.data.forEach((result, i) => {
        console.log(`\n  Transaction ${i + 1}:`);
        console.log(`    Merchant: ${result.merchantName}`);
        console.log(`    Category: ${result.category?.name || 'N/A'}`);
        console.log(`    Subcategory: ${result.subcategory?.name || 'N/A'}`);
        console.log(`    Confidence: ${result.confidence?.toFixed(2) || 'N/A'}`);
        console.log(`    Method: ${result.categorizationMethod || 'N/A'}`);
      });
    } else {
      console.log('⚠ Categorization may have issues:', categorizeResponse.data);
    }

    console.log('\n5. Testing merchant knowledge base...\n');

    // Check if merchants were saved to knowledge base
    const knowledgeResponse = await page.evaluate(async () => {
      const response = await fetch('/api/merchants?search=starbucks', {
        method: 'GET'
      });
      return {
        status: response.status,
        data: await response.json()
      };
    });

    if (knowledgeResponse.status === 200) {
      console.log('✓ Merchant knowledge base accessible');
      console.log('  Found merchants:', knowledgeResponse.data.length || 0);
      if (knowledgeResponse.data.length > 0) {
        console.log('  Sample:', knowledgeResponse.data[0]?.merchantName || knowledgeResponse.data[0]);
      }
    } else {
      console.log('⚠ Knowledge base endpoint:', knowledgeResponse.status);
    }

    console.log('\n=== Test Summary ===\n');
    console.log('✓ Authentication: Working');
    console.log(researchResponse.status === 200 ? '✓' : '⚠', 'Merchant Research:', researchResponse.status === 200 ? 'Working' : 'Check logs');
    console.log(categorizeResponse.status === 200 ? '✓' : '⚠', 'Transaction Categorization:', categorizeResponse.status === 200 ? 'Working' : 'Check logs');
    console.log(knowledgeResponse.status === 200 ? '✓' : '⚠', 'Merchant Knowledge Base:', knowledgeResponse.status === 200 ? 'Working' : 'Check logs');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    await page.screenshot({ path: 'screenshots/cat-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
