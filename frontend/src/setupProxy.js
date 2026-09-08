const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = app => app.use(createProxyMiddleware({pathFilter: ['/api','/health','/admin','/showroom','/simulate','/webhooks','/config'], target:process.env.REACT_APP_BACKEND_PROXY_TARGET||'http://localhost:3000', changeOrigin:true}));
