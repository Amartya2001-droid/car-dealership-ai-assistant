const config = require('./config');

const getPersistenceStatus = () => {
  const supabaseConfigured = Boolean(config.supabase.url && config.supabase.anonKey);

  return {
    provider: config.storageProvider,
    supabaseConfigured,
    mode:
      config.storageProvider === 'supabase' && supabaseConfigured
        ? 'remote_ready'
        : 'local_fallback'
  };
};

module.exports = {
  getPersistenceStatus
};
