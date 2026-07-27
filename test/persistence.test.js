const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = ['STORAGE_PROVIDER', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const clearModules = () => {
  for (const file of ['../src/persistence', '../src/dataStore', '../src/config']) {
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

test('persistence status reports local fallback by default', () => {
  setEnv({
    STORAGE_PROVIDER: 'local_json',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
  });
  clearModules();

  const { getPersistenceStatus } = require('../src/persistence');
  const status = getPersistenceStatus();

  assert.equal(status.mode, 'local_fallback');
  assert.equal(status.activeProvider, 'local_json');
});

test('persistence status reports remote ready when Supabase config exists', () => {
  setEnv({
    STORAGE_PROVIDER: 'supabase',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key'
  });
  clearModules();

  const { getPersistenceStatus } = require('../src/persistence');
  const status = getPersistenceStatus();

  assert.equal(status.provider, 'supabase');
  assert.equal(status.supabaseConfigured, true);
  assert.equal(status.mode, 'remote_ready');
  assert.equal(status.activeProvider, 'supabase');
});
