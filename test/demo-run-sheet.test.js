const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDemoRunSheet } = require('../src/demoRunSheet');

const scenario = {
  id: 'test-drive-booking',
  label: 'Test drive booking request',
  phone: '+19025550112',
  callerName: 'Morgan',
  callerInput: 'Book me a test drive tomorrow at 3 pm for a small SUV',
  persona: 'sales_pro',
  consentFollowUp: true
};

test('buildDemoRunSheet returns recording commands, script, and proof points', () => {
  const runSheet = buildDemoRunSheet({
    scenario,
    baseUrl: 'http://localhost:3000'
  });

  assert.equal(runSheet.scenario.id, 'test-drive-booking');
  assert.equal(runSheet.presenterCommands.runScenario, 'npm run demo:scenario -- test-drive-booking');
  assert.equal(runSheet.presenterCommands.printRunSheet, 'npm run demo:run-sheet -- test-drive-booking');
  assert.equal(runSheet.apiRoutes.runScenario, 'http://localhost:3000/admin/demo/scenarios/test-drive-booking/run');
  assert.ok(runSheet.callerScript.some((line) => line.speaker === 'caller'));
  assert.ok(runSheet.proofPoints.some((point) => point.includes('Appointment list')));
  assert.ok(runSheet.screenRecordingChecklist.length >= 5);
});

test('buildDemoRunSheet requires a scenario', () => {
  assert.throws(
    () => buildDemoRunSheet({ baseUrl: 'http://localhost:3000' }),
    /demo scenario is required/
  );
});
