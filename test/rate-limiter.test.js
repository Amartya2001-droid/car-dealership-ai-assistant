const test = require('node:test');
const assert = require('node:assert/strict');

const { createRateLimiter } = require('../src/rateLimiter');

const makeRes = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

test('rate limiter allows requests under the max within a window', () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 3, keyGenerator: () => 'shared', clock: () => now });
  const req = {};

  for (let i = 0; i < 3; i += 1) {
    const res = makeRes();
    let nextCalled = false;
    limiter(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true, `request ${i} should pass`);
  }
});

test('rate limiter blocks requests once the max is exceeded', () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 2, keyGenerator: () => 'shared', clock: () => now });
  const req = {};

  limiter(req, makeRes(), () => {});
  limiter(req, makeRes(), () => {});

  const res = makeRes();
  let nextCalled = false;
  limiter(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);
});

test('rate limiter resets after the window elapses', () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, keyGenerator: () => 'shared', clock: () => now });
  const req = {};

  limiter(req, makeRes(), () => {});

  const blocked = makeRes();
  limiter(req, blocked, () => {});
  assert.equal(blocked.statusCode, 429);

  now = 1001;
  const res = makeRes();
  let nextCalled = false;
  limiter(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('rate limiter tracks separate keys independently', () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, keyGenerator: (req) => req.ip, clock: () => now });

  limiter({ ip: '1.1.1.1' }, makeRes(), () => {});

  const res = makeRes();
  let nextCalled = false;
  limiter({ ip: '2.2.2.2' }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
