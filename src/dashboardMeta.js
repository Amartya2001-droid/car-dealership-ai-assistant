const fs = require('fs');
const path = require('path');

const frontendBuildDir = path.join(__dirname, '..', 'frontend', 'build');
const frontendBuildIndex = path.join(frontendBuildDir, 'index.html');
const frontendBuildManifest = path.join(frontendBuildDir, 'asset-manifest.json');

const normalizeBaseUrl = (baseUrl = 'http://localhost:3000') => String(baseUrl).replace(/\/$/, '');

const getDashboardBuildMode = () => {
  if (!fs.existsSync(frontendBuildIndex)) {
    return 'missing';
  }

  if (fs.existsSync(frontendBuildManifest)) {
    return 'react_bundle';
  }

  const html = fs.readFileSync(frontendBuildIndex, 'utf8');
  return html.includes('fallback-dashboard-shell') ? 'fallback_shell' : 'standalone_index';
};

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
  buildAvailable: fs.existsSync(frontendBuildIndex),
  buildMode: getDashboardBuildMode(),
  frontendBuildDir,
  builtAt: fs.existsSync(frontendBuildIndex)
    ? fs.statSync(frontendBuildIndex).mtime.toISOString()
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
