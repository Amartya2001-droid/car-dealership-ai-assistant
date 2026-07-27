const config = require('../src/config');
const { summarizeLeads } = require('../src/storage');
const { listLeads, listAppointments, listFollowUps } = require('../src/dataStore');
const { getDashboardReadiness } = require('../src/dashboardMeta');
const { buildProductionReadiness } = require('../src/productionReadiness');
const { buildDemoReadiness } = require('../src/demoReadiness');
const { listDemoScenarios } = require('../src/demoData');
const { buildDemoOverview } = require('../src/demoOverview');

const run = async () => {
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

  console.log('Demo overview');
  console.log(
    JSON.stringify(
      buildDemoOverview({
        readiness,
        production,
        scenarios: listDemoScenarios(),
        summary,
        commands: {
          prepare: 'npm run demo:prepare',
          ready: 'npm run demo:ready',
          scenarioList: 'npm run demo:scenario',
          scenarioRunExample: 'npm run demo:scenario -- test-drive-booking',
          runSheetExample: 'npm run demo:run-sheet -- test-drive-booking'
        },
        routes: {
          demoReadiness: `${config.baseUrl}/admin/demo-readiness`,
          productionReadiness: `${config.baseUrl}/admin/production-readiness`,
          demoScenarios: `${config.baseUrl}/admin/demo-scenarios`,
          demoRunSheetExample: `${config.baseUrl}/admin/demo/run-sheet/test-drive-booking`,
          summary: `${config.baseUrl}/admin/summary`,
          dashboard: `${config.baseUrl}/dashboard`,
          opsDashboard: `${config.baseUrl}/ops-dashboard/`
        }
      }),
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
