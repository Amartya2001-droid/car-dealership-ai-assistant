const config = require('../src/config');
const { getDashboardReadiness } = require('../src/dashboardMeta');
const { getPersistenceStatus } = require('../src/persistence');
const { files, readJson, summarizeLeads } = require('../src/storage');
const { buildDashboardOverview } = require('../src/dashboardOverview');

const appointments = readJson(files.appointments, []);
const followups = readJson(files.followups, []);
const leads = readJson(files.leads, []);

const overview = buildDashboardOverview({
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
  runtime: {
    version: require('../package.json').version,
    storage: getPersistenceStatus(),
    timezone: config.dealershipTimezone,
    defaultPersona: config.defaultPersona
  },
  health: {
    status: 'ok',
    service: 'car-dealership-ai-assistant',
    version: require('../package.json').version,
    time: new Date().toISOString()
  },
  readiness: getDashboardReadiness(config.baseUrl)
});

console.log('Dashboard overview');
console.log(JSON.stringify(overview, null, 2));
