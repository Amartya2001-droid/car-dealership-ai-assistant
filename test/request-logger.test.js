const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { createRequestLogger } = require('../src/requestLogger');

const makeRes = (statusCode) => {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  return res;
};

test('request logger emits one JSON line per finished request with no query string', () => {
  const lines = [];
  const logger = { log: (line) => lines.push(line) };
  let tick = 0;
  const middleware = createRequestLogger({ logger, now: () => BigInt(tick++) * 1000000n });

  const req = { method: 'GET', path: '/admin/leads', originalUrl: '/admin/leads?api_key=secret', ip: '127.0.0.1' };
  const res = makeRes(200);
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });
  res.emit('finish');

  assert.equal(nextCalled, true);
  assert.equal(lines.length, 1);

  const entry = JSON.parse(lines[0]);
  assert.equal(entry.method, 'GET');
  assert.equal(entry.path, '/admin/leads');
  assert.equal(entry.status, 200);
  assert.equal(entry.ip, '127.0.0.1');
  assert.ok(!lines[0].includes('secret'));
  assert.equal(typeof entry.durationMs, 'number');
  assert.equal(typeof entry.timestamp, 'string');
});

test('request logger records the response status set by the time finish fires', () => {
  const lines = [];
  const logger = { log: (line) => lines.push(line) };
  const middleware = createRequestLogger({ logger, now: () => 0n });

  const req = { method: 'POST', path: '/simulate/call', ip: '10.0.0.1' };
  const res = makeRes(200);

  middleware(req, res, () => {});
  res.statusCode = 429;
  res.emit('finish');

  const entry = JSON.parse(lines[0]);
  assert.equal(entry.status, 429);
});
