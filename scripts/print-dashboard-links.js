const config = require('../src/config');
const { getDashboardLinks, getDashboardStatus } = require('../src/dashboardMeta');

const links = getDashboardLinks(config.baseUrl);
const status = getDashboardStatus(config.baseUrl);

console.log('Dashboard links');
console.log(JSON.stringify({ links, status }, null, 2));
