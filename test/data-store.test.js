const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENV_KEYS = ['STORAGE_PROVIDER', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATA_DIR'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = global.fetch;

const clearModules = () => {
  for (const file of ['../src/dataStore', '../src/storage', '../src/config']) {
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
  global.fetch = originalFetch;
});

test('a failed Supabase call falls back to local JSON and logs the failure', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dealership-datastore-'));
  setEnv({
    STORAGE_PROVIDER: 'supabase',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    DATA_DIR: tempDir
  });
  clearModules();

  global.fetch = async () => {
    throw new Error('network unreachable');
  };

  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => loggedErrors.push(args.join(' '));

  try {
    const { appendLead } = require('../src/dataStore');
    const lead = { id: 'lead-test-1', phone: '+19025550000' };
    const saved = await appendLead(lead);

    assert.equal(saved.id, 'lead-test-1');

    const writtenPath = path.join(tempDir, 'leads.json');
    const written = JSON.parse(fs.readFileSync(writtenPath, 'utf8'));
    assert.equal(written.length, 1);
    assert.equal(written[0].id, 'lead-test-1');

    assert.ok(loggedErrors.some((line) => line.includes('appendLead') && line.includes('network unreachable')));
  } finally {
    console.error = originalConsoleError;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('local_json storage never calls fetch', async () => {
  setEnv({ STORAGE_PROVIDER: 'local_json', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' });
  clearModules();

  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error('should not be called');
  };

  const { listLeads } = require('../src/dataStore');
  await listLeads();

  assert.equal(fetchCalled, false);
});
