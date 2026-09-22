const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSimulatedCall } = require('../src/validation');
const valid = { phone: '+19025550123', message: 'Show me an SUV' };

test('call validation rejects invalid text, contact, and consent types', () => {
  assert.equal(validateSimulatedCall(valid).valid, true);
  for (const patch of [
    { message: {} }, { message: ' ' }, { message: 'x'.repeat(5001) },
    { phone: 123 }, { phone: 'unknown' }, { optInFollowUp: 'false' },
    { callerName: [] },
  ]) assert.equal(validateSimulatedCall({ ...valid, ...patch }).valid, false);
  for (const payload of [null, [], 1]) assert.equal(validateSimulatedCall(payload).valid, false);
  assert.equal(validateSimulatedCall({ ...valid, optInFollowUp: false }).valid, true);
});
