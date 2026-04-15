const fs = require('fs');
const path = require('path');

const { listLeads } = require('../src/dataStore');

const run = async () => {
  const leads = await listLeads();
  const outputPath = path.join(process.cwd(), 'data', 'lead-export.json');

  fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2));
  console.log(`Exported ${leads.length} leads to ${outputPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
