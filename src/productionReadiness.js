const config = require('./config');
const { getPersistenceStatus } = require('./persistence');
const { getDashboardReadiness } = require('./dashboardMeta');
const { getTwilioWebhookSecurityStatus } = require('./twilioSecurity');
const { getAdminAuthStatus } = require('./adminAuth');

const REQUIRED_BASE = ['DEALERSHIP_NAME', 'DEFAULT_PERSONA', 'STORAGE_PROVIDER', 'BASE_URL'];
const REQUIRED_TWILIO = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
const REQUIRED_SUPABASE = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const REQUIRED_OPENAI = ['OPENAI_API_KEY'];
const REQUIRED_ADMIN = ['ADMIN_API_KEY'];

const missingFromEnv = (names, env) => names.filter((name) => !env[name]);
const hasAny = (names, values) => names.some((name) => values.includes(name));

const getIntegrationStatus = () => ({
  openai: config.useMockAi ? 'mock' : config.openaiApiKey ? 'configured' : 'missing',
  twilio: config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber ? 'configured' : 'missing',
  twilioWebhookSecurity: getTwilioWebhookSecurityStatus(),
  adminAuth: getAdminAuthStatus(),
  googleCalendar: config.googleCalendar.calendarId && config.googleCalendar.accessToken ? 'configured' : 'disabled'
});

const buildNextSteps = ({ missingProduction, storage, dashboard, integrations }) => {
  const nextSteps = [];

  if (hasAny(REQUIRED_BASE, missingProduction)) {
    nextSteps.push('Populate the base production environment values from .env.production.example.');
  }

  if (hasAny(REQUIRED_SUPABASE, missingProduction) || storage.activeProvider !== 'supabase') {
    nextSteps.push('Configure Supabase credentials and switch STORAGE_PROVIDER to supabase.');
  }

  if (integrations.openai === 'mock') {
    nextSteps.push('Disable USE_MOCK_AI and provide a real OPENAI_API_KEY before customer-facing use.');
  } else if (hasAny(REQUIRED_OPENAI, missingProduction)) {
    nextSteps.push('Set OPENAI_API_KEY for live AI replies.');
  }

  if (hasAny(REQUIRED_TWILIO, missingProduction)) {
    nextSteps.push('Add Twilio credentials and point the phone number webhook to /webhooks/twilio/voice.');
  }

  if (hasAny(REQUIRED_ADMIN, missingProduction)) {
    nextSteps.push(
      'Set ADMIN_API_KEY to require authentication on lead, appointment, and follow-up admin routes.'
    );
  }

  if (!dashboard.ready) {
    nextSteps.push('Rebuild the dashboard bundle so /ops-dashboard/ is available on the deployed service.');
  }

  nextSteps.push('Run DEPLOYMENT_URL=https://your-public-url npm run verify:production-url against the deployed backend.');

  return nextSteps;
};

const buildProductionReadiness = ({ env = process.env, baseUrl = config.baseUrl } = {}) => {
  const missingProduction = [
    ...missingFromEnv(REQUIRED_BASE, env),
    ...missingFromEnv(REQUIRED_TWILIO, env),
    ...missingFromEnv(REQUIRED_SUPABASE, env),
    ...missingFromEnv(REQUIRED_ADMIN, env)
  ];

  const warnings = [];

  if (!config.useMockAi) {
    missingProduction.push(...missingFromEnv(REQUIRED_OPENAI, env));
  } else {
    warnings.push('USE_MOCK_AI is enabled; production voice replies will not use OpenAI until mock mode is disabled.');
  }

  if (config.storageProvider !== 'supabase') {
    warnings.push('STORAGE_PROVIDER is not supabase; production data will use local fallback storage.');
  }

  if (config.twilio.authToken && !config.validateTwilioWebhooks) {
    warnings.push(
      'TWILIO_VALIDATE_WEBHOOKS is disabled; incoming voice webhooks will not verify Twilio signatures.'
    );
  }

  const storage = getPersistenceStatus();
  const dashboard = getDashboardReadiness(baseUrl);
  const localRunnable = Boolean(config.dealershipName && config.defaultPersona && config.storageProvider);
  const productionReady =
    missingProduction.length === 0 && storage.activeProvider === 'supabase' && !config.useMockAi && dashboard.ready;
  const integrations = getIntegrationStatus();

  return {
    ok: productionReady,
    localRunnable,
    productionReady,
    storage,
    dashboard,
    integrations,
    missingProduction,
    warnings,
    nextSteps: buildNextSteps({ missingProduction, storage, dashboard, integrations }),
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildProductionReadiness,
  REQUIRED_BASE,
  REQUIRED_TWILIO,
  REQUIRED_SUPABASE,
  REQUIRED_OPENAI,
  REQUIRED_ADMIN
};
