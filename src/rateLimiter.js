const config = require('./config');

// Fixed-window counter keyed by client IP. Deliberately in-memory and
// single-process: this app runs as one instance per deployment today, and a
// shared store (Redis, etc.) would be over-engineering until that changes.
const createRateLimiter = ({
  windowMs = config.rateLimit.windowMs,
  max = config.rateLimit.max,
  keyGenerator = (req) => req.ip,
  clock = Date.now
} = {}) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = clock();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    entry.count += 1;
    return next();
  };
};

module.exports = {
  createRateLimiter
};
