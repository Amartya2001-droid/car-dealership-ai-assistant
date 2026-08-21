const test = require('node:test');
const assert = require('node:assert/strict');

const { getAdminAuthStatus, createAdminAuthGuard } = require('../src/adminAuth');

const makeRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

test('getAdminAuthStatus reports unconfigured with no key and enforced with one', () => {
  assert.equal(getAdminAuthStatus({ apiKey: '' }), 'unconfigured');
  assert.equal(getAdminAuthStatus({ apiKey: 'secret' }), 'enforced');
});

test('admin auth guard passes every request through when unconfigured', () => {
  const guard = createAdminAuthGuard({ apiKey: '' });
  const res = makeRes();
  let nextCalled = false;

  guard({ headers: {}, query: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('admin auth guard accepts a matching header key', () => {
  const guard = createAdminAuthGuard({ apiKey: 'secret-key' });
  const res = makeRes();
  let nextCalled = false;

  guard({ headers: { 'x-admin-api-key': 'secret-key' }, query: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('admin auth guard accepts a matching api_key query param', () => {
  const guard = createAdminAuthGuard({ apiKey: 'secret-key' });
  const res = makeRes();
  let nextCalled = false;

  guard({ headers: {}, query: { api_key: 'secret-key' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('admin auth guard rejects a missing or wrong key with 401', () => {
  const guard = createAdminAuthGuard({ apiKey: 'secret-key' });

  const missing = makeRes();
  let missingNext = false;
  guard({ headers: {}, query: {} }, missing, () => {
    missingNext = true;
  });
  assert.equal(missingNext, false);
  assert.equal(missing.statusCode, 401);

  const wrong = makeRes();
  let wrongNext = false;
  guard({ headers: { 'x-admin-api-key': 'nope' }, query: {} }, wrong, () => {
    wrongNext = true;
  });
  assert.equal(wrongNext, false);
  assert.equal(wrong.statusCode, 401);
});

test('admin auth guard rejects keys of a different length without throwing', () => {
  const guard = createAdminAuthGuard({ apiKey: 'a-much-longer-secret-key' });
  const res = makeRes();

  assert.doesNotThrow(() => {
    guard({ headers: { 'x-admin-api-key': 'short' }, query: {} }, res, () => {});
  });
  assert.equal(res.statusCode, 401);
});
