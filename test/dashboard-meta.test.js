const test = require('node:test');
const assert = require('node:assert/strict');

const { getDashboardLinks, getDashboardStatus, getDashboardReadiness } = require('../src/dashboardMeta');

test('getDashboardLinks returns the expected local routes', () => {
  const links = getDashboardLinks('http://localhost:3000/');

  assert.equal(links.builtInDashboard, 'http://localhost:3000/dashboard');
  assert.equal(links.opsDashboard, 'http://localhost:3000/ops-dashboard/');
  assert.equal(links.summary, 'http://localhost:3000/admin/summary');
  assert.equal(links.readiness, 'http://localhost:3000/admin/dashboard-readiness');
  assert.equal(links.overview, 'http://localhost:3000/admin/dashboard-overview');
  assert.equal(links.productionReadiness, 'http://localhost:3000/admin/production-readiness');
});

test('getDashboardStatus reports a base URL and build flag', () => {
  const status = getDashboardStatus('http://localhost:3000/');

  assert.equal(status.baseUrl, 'http://localhost:3000');
  assert.equal(typeof status.buildAvailable, 'boolean');
  assert.equal(typeof status.buildMode, 'string');
  assert.equal(typeof status.frontendBuildDir, 'string');
});

test('getDashboardReadiness returns links, status, and a recommended route', () => {
  const readiness = getDashboardReadiness('http://localhost:3000/');

  assert.equal(typeof readiness.ready, 'boolean');
  assert.equal(readiness.links.builtInDashboard, 'http://localhost:3000/dashboard');
  assert.equal(readiness.links.opsDashboard, 'http://localhost:3000/ops-dashboard/');
  assert.equal(
    readiness.recommendedRoute,
    readiness.status.buildAvailable ? readiness.links.opsDashboard : readiness.links.builtInDashboard
  );
});
