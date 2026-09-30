const config = require('../src/config');
const { buildProductionReadiness } = require('../src/productionReadiness');

const readiness = buildProductionReadiness({ baseUrl: config.baseUrl });
console.log(JSON.stringify(readiness, null, 2));
if (process.argv.includes('--strict') && !readiness.productionReady) process.exitCode = 1;
