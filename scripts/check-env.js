const config = require('../src/config');
const { getPersistenceStatus } = require('../src/persistence');

const requiredBase = ['DEALERSHIP_NAME', 'DEFAULT_PERSONA', 'STORAGE_PROVIDER', 'BASE_URL'];
const requiredTwilio = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
const requiredSupabase = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const requiredOpenAi = ['OPENAI_API_KEY'];

const missingProduction = [];
const warnings = [];

for (const name of requiredBase) {
  if (!process.env[name]) missingProduction.push(name);
}

for (const name of requiredTwilio) {
  if (!process.env[name]) missingProduction.push(name);
}

for (const name of requiredSupabase) {
  if (!process.env[name]) missingProduction.push(name);
}

if (!config.useMockAi) {
  for (const name of requiredOpenAi) {
    if (!process.env[name]) missingProduction.push(name);
  }
} else {
  warnings.push('USE_MOCK_AI is enabled; production voice replies will not use OpenAI until mock mode is disabled.');
}

if (config.storageProvider !== 'supabase') {
  warnings.push('STORAGE_PROVIDER is not supabase; production data will use local fallback storage.');
}

const storage = getPersistenceStatus();
const localRunnable = Boolean(config.dealershipName && config.defaultPersona && config.storageProvider);
const productionReady = missingProduction.length === 0 && storage.activeProvider === 'supabase' && !config.useMockAi;

console.log(
  JSON.stringify(
    {
      ok: productionReady,
      localRunnable,
      productionReady,
      storage,
      integrations: {
        openai: config.useMockAi ? 'mock' : config.openaiApiKey ? 'configured' : 'missing',
        twilio: config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber ? 'configured' : 'missing',
        googleCalendar:
          config.googleCalendar.calendarId && config.googleCalendar.accessToken ? 'configured' : 'disabled'
      },
      missingProduction,
      warnings
    },
    null,
    2
  )
);
