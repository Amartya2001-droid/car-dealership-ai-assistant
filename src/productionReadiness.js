const config = require('./config');
const { getPersistenceStatus } = require('./persistence');
const { getDashboardReadiness } = require('./dashboardMeta');

const REQUIRED_BASE = ['DEALERSHIP_NAME', 'DEFAULT_PERSONA', 'STORAGE_PROVIDER', 'BASE_URL'];
const REQUIRED_TWILIO = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
const REQUIRED_SUPABASE = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const REQUIRED_OPENAI = ['OPENAI_API_KEY'];

const missingFromEnv = (names, env) => names.filter((name) => !env[name]);

const getIntegrationStatus = () => ({
  openai: config.useMockAi ? 'mock' : config.openaiApiKey ? 'configured' : 'missing',
  twilio: config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber ? 'configured' : 'missing',
  googleCalendar: config.googleCalendar.calendarId && config.googleCalendar.accessToken ? 'configured' : 'disabled'
});

const buildProductionReadiness = ({ env = process.env, baseUrl = config.baseUrl } = {}) => {
  const missingProduction = [
    ...missingFromEnv(REQUIRED_BASE, env),
    ...missingFromEnv(REQUIRED_TWILIO, env),
    ...missingFromEnv(REQUIRED_SUPABASE, env)
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

  const storage = getPersistenceStatus();
  const dashboard = getDashboardReadiness(baseUrl);
  const localRunnable = Boolean(config.dealershipName && config.defaultPersona && config.storageProvider);
  const productionReady =
    missingProduction.length === 0 && storage.activeProvider === 'supabase' && !config.useMockAi && dashboard.ready;

  return {
    ok: productionReady,
    localRunnable,
    productionReady,
    storage,
    dashboard,
    integrations: getIntegrationStatus(),
    missingProduction,
    warnings,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildProductionReadiness,
  REQUIRED_BASE,
  REQUIRED_TWILIO,
  REQUIRED_SUPABASE,
  REQUIRED_OPENAI
};
