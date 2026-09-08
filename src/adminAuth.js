const crypto = require('crypto');

const config = require('./config');

const getAdminAuthStatus = ({ apiKey = config.adminApiKey } = {}) => (apiKey ? 'enforced' : 'unconfigured');

const timingSafeEqualStrings = (a, b) => {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

// Opt-in, mirroring the Twilio webhook guard: with no ADMIN_API_KEY set,
// local/demo deployments behave exactly as before. Once a key is set, it is
// required via the x-admin-api-key header on every guarded
// admin route.
const createAdminAuthGuard = ({ apiKey = config.adminApiKey } = {}) => (req, res, next) => {
  if (!apiKey) {
    if (config.nodeEnv === 'production') return res.status(503).json({ error: 'Admin access is not configured.' });
    return next();
  }

  const candidate = req.headers['x-admin-api-key'];

  if (candidate && timingSafeEqualStrings(candidate, apiKey)) {
    return next();
  }

  return res.status(401).json({ error: 'Missing or invalid admin API key.' });
};

module.exports = {
  getAdminAuthStatus,
  createAdminAuthGuard
};
