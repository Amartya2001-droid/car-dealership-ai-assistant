const fs = require('fs');
const path = require('path');

const frontendBuildDir = path.join(__dirname, '..', 'frontend', 'build');

const normalizeBaseUrl = (baseUrl = 'http://localhost:3000') => String(baseUrl).replace(/\/$/, '');

const getDashboardLinks = (baseUrl) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    builtInDashboard: `${normalizedBaseUrl}/dashboard`,
    opsDashboard: `${normalizedBaseUrl}/ops-dashboard/`,
    health: `${normalizedBaseUrl}/health`,
    runtime: `${normalizedBaseUrl}/admin/runtime`,
    summary: `${normalizedBaseUrl}/admin/summary`
  };
};

const getDashboardStatus = (baseUrl) => ({
  baseUrl: normalizeBaseUrl(baseUrl),
  buildAvailable: fs.existsSync(path.join(frontendBuildDir, 'index.html')),
  frontendBuildDir,
  builtAt: fs.existsSync(path.join(frontendBuildDir, 'index.html'))
    ? fs.statSync(path.join(frontendBuildDir, 'index.html')).mtime.toISOString()
    : null
});

const getDashboardReadiness = (baseUrl) => {
  const links = getDashboardLinks(baseUrl);
  const status = getDashboardStatus(baseUrl);

  return {
    ready: status.buildAvailable,
    recommendedRoute: status.buildAvailable ? links.opsDashboard : links.builtInDashboard,
    links,
    status
  };
};

module.exports = {
  getDashboardLinks,
  getDashboardStatus,
  getDashboardReadiness,
  frontendBuildDir
};
