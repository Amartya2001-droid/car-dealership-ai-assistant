// req.path (not req.originalUrl) is used deliberately: it excludes the query
// string, so admin ?api_key=... values never end up in stdout logs.
const createRequestLogger = ({ logger = console, now = () => process.hrtime.bigint() } = {}) => (req, res, next) => {
  const startedAt = now();

  res.on('finish', () => {
    const durationMs = Number(now() - startedAt) / 1e6;

    logger.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        ip: req.ip
      })
    );
  });

  next();
};

module.exports = {
  createRequestLogger
};
