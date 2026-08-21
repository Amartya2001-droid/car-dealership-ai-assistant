const test = require('node:test');
const assert = require('node:assert/strict');

const { createSecurityHeaders } = require('../src/securityHeaders');

const makeRes = () => {
  const headers = {};
  return {
    headers,
    setHeader(name, value) {
      headers[name] = value;
    }
  };
};

test('security headers middleware sets baseline protections', () => {
  const middleware = createSecurityHeaders();
  const res = makeRes();
  let nextCalled = false;

  middleware({ protocol: 'http' }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(res.headers['X-Frame-Options'], 'DENY');
  assert.equal(res.headers['Referrer-Policy'], 'no-referrer');
  assert.equal(res.headers['Strict-Transport-Security'], undefined);
});

test('security headers middleware adds HSTS for https requests', () => {
  const middleware = createSecurityHeaders();
  const res = makeRes();

  middleware({ protocol: 'https' }, res, () => {});

  assert.match(res.headers['Strict-Transport-Security'], /max-age=15552000/);
});
