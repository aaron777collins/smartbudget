const fs = require('fs');
const path = require('path');

const reportFiles = [
  'dashboard.report.json',
  'transactions.report.json',
  'accounts.report.json',
  'goals.report.json',
  'budgets-analytics.report.json',
  'insights.report.json'
];

const results = [];

reportFiles.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join('lighthouse-reports', file), 'utf8'));
    const pageName = file.replace('.report.json', '');
    
    // Extract relevant metrics
    const audits = data.audits;
    
    // Total JavaScript size
    const totalByteWeight = audits['total-byte-weight'];
    const bootupTime = audits['bootup-time'];
    const mainThreadWorkBreakdown = audits['mainthread-work-breakdown'];
    
    // Network requests
    const networkRequests = audits['network-requests'];
    
    // Calculate total JS transferred
    let totalJSTransferred = 0;
    let totalJSSize = 0;
    
    if (networkRequests && networkRequests.details && networkRequests.details.items) {
      networkRequests.details.items.forEach(item => {
        if (item.resourceType === 'Script') {
          totalJSTransferred += item.transferSize || 0;
          totalJSSize += item.resourceSize || 0;
        }
      });
    }
    
    results.push({
      page: pageName,
      totalJSTransferred: (totalJSTransferred / 1024).toFixed(2) + ' KB',
      totalJSSize: (totalJSSize / 1024).toFixed(2) + ' KB',
      totalTransferSize: totalByteWeight?.displayValue || 'N/A',
      bootupTime: bootupTime?.displayValue || 'N/A'
    });
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

console.log('\n=== BUNDLE SIZE ANALYSIS FROM LIGHTHOUSE ===\n');
console.log('Page | JS Transferred (Compressed) | JS Size (Uncompressed) | Total Page Size | Bootup Time');
console.log('-----|------------------------------|------------------------|-----------------|------------');
results.forEach(r => {
  console.log(`${r.page} | ${r.totalJSTransferred} | ${r.totalJSSize} | ${r.totalTransferSize} | ${r.bootupTime}`);
});
console.log('\n');
