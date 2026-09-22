const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePreferences } = require('../src/knowledgeBase');

test('vehicle budgets support thousands separators and k notation', () => {
  for (const text of ['under $40,000', 'under 40000', 'under 40k', 'under $40K']) {
    assert.equal(parsePreferences(text).maxPrice, 40000);
  }
  assert.equal(parsePreferences('under 39.5k').maxPrice, 39500);
  assert.equal(parsePreferences('under $40,00').maxPrice, null);
  assert.equal(parsePreferences('under $0').maxPrice, null);
});

test('fuel detection uses whole words and preserves hybrid requests', () => {
  assert.equal(parsePreferences('Chevrolet for the evening').fuelType, null);
  assert.equal(parsePreferences('an EV please').fuelType, 'Electric');
  assert.equal(parsePreferences('electric hybrid SUV').fuelType, 'Hybrid');
});
