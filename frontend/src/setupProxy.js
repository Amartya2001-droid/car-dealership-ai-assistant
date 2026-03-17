const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy Express backend endpoints to localhost:3001
  app.use(
    ['/health', '/admin', '/showroom', '/simulate', '/webhooks', '/config'],
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
    })
  );
};
