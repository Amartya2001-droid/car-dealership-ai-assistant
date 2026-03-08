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
  const maxPriceMatch = text.match(/under\s*\$?([0-9]{2,6})/i);

  let bodyType = null;
  if (text.includes('suv')) bodyType = 'SUV';
  if (text.includes('sedan')) bodyType = 'Sedan';
  if (text.includes('truck')) bodyType = 'Truck';

  let fuelType = null;
  if (text.includes('hybrid')) fuelType = 'Hybrid';
  if (text.includes('electric') || text.includes('ev')) fuelType = 'Electric';

  return {
    bodyType,
    fuelType,
    maxPrice: maxPriceMatch ? Number(maxPriceMatch[1]) : null
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
