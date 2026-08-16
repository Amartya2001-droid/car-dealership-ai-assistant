const { validateRequest } = require('twilio/lib/webhooks/webhooks');

const config = require('./config');

const getTwilioWebhookSecurityStatus = ({
  authToken = config.twilio.authToken,
  validationEnabled = config.validateTwilioWebhooks
} = {}) => {
  if (!authToken) return 'unconfigured';
  return validationEnabled ? 'enforced' : 'disabled';
};

// Twilio signs the exact public URL it requested, so the guard reconstructs it
// from BASE_URL rather than trusting Host/X-Forwarded-* headers behind proxies.
const buildWebhookUrl = (baseUrl, originalUrl) => new URL(originalUrl, baseUrl).toString();

const isValidTwilioSignature = ({ authToken, signature, url, params }) => {
  if (!authToken || !signature || !url) return false;
  return validateRequest(authToken, signature, url, params || {});
};

const createTwilioWebhookGuard = ({
  authToken = config.twilio.authToken,
  baseUrl = config.baseUrl,
  enabled = config.validateTwilioWebhooks
} = {}) => {
  return (req, res, next) => {
    if (!enabled || !authToken) {
      return next();
    }

    const signature = req.headers['x-twilio-signature'];
    const url = buildWebhookUrl(baseUrl, req.originalUrl);

    if (isValidTwilioSignature({ authToken, signature, url, params: req.body })) {
      return next();
    }

    return res.status(403).json({ error: 'Invalid Twilio webhook signature.' });
  };
};

module.exports = {
  getTwilioWebhookSecurityStatus,
  buildWebhookUrl,
  isValidTwilioSignature,
  createTwilioWebhookGuard
};
