const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Projects\\SKIL Master\\android-app\\www\\data';
const destDir = 'C:\\Projects\\SKIL Master\\web\\data';

const files = fs.readdirSync(srcDir);
files.forEach(f => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  if (fs.statSync(src).isFile()) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${f} to web/data/`);
  }
});

console.log('web/data/ updated successfully.');
