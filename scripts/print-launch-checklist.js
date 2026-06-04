const { buildProductionReadiness } = require('../src/productionReadiness');
const { buildDemoReadiness } = require('../src/demoReadiness');
const { getDashboardReadiness } = require('../src/dashboardMeta');
const { buildLaunchChecklist } = require('../src/launchChecklist');
const { listDemoScenarios } = require('../src/demoData');
const { summarizeLeads } = require('../src/storage');
const { listLeads, listAppointments, listFollowUps } = require('../src/dataStore');
const config = require('../src/config');

const main = async () => {
  const [leads, appointments, followups] = await Promise.all([
    listLeads(),
    listAppointments(),
    listFollowUps()
  ]);

  const summary = {
    leads: summarizeLeads(leads),
    appointments: {
      total: appointments.length,
      confirmed: appointments.filter((item) => item.status === 'confirmed').length,
      pending: appointments.filter((item) => item.status !== 'confirmed').length
    },
    followups: {
      total: followups.length,
      queued: followups.filter((item) => item.status === 'queued').length,
      sent: followups.filter((item) => item.status === 'sent').length
    }
  };

  const production = buildProductionReadiness({ baseUrl: config.baseUrl });
  const readiness = buildDemoReadiness({
    summary,
    dashboard: getDashboardReadiness(config.baseUrl),
    production,
    baseUrl: config.baseUrl
  });

  const commands = {
    prepare: 'npm run demo:prepare',
    ready: 'npm run demo:ready',
    scenarioList: 'npm run demo:scenario',
    launchChecklist: 'npm run launch:checklist',
    verifyProduction: 'npm run verify:production-url'
  };

  const routes = {
    demoReadiness: `${config.baseUrl}/admin/demo-readiness`,
    productionReadiness: `${config.baseUrl}/admin/production-readiness`,
    demoScenarios: `${config.baseUrl}/admin/demo-scenarios`,
    launchChecklist: `${config.baseUrl}/admin/launch-checklist`,
    opsDashboard: `${config.baseUrl}/ops-dashboard/`
  };

  const payload = buildLaunchChecklist({
    production,
    readiness,
    commands: {
      ...commands,
      scenarioCount: listDemoScenarios().length
    },
    routes
  });

  console.log('Launch checklist');
  console.log(JSON.stringify(payload, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
