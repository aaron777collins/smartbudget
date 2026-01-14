const fs = require('fs');
const Ofx = require('node-ofx-parser');

// Read test OFX file
const ofxContent = fs.readFileSync('./test-ofx.ofx', 'utf8');

console.log('Testing OFX Parser...\n');
console.log('File size:', ofxContent.length, 'bytes\n');

// Parse OFX
Ofx.parse(ofxContent, (error, data) => {
  if (error) {
    console.error('Parse error:', error);
    process.exit(1);
  }

  console.log('Parse successful!\n');
  console.log('Full OFX Data Structure:');
  console.log(JSON.stringify(data, null, 2));
});
