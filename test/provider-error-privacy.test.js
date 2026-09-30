const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const store = require('../src/dataStore');

test('provider response bodies never reach thrown errors or stored appointment errors', async (t) => {
  const original = { nodeEnv: config.nodeEnv, storageProvider: config.storageProvider,
    supabase: config.supabase, googleCalendar: config.googleCalendar };
  t.after(() => {
    Object.assign(config, original);
    delete require.cache[require.resolve('../src/testDriveScheduler')];
  });
  Object.assign(config, { nodeEnv: 'production', storageProvider: 'supabase',
    supabase: { url: 'https://example.test', anonKey: 'test' },
    googleCalendar: { calendarId: 'test', accessToken: 'test' } });
  let cancelled = 0;
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 403,
    text: async () => { throw new Error('Private response body must not be read'); },
    body: { cancel: async () => { cancelled++; } }
  }));
  await assert.rejects(store.listLeads(), { message: 'Supabase GET failed (403)' });
  t.mock.method(store, 'appendAppointment', async (record) => record);
  delete require.cache[require.resolve('../src/testDriveScheduler')];
  const appointment = await require('../src/testDriveScheduler').scheduleTestDrive({
    id: 'test', inquiry: 'tomorrow', phone: '+19025550199'
  });
  assert.equal(appointment.providerError, 'Google Calendar API error 403');
  assert.equal(cancelled, 2);
});
