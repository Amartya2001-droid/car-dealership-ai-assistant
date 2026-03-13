const fs = require('fs');
const path = require('path');

const { files, readJson } = require('../src/storage');

const leads = readJson(files.leads, []);
const outputPath = path.join(process.cwd(), 'data', 'lead-export.json');

fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2));

console.log(`Exported ${leads.length} leads to ${outputPath}`);
