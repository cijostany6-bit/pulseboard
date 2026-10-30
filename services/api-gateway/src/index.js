const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check (liveness - process is up)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Readiness check (readiness - can serve traffic)
app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Route info
app.get('/', (req, res) => {
  res.json({
    service: 'PulseBoard API Gateway',
    version: '1.0.0',
    routes: {
      '/health': 'Liveness probe',
      '/ready': 'Readiness probe',
      '/api/auth': 'Auth service proxy',
      '/api/health-checks': 'Health checker proxy',
      '/api/metrics': 'Metrics collector proxy',
      '/api/alerts': 'Alert manager proxy'
    }
  });
});

// Proxy routes (simplified - in production use http-proxy-middleware)
app.get('/api/health-checks', (req, res) => {
  res.json({ message: 'Proxy to health-checker service', target: 'http://health-checker:8082' });
});

app.get('/api/metrics', (req, res) => {
  res.json({ message: 'Proxy to metrics-collector service', target: 'http://metrics-collector:8083' });
});

app.get('/api/alerts', (req, res) => {
  res.json({ message: 'Proxy to alert-manager service', target: 'http://alert-manager:8084' });
});

app.listen(PORT, () => {
  console.log(`[api-gateway] Listening on port ${PORT}`);
});

module.exports = app;
