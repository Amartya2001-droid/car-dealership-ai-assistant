const test = require('node:test');
const assert = require('node:assert/strict');

const { parseAllowedOrigins, buildCorsOptions } = require('../src/corsPolicy');

test('parseAllowedOrigins splits, trims, and drops empties', () => {
  assert.deepEqual(
    parseAllowedOrigins(' https://dealer.example.com , https://ops.example.com ,,'),
    ['https://dealer.example.com', 'https://ops.example.com']
  );
  assert.deepEqual(parseAllowedOrigins(undefined), []);
  assert.deepEqual(parseAllowedOrigins(''), []);
});

test('buildCorsOptions reflects all origins when none are configured', () => {
  const options = buildCorsOptions([]);
  assert.equal(options.origin, true);
});

test('buildCorsOptions allows configured origins and requests with no origin', () => {
  const options = buildCorsOptions(['https://dealer.example.com']);

  options.origin('https://dealer.example.com', (err, allowed) => {
    assert.equal(err, null);
    assert.equal(allowed, true);
  });

  options.origin(undefined, (err, allowed) => {
    assert.equal(err, null);
    assert.equal(allowed, true);
  });
});

test('buildCorsOptions rejects origins outside the allowlist', () => {
  const options = buildCorsOptions(['https://dealer.example.com']);

  options.origin('https://evil.example.com', (err, allowed) => {
    assert.ok(err instanceof Error);
    assert.equal(allowed, undefined);
  });
});
