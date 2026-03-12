const { appendLead, files, readJson, writeJson } = require('../src/storage');
const { buildLeadRecord } = require('../src/assistant');

const reset = process.argv.includes('--reset');

if (reset) {
  writeJson(files.leads, []);
}

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

for (const sample of samples) {
  appendLead(buildLeadRecord(sample));
}

console.log(`Seeded ${samples.length} demo leads. Total leads: ${readJson(files.leads, []).length}`);
