const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('strict production check fails while informational environment check stays usable', () => {
  for (const strict of [false, true]) {
    const result = spawnSync(process.execPath,
      ['scripts/check-env.js', ...(strict ? ['--strict'] : [])], {
        cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 10000,
        env: { ...process.env, NODE_ENV: 'test', USE_MOCK_AI: 'true', STORAGE_PROVIDER: 'local_json' }
      });
    assert.ifError(result.error);
    assert.equal(result.status, strict ? 1 : 0);
    assert.equal(JSON.parse(result.stdout).productionReady, false);
  }
});
