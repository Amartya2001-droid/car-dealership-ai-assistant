const config = require('./config');
const requestPath = (req) => (req.originalUrl || '').split('?')[0];

const createNotFoundHandler = () => (req, res) => {
  res.status(404).json({ error: 'Not found', path: requestPath(req) });
};

const createErrorHandler = ({ exposeDetails = config.exposeErrorDetails } = {}) => (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  console.error(`Request failed: ${req.method} ${requestPath(req)} (${status})`);
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
