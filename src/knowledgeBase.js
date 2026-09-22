const { readJson, writeJson, files } = require('./storage');

const getKnowledgeBase = () => readJson(files.knowledge, {});

const findVehicleMatches = (preferences = {}) => {
  const kb = getKnowledgeBase();
  const inventory = kb.inventory || [];

  const normalizedBodyType = preferences.bodyType
    ? String(preferences.bodyType).toLowerCase()
    : null;

  return inventory
    .filter((vehicle) => {
      if (!vehicle.inStock) return false;
      if (preferences.maxPrice && Number(vehicle.price) > Number(preferences.maxPrice)) {
        return false;
      }
      if (normalizedBodyType && String(vehicle.bodyType).toLowerCase() !== normalizedBodyType) {
        return false;
      }
      if (preferences.fuelType && String(vehicle.fuelType).toLowerCase() !== String(preferences.fuelType).toLowerCase()) {
        return false;
      }
      return true;
    })
    .slice(0, 3);
};

const parsePreferences = (freeText = '') => {
  const text = freeText.toLowerCase();
  const maxPriceMatch = text.match(/\bunder\s*\$?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(k)?\b(?![\d,.])/i);

  let bodyType = null;
  if (text.includes('suv')) bodyType = 'SUV';
  if (text.includes('sedan')) bodyType = 'Sedan';
  if (text.includes('truck')) bodyType = 'Truck';

  let fuelType = null;
  if (/\bhybrid\b/.test(text)) fuelType = 'Hybrid';
  else if (/\b(electric|ev)\b/.test(text)) fuelType = 'Electric';

  const budget = maxPriceMatch
    ? Number(maxPriceMatch[1].replace(/,/g, '')) * (maxPriceMatch[2] ? 1000 : 1)
    : null;

  return {
    bodyType,
    fuelType,
    maxPrice: Number.isFinite(budget) && budget > 0 ? budget : null
  };
};

const updateKnowledgeBaseFromSnapshot = (snapshot = {}) => {
  const current = getKnowledgeBase();
  const merged = {
    ...current,
    ...snapshot,
    updatedAt: new Date().toISOString()
  };

  writeJson(files.knowledge, merged);
  return merged;
};

module.exports = {
  getKnowledgeBase,
  findVehicleMatches,
  parsePreferences,
  updateKnowledgeBaseFromSnapshot
};
