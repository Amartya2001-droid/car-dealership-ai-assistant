const config = require('./config');

const createNotFoundHandler = () => (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
};

const createErrorHandler = ({ exposeDetails = config.exposeErrorDetails } = {}) => (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  const status = Number.isInteger(err.status) ? err.status : 500;
  const body = { error: err.expose ? err.message : 'Internal server error' };

  if (exposeDetails) {
    body.message = err.message;
    body.stack = err.stack;
  }

  res.status(status).json(body);
};

module.exports = {
  createNotFoundHandler,
  createErrorHandler
};
