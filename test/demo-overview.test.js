const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDemoOverview } = require('../src/demoOverview');

test('buildDemoOverview returns scenarios, commands, routes, and recording flow', () => {
  const overview = buildDemoOverview({
    readiness: { ready: true },
    production: { productionReady: false },
    scenarios: [{ id: 'test-drive-booking' }],
    summary: { leads: { total: 2 } },
    commands: { prepare: 'npm run demo:prepare' },
    routes: { dashboard: 'http://localhost:3000/dashboard' }
  });

  assert.equal(overview.readiness.ready, true);
  assert.equal(overview.scenarios[0].id, 'test-drive-booking');
  assert.equal(overview.commands.prepare, 'npm run demo:prepare');
  assert.equal(overview.routes.dashboard, 'http://localhost:3000/dashboard');
  assert.ok(Array.isArray(overview.recordingFlow));
  assert.ok(overview.recordingFlow.length >= 4);
});
