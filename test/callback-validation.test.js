const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCallbackWindow } = require('../src/validation');

test('callback hours reject coercion, fractions, and out-of-range values', () => {
  const valid = { label: 'morning', startHour: 9, endHour: 12 };
  for (const value of [null, false, '', ' ', [], Infinity, 9.5, -1, 24]) {
    assert.equal(validateCallbackWindow({ ...valid, startHour: value }).valid, false);
  }
  assert.equal(validateCallbackWindow(valid).valid, true);
  assert.equal(validateCallbackWindow({ ...valid, startHour: '09', endHour: '12' }).valid, true);
  assert.equal(validateCallbackWindow(null).valid, false);
});
