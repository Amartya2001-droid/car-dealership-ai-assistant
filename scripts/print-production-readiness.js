const config = require('../src/config');
const { buildProductionReadiness } = require('../src/productionReadiness');

console.log('Production readiness');
console.log(
  JSON.stringify(buildProductionReadiness({ baseUrl: config.baseUrl }), null, 2)
);
