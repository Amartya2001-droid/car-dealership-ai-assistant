const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeJson } = require('../src/storage');

test('local storage replaces complete JSON and removes temporary files', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-store-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'leads.json');
  writeJson(file, [{ id: 'original' }]);
  writeJson(file, [{ id: 'replacement' }]);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), [{ id: 'replacement' }]);
  assert.deepEqual(fs.readdirSync(dir), ['leads.json']);
  t.mock.method(fs, 'renameSync', () => { throw new Error('disk failure'); });
  assert.throws(() => writeJson(file, []), /disk failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), [{ id: 'replacement' }]);
  assert.deepEqual(fs.readdirSync(dir), ['leads.json']);
});
