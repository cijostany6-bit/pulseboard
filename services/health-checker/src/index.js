const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 8082;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'health-checker', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await redis.ping();
    res.status(200).json({ status: 'ready', service: 'health-checker', redis: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', service: 'health-checker', redis: 'disconnected' });
  }
});

// Register a service to monitor
app.post('/services', (req, res) => {
  const { name, url, interval } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'name and url required' });
  }
  const service = { name, url, interval: interval || 30000, status: 'unknown', lastCheck: null };
  res.status(201).json(service);
});

// List monitored services
app.get('/services', (req, res) => {
  res.json([
    { name: 'api-gateway', url: 'http://api-gateway:8080/health', status: 'healthy', lastCheck: new Date().toISOString() },
    { name: 'auth-service', url: 'http://auth-service:8081/health', status: 'healthy', lastCheck: new Date().toISOString() }
  ]);
});

// Get health status of a specific service
app.get('/services/:name', (req, res) => {
  res.json({ name: req.params.name, status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 45 });
});

// Trigger a health check
app.post('/check/:name', async (req, res) => {
  const { name } = req.params;
  const start = Date.now();
  try {
    // Simulated health check
    const responseTime = Date.now() - start;
    const result = { service: name, status: 'healthy', responseTime, checkedAt: new Date().toISOString() };
    await redis.publish('health-results', JSON.stringify(result));
    res.json(result);
  } catch (err) {
    const result = { service: name, status: 'unhealthy', error: err.message, checkedAt: new Date().toISOString() };
    await redis.publish('health-results', JSON.stringify(result));
    res.status(503).json(result);
  }
});

app.listen(PORT, () => {
  console.log(`[health-checker] Listening on port ${PORT}`);
});

module.exports = app;
