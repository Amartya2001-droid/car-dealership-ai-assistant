const config = require('../src/config');

const baseUrl = (process.env.DEPLOYMENT_URL || process.env.BASE_URL || config.baseUrl).replace(/\/$/, '');

const checks = [
  { name: 'health', path: '/health', requiredStatus: 200 },
  { name: 'summary', path: '/admin/summary', requiredStatus: 200 },
  { name: 'dashboard readiness', path: '/admin/dashboard-readiness', requiredStatus: 200 },
  { name: 'dashboard overview', path: '/admin/dashboard-overview', requiredStatus: 200 },
  { name: 'twilio voice webhook', path: '/webhooks/twilio/voice', method: 'POST', requiredStatus: 200 }
];

const requestCheck = async ({ name, path, method = 'GET', requiredStatus }) => {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: method === 'POST' ? new URLSearchParams({ From: '+19025550100' }) : undefined
  });

  return {
    name,
    url,
    method,
    status: response.status,
    ok: response.status === requiredStatus,
    contentType: response.headers.get('content-type') || null
  };
};

const run = async () => {
  const results = [];
  for (const check of checks) {
    try {
      results.push(await requestCheck(check));
    } catch (error) {
      results.push({
        name: check.name,
        url: `${baseUrl}${check.path}`,
        method: check.method || 'GET',
        ok: false,
        error: error.message
      });
    }
  }

  const ok = results.every((result) => result.ok);
  console.log(JSON.stringify({ ok, baseUrl, results }, null, 2));
  process.exit(ok ? 0 : 1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
