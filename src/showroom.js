const config = require('./config');

const buildVehicleSlug = (vehicle = {}) => {
  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return parts || 'inventory-highlight';
};

const buildShowroomAsset = (vehicle, promotions = []) => {
  if (!vehicle) return null;

  const slug = buildVehicleSlug(vehicle);
  const promotionText = promotions.length ? promotions[0] : null;

  return {
    type: 'virtual_showroom',
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Walkaround`,
    brochureUrl: `${config.showroomAssetBaseUrl}/showroom/${slug}/brochure`,
    videoUrl: `${config.showroomAssetBaseUrl}/showroom/${slug}/walkaround`,
    highlight: promotionText,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildShowroomAsset
};
