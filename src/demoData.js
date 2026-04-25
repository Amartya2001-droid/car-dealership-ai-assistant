const { buildLeadRecord } = require('./assistant');
const { scheduleTestDrive } = require('./testDriveScheduler');
const { queueFollowUp } = require('./followUp');
const { appendLead, listLeads, listAppointments, listFollowUps } = require('./dataStore');
const { files, writeJson } = require('./storage');
const { getPersistenceStatus } = require('./persistence');

const DEMO_SCENARIOS = [
  {
    id: 'hybrid-suv-callback',
    label: 'Hybrid SUV with callback request',
    phone: '+19025550111',
    callerName: 'Jordan',
    callerInput: 'I want a hybrid SUV under $40000 and call me tomorrow morning',
    persona: 'concierge',
    consentFollowUp: true
  },
  {
    id: 'test-drive-booking',
    label: 'Test drive booking request',
    phone: '+19025550112',
    callerName: 'Morgan',
    callerInput: 'Book me a test drive tomorrow at 3 pm for a small SUV',
    persona: 'sales_pro',
    consentFollowUp: true
  },
  {
    id: 'pricing-follow-up',
    label: 'Pricing question with follow-up opt in',
    phone: '+19025550113',
    callerName: 'Taylor',
    callerInput: 'What financing deal do you have on a compact SUV? Please text me back.',
    persona: 'tech_expert',
    consentFollowUp: true
  }
];

const ensureLocalResettable = () => {
  const persistence = getPersistenceStatus();
  if (persistence.activeProvider !== 'local_json') {
    throw new Error('Demo reset is only supported in local_json mode.');
  }
};

const resetDemoData = async () => {
  ensureLocalResettable();
  writeJson(files.leads, []);
  writeJson(files.appointments, []);
  writeJson(files.followups, []);

  return {
    reset: true,
    mode: 'local_json'
  };
};

const runDemoScenario = async (scenarioInput, { assistantReply } = {}) => {
  const scenario = typeof scenarioInput === 'string'
    ? DEMO_SCENARIOS.find((item) => item.id === scenarioInput)
    : scenarioInput;

  if (!scenario) {
    throw new Error(`Unknown demo scenario: ${scenarioInput}`);
  }

  const lead = await appendLead(buildLeadRecord(scenario));

  let appointment = null;
  if (lead.topic === 'test_drive') {
    appointment = await scheduleTestDrive(lead);
  }

  let followUp = null;
  if (lead.consentFollowUp) {
    followUp = await queueFollowUp(
      lead,
      assistantReply || 'Demo assistant reply queued for next-business-day follow-up.'
    );
  }

  return {
    scenario: {
      id: scenario.id,
      label: scenario.label
    },
    lead,
    appointment,
    followUp
  };
};

const seedDemoData = async ({ reset = false } = {}) => {
  if (reset) {
    await resetDemoData();
  }

  const results = [];
  for (const scenario of DEMO_SCENARIOS.slice(0, 2)) {
    results.push(await runDemoScenario(scenario));
  }

  const [leads, appointments, followups] = await Promise.all([
    listLeads(),
    listAppointments(),
    listFollowUps()
  ]);

  return {
    seeded: results.length,
    totals: {
      leads: leads.length,
      appointments: appointments.length,
      followups: followups.length
    },
    results
  };
};

const listDemoScenarios = () =>
  DEMO_SCENARIOS.map(({ id, label, callerName, callerInput, persona }) => ({
    id,
    label,
    callerName,
    callerInput,
    persona
  }));

module.exports = {
  DEMO_SCENARIOS,
  listDemoScenarios,
  runDemoScenario,
  seedDemoData,
  resetDemoData
};
