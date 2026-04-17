const config = require('../src/config');
const { buildProductionReadiness } = require('../src/productionReadiness');

console.log(
  JSON.stringify(
    buildProductionReadiness({ baseUrl: config.baseUrl }),
    null,
    2
  )
);
