const config = require('./config');

// Fixed-window counter keyed by client IP. Deliberately in-memory and
// single-process: this app runs as one instance per deployment today, and a
// shared store (Redis, etc.) would be over-engineering until that changes.
const createRateLimiter = ({
  windowMs = config.rateLimit.windowMs,
  max = config.rateLimit.max,
  keyGenerator = (req) => req.ip,
  clock = Date.now,
  // Every distinct key (IP) that ever hits this route gets an entry that
  // otherwise only clears by being overwritten on that same key's next
  // window — a scan/bot sweep from many IPs would grow this Map forever on
  // a long-running process. Sweep expired entries every few windows.
  sweepEveryNCalls = 200
} = {}) => {
  const hits = new Map();
  let callsSinceSweep = 0;

  const sweepExpired = (now) => {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  const middleware = (req, res, next) => {
    const key = keyGenerator(req);
    const now = clock();

    callsSinceSweep += 1;
    if (callsSinceSweep >= sweepEveryNCalls) {
      callsSinceSweep = 0;
      sweepExpired(now);
    }

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

  // Test-only introspection hook — not part of the request-handling contract.
  middleware.getTrackedKeyCount = () => hits.size;

  return middleware;
};

module.exports = {
  createRateLimiter
};
