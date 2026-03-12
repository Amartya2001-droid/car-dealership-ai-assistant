const test = require('node:test');
const assert = require('node:assert/strict');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const { inferUrgency, classifyTopic, moodFromText, buildLeadRecord, extractCallbackWindow } = require('../src/assistant');
const { parsePreferences, findVehicleMatches } = require('../src/knowledgeBase');
const { parsePreferredDateTime } = require('../src/testDriveScheduler');
const { validateSimulatedCall, validateCallbackWindow } = require('../src/validation');
const { buildShowroomAsset } = require('../src/showroom');

dayjs.extend(utc);
dayjs.extend(timezone);

test('inferUrgency detects high urgency language', () => {
  assert.equal(inferUrgency('I need this ASAP today'), 'high');
});

test('classifyTopic detects service intent', () => {
  assert.equal(classifyTopic('Need an oil change this week'), 'service');
});

test('moodFromText detects frustration', () => {
  assert.equal(moodFromText('I am upset and frustrated'), 'frustrated');
});

test('parsePreferences extracts SUV and budget', () => {
  const preferences = parsePreferences('looking for a small suv under $40000');
  assert.equal(preferences.bodyType, 'SUV');
  assert.equal(preferences.maxPrice, 40000);
});

test('findVehicleMatches returns in-stock options under budget', () => {
  const matches = findVehicleMatches({ bodyType: 'SUV', maxPrice: 40000 });
  assert.ok(matches.length > 0);
  assert.ok(matches.every((vehicle) => vehicle.inStock));
  assert.ok(matches.every((vehicle) => vehicle.price <= 40000));
});

test('buildLeadRecord initializes lifecycle status', () => {
  const lead = buildLeadRecord({
    phone: '+19025550000',
    callerInput: 'book a test drive tomorrow at 2 pm and call me in the morning',
    persona: 'sales_pro',
    consentFollowUp: true
  });

  assert.equal(lead.status, 'new');
  assert.ok(Array.isArray(lead.lifecycle));
  assert.equal(lead.lifecycle[0].status, 'new');
  assert.equal(lead.callbackWindow.label, 'morning');
  assert.ok(lead.showroomAsset);
});

test('parsePreferredDateTime extracts tomorrow with explicit time', () => {
  const iso = parsePreferredDateTime('book a test drive tomorrow at 2:30 pm');
  const parsed = dayjs(iso).tz('America/Halifax');

  assert.equal(parsed.hour(), 14);
  assert.equal(parsed.minute(), 30);
});

test('extractCallbackWindow detects afternoon preference', () => {
  const callbackWindow = extractCallbackWindow('please call me back in the afternoon');

  assert.equal(callbackWindow.label, 'afternoon');
  assert.equal(callbackWindow.startHour, 12);
  assert.equal(callbackWindow.endHour, 17);
});

test('validateSimulatedCall rejects unsupported personas', () => {
  const result = validateSimulatedCall({
    phone: '+19025550000',
    message: 'Need pricing info',
    persona: 'invalid'
  });

  assert.equal(result.valid, false);
  assert.match(result.errors[0], /persona must be one of/);
});

test('buildShowroomAsset produces brochure and video links', () => {
  const asset = buildShowroomAsset({
    year: 2025,
    make: 'Honda',
    model: 'CR-V'
  });

  assert.match(asset.brochureUrl, /showroom\/2025-honda-cr-v\/brochure/);
  assert.match(asset.videoUrl, /showroom\/2025-honda-cr-v\/walkaround/);
});

test('validateCallbackWindow rejects inverted hour ranges', () => {
  const result = validateCallbackWindow({
    label: 'afternoon',
    startHour: 18,
    endHour: 12
  });

  assert.equal(result.valid, false);
  assert.match(result.errors[0], /valid hour range/);
});
