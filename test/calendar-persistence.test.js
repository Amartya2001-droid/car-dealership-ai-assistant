const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const store = require('../src/dataStore');

test('calendar success followed by storage failure does not write a mock appointment', async (t) => {
  const original = config.googleCalendar;
  config.googleCalendar = { calendarId: 'test', accessToken: 'test' };
  t.after(() => {
    config.googleCalendar = original;
    delete require.cache[require.resolve('../src/testDriveScheduler')];
  });
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ({ id: 'event-1' }) }));
  const failure = new Error('storage unavailable');
  const writes = [];
  t.mock.method(store, 'appendAppointment', async (record) => {
    writes.push(record);
    throw failure;
  });
  delete require.cache[require.resolve('../src/testDriveScheduler')];
  await assert.rejects(require('../src/testDriveScheduler').scheduleTestDrive({
    id: 'lead-1', inquiry: 'tomorrow at 10am', phone: '+19025550199'
  }), (err) => err === failure);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].providerEventId, 'event-1');
  assert.equal(writes[0].provider, 'google_calendar');
});
