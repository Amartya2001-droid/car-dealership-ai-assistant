const config = require('../src/config');
const { getDashboardReadiness } = require('../src/dashboardMeta');

const readiness = getDashboardReadiness(config.baseUrl);

console.log('Dashboard readiness');
console.log(JSON.stringify(readiness, null, 2));
