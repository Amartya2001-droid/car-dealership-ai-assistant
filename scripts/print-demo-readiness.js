const config = require('../src/config');
const { summarizeLeads } = require('../src/storage');
const { listLeads, listAppointments, listFollowUps } = require('../src/dataStore');
const { getDashboardReadiness } = require('../src/dashboardMeta');
const { buildProductionReadiness } = require('../src/productionReadiness');
const { buildDemoReadiness } = require('../src/demoReadiness');

const run = async () => {
  const [leads, appointments, followups] = await Promise.all([
    listLeads(),
    listAppointments(),
    listFollowUps()
  ]);

  const readiness = buildDemoReadiness({
    summary: {
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
    },
    dashboard: getDashboardReadiness(config.baseUrl),
    production: buildProductionReadiness({ baseUrl: config.baseUrl }),
    baseUrl: config.baseUrl
  });

  console.log('Demo readiness');
  console.log(JSON.stringify(readiness, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
