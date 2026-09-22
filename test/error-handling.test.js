const test = require('node:test');
const assert = require('node:assert/strict');

const { createNotFoundHandler, createErrorHandler } = require('../src/errorHandling');

const makeRes = () => ({
  statusCode: 200,
  body: null,
  headersSent: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

test('error output excludes query credentials and private exception details', (t) => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args.join(' ')));
  const req = { method: 'GET', originalUrl: '/missing?token=private-token' };
  const res = makeRes();
  createNotFoundHandler()(req, res);
  assert.equal(res.body.path, '/missing');
  createErrorHandler({ exposeDetails: false })(new Error('private-token'), req, res, () => {});
  assert.equal(logs.length, 1);
  assert.ok(!logs[0].includes('private-token'));
  assert.ok(!JSON.stringify(res.body).includes('private-token'));
});

test('invalid error status codes fall back to 500', (t) => {
  t.mock.method(console, 'error', () => {});
  for (const status of [200, 399, 600, 999, '400', NaN]) {
    const res = makeRes();
    createErrorHandler({ exposeDetails: false })(Object.assign(new Error('bad'), { status }),
      { method: 'GET', originalUrl: '/' }, res, () => {});
    assert.equal(res.statusCode, 500);
  }
});

test('notFoundHandler responds with 404 and the requested path', () => {
  const handler = createNotFoundHandler();
  const res = makeRes();

  handler({ originalUrl: '/nope' }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.path, '/nope');
});

test('errorHandler returns a generic 500 message when details are hidden', () => {
  const handler = createErrorHandler({ exposeDetails: false });
  const res = makeRes();
  const err = new Error('db connection refused');

  handler(err, { method: 'GET', originalUrl: '/admin/leads' }, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Internal server error');
  assert.equal(res.body.message, undefined);
  assert.equal(res.body.stack, undefined);
});

test('errorHandler includes message and stack when details are exposed', () => {
  const handler = createErrorHandler({ exposeDetails: true });
  const res = makeRes();
  const err = new Error('boom');

  handler(err, { method: 'GET', originalUrl: '/admin/leads' }, res, () => {});

  assert.equal(res.body.message, 'boom');
  assert.ok(res.body.stack);
});

test('errorHandler respects a custom status and exposed message', () => {
  const handler = createErrorHandler({ exposeDetails: false });
  const res = makeRes();
  const err = Object.assign(new Error('leadId is required'), { status: 400, expose: true });

  handler(err, { method: 'POST', originalUrl: '/admin/test-drives/schedule' }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'leadId is required');
});

test('errorHandler delegates to next when headers were already sent', () => {
  const handler = createErrorHandler({ exposeDetails: false });
  const res = makeRes();
  res.headersSent = true;
  let delegated = null;

  handler(new Error('too late'), { method: 'GET', originalUrl: '/x' }, res, (err) => {
    delegated = err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(delegated.message, 'too late');
});
