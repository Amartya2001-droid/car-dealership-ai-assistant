const { appendLead, listLeads, listAppointments, listFollowUps } = require('../src/dataStore');
const { files, writeJson } = require('../src/storage');
const { buildLeadRecord } = require('../src/assistant');
const { scheduleTestDrive } = require('../src/testDriveScheduler');
const { queueFollowUp } = require('../src/followUp');

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
    writeJson(files.appointments, []);
    writeJson(files.followups, []);
  }

  for (const sample of samples) {
    const lead = await appendLead(buildLeadRecord(sample));
    if (lead.topic === 'test_drive') {
      await scheduleTestDrive(lead);
    }
    if (lead.consentFollowUp) {
      await queueFollowUp(lead, 'Demo assistant reply queued for next-business-day follow-up.');
    }
  }

  const [leads, appointments, followups] = await Promise.all([
    listLeads(),
    listAppointments(),
    listFollowUps()
  ]);

  console.log(
    `Seeded ${samples.length} demo leads. Totals: ${leads.length} leads, ${appointments.length} appointments, ${followups.length} follow-ups.`
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
