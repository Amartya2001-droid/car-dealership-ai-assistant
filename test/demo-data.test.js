const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENV_KEYS = ['DATA_DIR', 'STORAGE_PROVIDER', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const MODULES = [
  '../src/config',
  '../src/storage',
  '../src/dataStore',
  '../src/persistence',
  '../src/assistant',
  '../src/testDriveScheduler',
  '../src/followUp',
  '../src/demoData'
];

const clearModules = () => {
  for (const file of MODULES) {
    delete require.cache[require.resolve(file)];
  }
};

const setEnv = (overrides) => {
  for (const key of ENV_KEYS) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      process.env[key] = overrides[key];
    } else if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
};

test.afterEach(() => {
  setEnv({});
  clearModules();
});

test('listDemoScenarios exposes named demo flows', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dealer-demo-list-'));
  setEnv({ DATA_DIR: tempDir, STORAGE_PROVIDER: 'local_json', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' });
  clearModules();

  const { listDemoScenarios } = require('../src/demoData');
  const scenarios = listDemoScenarios();

  assert.ok(scenarios.length >= 3);
  assert.ok(scenarios.some((item) => item.id === 'test-drive-booking'));
});

test('seedDemoData resets local data and creates leads, appointments, and followups', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dealer-demo-seed-'));
  setEnv({ DATA_DIR: tempDir, STORAGE_PROVIDER: 'local_json', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' });
  clearModules();

  const { seedDemoData } = require('../src/demoData');

  const result = await seedDemoData({ reset: true });

  assert.equal(result.seeded, 2);
  assert.equal(result.totals.leads, 2);
  assert.equal(result.totals.appointments, 1);
  assert.equal(result.totals.followups, 2);
});
