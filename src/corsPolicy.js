const parseAllowedOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// With no ALLOWED_ORIGINS configured, all origins are reflected (matches the
// prior unrestricted `cors()` default) so local/demo setups keep working.
const buildCorsOptions = (allowedOrigins = []) => {
  if (allowedOrigins.length === 0) {
    return { origin: true };
  }

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
    }
  };
};

module.exports = {
  parseAllowedOrigins,
  buildCorsOptions
};
