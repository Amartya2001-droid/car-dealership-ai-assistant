const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { parsePreferredDateTime } = require('../src/testDriveScheduler');

test('after-hours requests without a date schedule the next future time', (t) => {
  const original = config.dealershipTimezone;
  config.dealershipTimezone = 'America/Halifax';
  t.after(() => { config.dealershipTimezone = original; });
  const now = '2026-09-30T22:00:00Z';
  assert.equal(parsePreferredDateTime('test drive at 2pm', now), '2026-10-01T17:00:00.000Z');
  assert.equal(parsePreferredDateTime('test drive', now), '2026-10-01T13:00:00.000Z');
  assert.equal(parsePreferredDateTime('test drive at 8pm', now), '2026-09-30T23:00:00.000Z');
  assert.equal(parsePreferredDateTime('tomorrow at 2pm', now), '2026-10-01T17:00:00.000Z');
});
