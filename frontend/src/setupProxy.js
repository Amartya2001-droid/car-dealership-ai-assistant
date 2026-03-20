const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const target = process.env.REACT_APP_BACKEND_PROXY_TARGET || 'http://localhost:3000';

  // Proxy backend API endpoints during local dashboard development.
  app.use(
    createProxyMiddleware(['/health', '/admin', '/showroom', '/simulate', '/webhooks', '/config'], {
      target,
      changeOrigin: true,
      logLevel: 'debug',
    })
  );
};
