const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = [
  'DEALERSHIP_NAME',
  'DEFAULT_PERSONA',
  'STORAGE_PROVIDER',
  'BASE_URL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'USE_MOCK_AI',
  'OPENAI_API_KEY'
];

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const clearModules = () => {
  for (const file of [
    '../src/productionReadiness',
    '../src/dashboardMeta',
    '../src/persistence',
    '../src/dataStore',
    '../src/config'
  ]) {
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

test('production readiness reports local fallback gaps', () => {
  setEnv({
    STORAGE_PROVIDER: 'local_json',
    USE_MOCK_AI: 'true'
  });
  clearModules();

  const { buildProductionReadiness } = require('../src/productionReadiness');
  const readiness = buildProductionReadiness({ env: process.env, baseUrl: 'http://localhost:3000' });

  assert.equal(readiness.localRunnable, true);
  assert.equal(readiness.productionReady, false);
  assert.equal(readiness.integrations.openai, 'mock');
  assert.equal(readiness.storage.activeProvider, 'local_json');
  assert.ok(readiness.missingProduction.includes('TWILIO_ACCOUNT_SID'));
});

test('production readiness passes when required providers are configured', () => {
  setEnv({
    DEALERSHIP_NAME: 'Northstar Auto Group',
    DEFAULT_PERSONA: 'concierge',
    STORAGE_PROVIDER: 'supabase',
    BASE_URL: 'https://dealer.example.com',
    TWILIO_ACCOUNT_SID: 'AC123',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_PHONE_NUMBER: '+19025550199',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    USE_MOCK_AI: 'false',
    OPENAI_API_KEY: 'sk-test'
  });
  clearModules();

  const { buildProductionReadiness } = require('../src/productionReadiness');
  const readiness = buildProductionReadiness({ env: process.env, baseUrl: 'https://dealer.example.com' });

  assert.equal(readiness.productionReady, true);
  assert.equal(readiness.ok, true);
  assert.equal(readiness.integrations.openai, 'configured');
  assert.equal(readiness.integrations.twilio, 'configured');
  assert.equal(readiness.storage.activeProvider, 'supabase');
  assert.equal(readiness.missingProduction.length, 0);
});
