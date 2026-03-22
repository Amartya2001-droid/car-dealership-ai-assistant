const test = require('node:test');
const assert = require('node:assert/strict');

const { getDashboardLinks, getDashboardStatus } = require('../src/dashboardMeta');

test('getDashboardLinks returns the expected local routes', () => {
  const links = getDashboardLinks('http://localhost:3000/');

  assert.equal(links.builtInDashboard, 'http://localhost:3000/dashboard');
  assert.equal(links.opsDashboard, 'http://localhost:3000/ops-dashboard/');
  assert.equal(links.summary, 'http://localhost:3000/admin/summary');
});

test('getDashboardStatus reports a base URL and build flag', () => {
  const status = getDashboardStatus('http://localhost:3000/');

  assert.equal(status.baseUrl, 'http://localhost:3000');
  assert.equal(typeof status.buildAvailable, 'boolean');
  assert.equal(typeof status.frontendBuildDir, 'string');
});
