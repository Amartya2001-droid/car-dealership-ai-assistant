const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const store = require('../src/dataStore');

const abortingFetch = (t) => {
  const controller = new AbortController();
  const error = new DOMException('Provider deadline exceeded', 'TimeoutError');
  t.mock.method(AbortSignal, 'timeout', (ms) => {
    assert.equal(ms, 10000);
    return controller.signal;
  });
  let calls = 0;
  t.mock.method(global, 'fetch', async (_url, { signal }) => {
    calls++;
    assert.equal(signal, controller.signal);
    controller.abort(error);
    signal.throwIfAborted();
  });
  return { error, calls: () => calls };
};

test('Supabase propagates provider timeouts in production', async (t) => {
  const original = { storageProvider: config.storageProvider, nodeEnv: config.nodeEnv, supabase: config.supabase };
  t.after(() => Object.assign(config, original));
  Object.assign(config, { storageProvider: 'supabase', nodeEnv: 'production',
    supabase: { url: 'https://example.test', anonKey: 'test' } });
  const probe = abortingFetch(t);
  await assert.rejects(store.listLeads(), (err) => err === probe.error);
  assert.equal(probe.calls(), 1);
});

test('Calendar timeouts preserve the fallback appointment for staff', async (t) => {
  const original = config.googleCalendar;
  t.after(() => {
    config.googleCalendar = original;
    delete require.cache[require.resolve('../src/testDriveScheduler')];
  });
  config.googleCalendar = { calendarId: 'test', accessToken: 'test' };
  t.mock.method(store, 'appendAppointment', async (record) => record);
  delete require.cache[require.resolve('../src/testDriveScheduler')];
  const probe = abortingFetch(t);
  const appointment = await require('../src/testDriveScheduler').scheduleTestDrive({
    id: 'test', phone: '+19025550199', inquiry: 'tomorrow at 10am'
  });
  assert.equal(probe.calls(), 1);
  assert.equal(appointment.status, 'scheduled_fallback');
  assert.equal(appointment.providerError, probe.error.message);
});
