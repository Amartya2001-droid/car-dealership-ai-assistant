const config = require('../src/config');
const { getPersistenceStatus } = require('../src/persistence');

const requiredBase = ['DEALERSHIP_NAME', 'DEFAULT_PERSONA', 'STORAGE_PROVIDER'];
const requiredTwilio = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
const requiredSupabase = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

const missing = [];

for (const name of requiredBase) {
  if (!process.env[name]) missing.push(name);
}

if (config.twilio.accountSid || config.twilio.authToken || config.twilio.phoneNumber) {
  for (const name of requiredTwilio) {
    if (!process.env[name]) missing.push(name);
  }
}

if (config.storageProvider === 'supabase') {
  for (const name of requiredSupabase) {
    if (!process.env[name]) missing.push(name);
  }
}

console.log(
  JSON.stringify(
    {
      ok: missing.length === 0,
      storage: getPersistenceStatus(),
      missing
    },
    null,
    2
  )
);
