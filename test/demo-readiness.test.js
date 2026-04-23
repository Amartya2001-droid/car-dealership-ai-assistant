const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDemoReadiness } = require('../src/demoReadiness');

test('buildDemoReadiness requires dashboard and demo data', () => {
  const readiness = buildDemoReadiness({
    summary: {
      leads: { total: 0 },
      appointments: { total: 0 },
      followups: { total: 0 }
    },
    dashboard: { ready: false },
    production: { productionReady: false },
    baseUrl: 'http://localhost:3000'
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.checks.dashboardReady, false);
  assert.equal(readiness.checks.hasDemoData, false);
  assert.ok(readiness.nextSteps.some((step) => step.includes('dashboard:refresh')));
  assert.ok(readiness.nextSteps.some((step) => step.includes('demo:prepare')));
});

test('buildDemoReadiness passes for local demo data and dashboard', () => {
  const readiness = buildDemoReadiness({
    summary: {
      leads: { total: 3 },
      appointments: { total: 1 },
      followups: { total: 2 }
    },
    dashboard: { ready: true },
    production: { productionReady: false },
    baseUrl: 'https://dealer.example.com/'
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.counts.leads, 3);
  assert.equal(readiness.routes.opsDashboard, 'https://dealer.example.com/ops-dashboard/');
  assert.ok(readiness.nextSteps.some((step) => step.includes('local demo')));
});
