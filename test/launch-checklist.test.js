const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLaunchChecklist } = require('../src/launchChecklist');

test('buildLaunchChecklist reports blocked production items and demo warnings', () => {
  const checklist = buildLaunchChecklist({
    production: {
      localRunnable: true,
      productionReady: false,
      missingProduction: ['BASE_URL', 'SUPABASE_URL', 'TWILIO_ACCOUNT_SID'],
      warnings: ['USE_MOCK_AI is enabled.'],
      storage: { activeProvider: 'local_json' },
      dashboard: { ready: false },
      integrations: { openai: 'mock', twilio: 'missing' }
    },
    readiness: {
      ready: false,
      checks: { hasDemoData: false, dashboardReady: false }
    },
    routes: { launchChecklist: 'http://localhost:3000/admin/launch-checklist' },
    commands: { launchChecklist: 'npm run launch:checklist' }
  });

  assert.equal(checklist.readyForProduction, false);
  assert.ok(checklist.blockerCount >= 5);
  assert.ok(checklist.warningCount >= 1);
  assert.ok(checklist.warnings.length >= 1);
  assert.ok(checklist.blockers.some((item) => item.id === 'supabase'));
  assert.ok(checklist.blockers.some((item) => item.id === 'demo-data'));
});

test('buildLaunchChecklist reports a clean path when demo and production are ready', () => {
  const checklist = buildLaunchChecklist({
    production: {
      localRunnable: true,
      productionReady: true,
      missingProduction: [],
      warnings: [],
      storage: { activeProvider: 'supabase' },
      dashboard: { ready: true },
      integrations: { openai: 'configured', twilio: 'configured' }
    },
    readiness: {
      ready: true,
      checks: { hasDemoData: true, dashboardReady: true }
    },
    routes: {},
    commands: {}
  });

  assert.equal(checklist.readyForDemo, true);
  assert.equal(checklist.readyForPilot, true);
  assert.equal(checklist.readyForProduction, true);
  assert.equal(checklist.blockerCount, 0);
  assert.equal(checklist.warningCount, 0);
  assert.equal(checklist.warnings.length, 0);
});
