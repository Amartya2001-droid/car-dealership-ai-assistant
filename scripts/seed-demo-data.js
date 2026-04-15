const { appendLead, listLeads } = require('../src/dataStore');
const { files, writeJson } = require('../src/storage');
const { buildLeadRecord } = require('../src/assistant');

const reset = process.argv.includes('--reset');

const samples = [
  {
    phone: '+19025550111',
    callerName: 'Jordan',
    callerInput: 'I want a hybrid SUV under $40000 and call me tomorrow morning',
    persona: 'concierge',
    consentFollowUp: true
  },
  {
    phone: '+19025550112',
    callerName: 'Morgan',
    callerInput: 'Book me a test drive tomorrow at 3 pm for a small SUV',
    persona: 'sales_pro',
    consentFollowUp: true
  }
];

const run = async () => {
  if (reset) {
    writeJson(files.leads, []);
  }

  for (const sample of samples) {
    await appendLead(buildLeadRecord(sample));
  }

  console.log(`Seeded ${samples.length} demo leads. Total leads: ${(await listLeads()).length}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
