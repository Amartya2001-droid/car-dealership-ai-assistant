const config = require('./config');
const { canUseSupabase } = require('./dataStore');

const getPersistenceStatus = () => {
  const supabaseConfigured = Boolean(config.supabase.url && config.supabase.anonKey);
  const remoteReady = canUseSupabase();

  return {
    provider: config.storageProvider,
    supabaseConfigured,
    mode: remoteReady ? 'remote_ready' : 'local_fallback',
    activeProvider: remoteReady ? 'supabase' : 'local_json'
  };
};

module.exports = {
  getPersistenceStatus
};
