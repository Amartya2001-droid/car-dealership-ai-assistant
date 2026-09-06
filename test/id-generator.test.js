const test = require('node:test');
const assert = require('node:assert/strict');

const { generateId } = require('../src/idGenerator');

test('generateId prefixes the id as requested', () => {
  const id = generateId('lead');
  assert.match(id, /^lead-\d+-[0-9a-f]{8}$/);
});

test('generateId produces unique values even when called back to back', () => {
  const ids = new Set();
  for (let i = 0; i < 500; i += 1) {
    ids.add(generateId('apt'));
  }
  assert.equal(ids.size, 500);
});

test('generateId supports different prefixes independently', () => {
  assert.match(generateId('followup'), /^followup-/);
  assert.match(generateId('apt'), /^apt-/);
});
