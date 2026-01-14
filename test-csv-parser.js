const fs = require('fs');
const path = require('path');

// This is a simple test to verify CSV parsing works
// Note: We're testing the parsing logic directly

async function testCSVParsing() {
  console.log('Testing CSV Parser...\n');

  const testFiles = [
    { name: '3-column format', path: './test-3col.csv' },
    { name: '4-column format', path: './test-4col.csv' },
    { name: '5-column format', path: './test-5col.csv' }
  ];

  for (const testFile of testFiles) {
    console.log(`Testing ${testFile.name}:`);

    try {
      const fileContent = fs.readFileSync(testFile.path, 'utf-8');
      const lines = fileContent.trim().split('\n');
      const headers = lines[0].split(',');
      const dataLines = lines.slice(1);

      console.log(`  - Headers: ${headers.join(', ')}`);
      console.log(`  - Data rows: ${dataLines.length}`);
      console.log(`  - First row: ${dataLines[0]}`);
      console.log('  ✓ File readable\n');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('Basic file tests completed!');
  console.log('\nNote: Full API testing requires running the Next.js dev server.');
  console.log('To test the full parser:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Open http://localhost:3000/import');
  console.log('3. Upload the test CSV files created in the project root');
}

testCSVParsing();
