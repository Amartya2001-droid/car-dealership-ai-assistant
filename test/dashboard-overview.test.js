const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDashboardOverview } = require('../src/dashboardOverview');

test('buildDashboardOverview returns the expected sections', () => {
  const overview = buildDashboardOverview({
    summary: { leads: { total: 2 } },
    runtime: { version: '1.0.0' },
    health: { status: 'ok' },
    readiness: { ready: true, recommendedRoute: 'http://localhost:3000/ops-dashboard/' }
  });

  assert.equal(overview.summary.leads.total, 2);
  assert.equal(overview.runtime.version, '1.0.0');
  assert.equal(overview.health.status, 'ok');
  assert.equal(overview.readiness.ready, true);
});
