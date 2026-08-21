const test = require('node:test');
const assert = require('node:assert/strict');

const { createShutdownHandler } = require('../src/gracefulShutdown');

const makeLogger = () => ({
  logs: [],
  errors: [],
  log(...args) {
    this.logs.push(args.join(' '));
  },
  error(...args) {
    this.errors.push(args.join(' '));
  }
});

test('shutdown handler closes the server and exits 0 on success', () => {
  let closeCallback = null;
  const server = {
    close(cb) {
      closeCallback = cb;
    }
  };
  const exitCalls = [];
  const handler = createShutdownHandler({ server, logger: makeLogger(), exit: (code) => exitCalls.push(code) });

  handler('SIGTERM');
  closeCallback(null);

  assert.deepEqual(exitCalls, [0]);
});

test('shutdown handler exits 1 when the server reports a close error', () => {
  let closeCallback = null;
  const server = {
    close(cb) {
      closeCallback = cb;
    }
  };
  const exitCalls = [];
  const handler = createShutdownHandler({ server, logger: makeLogger(), exit: (code) => exitCalls.push(code) });

  handler('SIGTERM');
  closeCallback(new Error('still draining'));

  assert.deepEqual(exitCalls, [1]);
});

test('shutdown handler ignores a second signal while already shutting down', () => {
  let closeCallCount = 0;
  const server = {
    close(cb) {
      closeCallCount += 1;
    }
  };
  const exitCalls = [];
  const handler = createShutdownHandler({ server, logger: makeLogger(), exit: (code) => exitCalls.push(code) });

  handler('SIGTERM');
  handler('SIGINT');

  assert.equal(closeCallCount, 1);
});

test('shutdown handler force-exits if close never completes within the timeout', async () => {
  const server = {
    close() {
      // never calls back, simulating a hung connection
    }
  };
  const exitCalls = [];
  const handler = createShutdownHandler({
    server,
    logger: makeLogger(),
    timeoutMs: 20,
    exit: (code) => exitCalls.push(code)
  });

  handler('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.deepEqual(exitCalls, [1]);
});
