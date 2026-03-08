const test = require('node:test');
const assert = require('node:assert/strict');

const { inferUrgency, classifyTopic, moodFromText } = require('../src/assistant');
const { parsePreferences, findVehicleMatches } = require('../src/knowledgeBase');

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
