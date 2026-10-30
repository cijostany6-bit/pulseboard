const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8084;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://pulseboard:password@localhost:5432/pulseboard';

const redis = new Redis(REDIS_URL);
const pool = new Pool({ connectionString: DATABASE_URL });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'alert-manager', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await redis.ping();
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', service: 'alert-manager', redis: 'connected', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', service: 'alert-manager', error: err.message });
  }
});

// Subscribe to health results
const subscriber = new Redis(REDIS_URL);
subscriber.subscribe('health-results', (err) => {
  if (err) console.error('[alert-manager] Failed to subscribe:', err);
  else console.log('[alert-manager] Subscribed to health-results channel');
});

subscriber.on('message', (channel, message) => {
  try {
    const result = JSON.parse(message);
    console.log(`[alert-manager] Received health result: ${result.service} = ${result.status}`);
    if (result.status === 'unhealthy') {
      console.log(`[alert-manager] ALERT: ${result.service} is unhealthy!`);
      // In production: send Slack/email notification
    }
  } catch (err) {
    console.error('[alert-manager] Failed to parse message:', err);
  }
});

// List alert rules
app.get('/rules', (req, res) => {
  res.json([
    { id: 1, service: 'api-gateway', condition: 'status == unhealthy', channel: 'slack', enabled: true },
    { id: 2, service: 'auth-service', condition: 'responseTime > 500ms', channel: 'email', enabled: true }
  ]);
});

// Create alert rule
app.post('/rules', (req, res) => {
  const { service, condition, channel } = req.body;
  if (!service || !condition) {
    return res.status(400).json({ error: 'service and condition required' });
  }
  res.status(201).json({ id: Date.now(), service, condition, channel: channel || 'slack', enabled: true });
});

// Get alert history
app.get('/history', (req, res) => {
  res.json([
    { id: 1, service: 'api-gateway', message: 'Service recovered', severity: 'info', timestamp: new Date().toISOString() },
    { id: 2, service: 'auth-service', message: 'High response time detected', severity: 'warning', timestamp: new Date(Date.now() - 300000).toISOString() }
  ]);
});

app.listen(PORT, () => {
  console.log(`[alert-manager] Listening on port ${PORT}`);
});

module.exports = app;
