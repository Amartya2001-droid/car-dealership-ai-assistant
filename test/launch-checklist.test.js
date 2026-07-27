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
    routes: {
      launchChecklist: 'http://localhost:3000/admin/launch-checklist',
      productionReadiness: 'http://localhost:3000/admin/production-readiness',
      demoReadiness: 'http://localhost:3000/admin/demo-readiness',
      opsDashboard: 'http://localhost:3000/ops-dashboard/'
    },
    commands: { launchChecklist: 'npm run launch:checklist' }
  });

  assert.equal(checklist.readyForProduction, false);
  assert.ok(checklist.blockerCount >= 5);
  assert.ok(checklist.warningCount >= 1);
  assert.ok(checklist.warnings.length >= 1);
  assert.ok(checklist.blockers.some((item) => item.id === 'supabase'));
  assert.ok(checklist.blockers.some((item) => item.id === 'demo-data'));
  assert.ok(checklist.missingEnvKeys.includes('BASE_URL'));
  assert.ok(checklist.immediateActions.length >= 1);
  assert.ok(checklist.timeline.today.length >= 1);
  assert.ok(checklist.timeline.beforePilot.some((item) => item.id === 'twilio'));
  assert.equal(typeof checklist.completionScore, 'number');
  assert.ok(checklist.phaseSummary.today.total >= 1);
  assert.ok(checklist.areaSummary.configuration.blocked >= 1);
  assert.ok(checklist.areaSummary.telephony.ids.includes('twilio'));
  assert.equal(checklist.gates.demo.length, 2);
  assert.equal(checklist.gateSummary.production.total, 3);
  assert.ok(checklist.gates.pilot.some((item) => item.label.includes('Twilio')));
  assert.equal(checklist.narrative.statusTone, 'blocked');
  assert.ok(checklist.narrative.headline.length > 10);
  assert.equal(checklist.unlockPlan.steps[0].id, 'base-env');
  assert.ok(checklist.unlockPlan.steps.some((item) => item.id === 'twilio'));
  assert.ok(checklist.nextActionPlan.headline.includes('local demo blockers'));
  assert.ok(checklist.nextActionPlan.canDoNow.some((item) => item.id === 'base-env'));
  assert.ok(checklist.nextActionPlan.canDoNow.some((item) => item.id === 'demo-data'));
  assert.ok(checklist.nextActionPlan.canDoNow.some((item) => item.route === 'http://localhost:3000/admin/demo-readiness'));
  assert.ok(checklist.nextActionPlan.needsCredentials.some((item) => item.id === 'supabase'));
  assert.ok(checklist.nextActionPlan.needsCredentials.some((item) => item.id === 'twilio'));
  assert.ok(checklist.nextActionPlan.needsCredentials.every((item) => item.route === 'http://localhost:3000/admin/production-readiness'));
  assert.ok(checklist.nextActionPlan.verification.some((item) => item.stage === 'production'));
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
  assert.deepEqual(checklist.missingEnvKeys, []);
  assert.deepEqual(checklist.immediateActions, []);
  assert.equal(checklist.completionScore, 100);
  assert.equal(checklist.phaseSummary.today.complete, true);
  assert.deepEqual(checklist.areaSummary, {});
  assert.equal(checklist.gateSummary.demo.passed, checklist.gateSummary.demo.total);
  assert.equal(checklist.gateSummary.pilot.passed, checklist.gateSummary.pilot.total);
  assert.equal(checklist.gateSummary.production.passed, checklist.gateSummary.production.total);
  assert.equal(checklist.narrative.statusTone, 'ready');
  assert.ok(checklist.narrative.nextMilestone.includes('Deploy'));
  assert.equal(checklist.unlockPlan.steps.length, 0);
  assert.equal(checklist.nextActionPlan.headline, 'All launch gates are passing; run hosted verification before handoff.');
  assert.deepEqual(checklist.nextActionPlan.canDoNow, []);
  assert.deepEqual(checklist.nextActionPlan.needsCredentials, []);
  assert.deepEqual(checklist.nextActionPlan.verification, []);
});
