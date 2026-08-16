const test = require('node:test');
const assert = require('node:assert/strict');
const { getExpectedTwilioSignature } = require('twilio/lib/webhooks/webhooks');

const {
  getTwilioWebhookSecurityStatus,
  buildWebhookUrl,
  isValidTwilioSignature,
  createTwilioWebhookGuard
} = require('../src/twilioSecurity');

const AUTH_TOKEN = 'test-auth-token';
const WEBHOOK_URL = 'https://dealer.example.com/webhooks/twilio/voice';

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

test('getTwilioWebhookSecurityStatus reflects token and toggle state', () => {
  assert.equal(getTwilioWebhookSecurityStatus({ authToken: '', validationEnabled: true }), 'unconfigured');
  assert.equal(getTwilioWebhookSecurityStatus({ authToken: AUTH_TOKEN, validationEnabled: true }), 'enforced');
  assert.equal(getTwilioWebhookSecurityStatus({ authToken: AUTH_TOKEN, validationEnabled: false }), 'disabled');
});

test('buildWebhookUrl joins base URL and original request path', () => {
  assert.equal(
    buildWebhookUrl('https://dealer.example.com', '/webhooks/twilio/voice'),
    'https://dealer.example.com/webhooks/twilio/voice'
  );
  assert.equal(
    buildWebhookUrl('https://dealer.example.com/', '/webhooks/twilio/voice/collect?persona=concierge'),
    'https://dealer.example.com/webhooks/twilio/voice/collect?persona=concierge'
  );
});

test('isValidTwilioSignature accepts a correctly signed request', () => {
  const params = { From: '+19025550000', SpeechResult: 'I want a test drive' };
  const signature = getExpectedTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);

  assert.equal(isValidTwilioSignature({ authToken: AUTH_TOKEN, signature, url: WEBHOOK_URL, params }), true);
});

test('isValidTwilioSignature rejects tampered params and missing signatures', () => {
  const params = { From: '+19025550000' };
  const signature = getExpectedTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);

  assert.equal(
    isValidTwilioSignature({
      authToken: AUTH_TOKEN,
      signature,
      url: WEBHOOK_URL,
      params: { From: '+15555550000' }
    }),
    false
  );
  assert.equal(
    isValidTwilioSignature({ authToken: AUTH_TOKEN, signature: undefined, url: WEBHOOK_URL, params }),
    false
  );
});

test('webhook guard passes valid Twilio requests through', () => {
  const guard = createTwilioWebhookGuard({
    authToken: AUTH_TOKEN,
    baseUrl: 'https://dealer.example.com',
    enabled: true
  });
  const body = { From: '+19025550000', SpeechResult: 'hours please' };
  const req = {
    originalUrl: '/webhooks/twilio/voice',
    headers: { 'x-twilio-signature': getExpectedTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, body) },
    body
  };
  const res = makeRes();
  let nextCalled = false;

  guard(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('webhook guard rejects unsigned requests with 403', () => {
  const guard = createTwilioWebhookGuard({
    authToken: AUTH_TOKEN,
    baseUrl: 'https://dealer.example.com',
    enabled: true
  });
  const req = {
    originalUrl: '/webhooks/twilio/voice',
    headers: {},
    body: { From: '+19025550000' }
  };
  const res = makeRes();
  let nextCalled = false;

  guard(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.error, /signature/i);
});

test('webhook guard is a pass-through when validation is disabled or unconfigured', () => {
  const cases = [
    { authToken: AUTH_TOKEN, baseUrl: 'https://dealer.example.com', enabled: false },
    { authToken: '', baseUrl: 'https://dealer.example.com', enabled: true }
  ];

  for (const options of cases) {
    const guard = createTwilioWebhookGuard(options);
    const res = makeRes();
    let nextCalled = false;

    guard({ originalUrl: '/webhooks/twilio/voice', headers: {}, body: {} }, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  }
});
