const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8083;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://pulseboard:password@localhost:5432/pulseboard';

const pool = new Pool({ connectionString: DATABASE_URL });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'metrics-collector', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', service: 'metrics-collector', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', service: 'metrics-collector', db: 'disconnected' });
  }
});

// Record a metric
app.post('/metrics', async (req, res) => {
  const { service, cpu, memory, responseTime } = req.body;
  if (!service) {
    return res.status(400).json({ error: 'service name required' });
  }
  const metric = { service, cpu: cpu || 0, memory: memory || 0, responseTime: responseTime || 0, recordedAt: new Date().toISOString() };
  res.status(201).json(metric);
});

// Get metrics for a service
app.get('/metrics/:service', (req, res) => {
  res.json({
    service: req.params.service,
    metrics: [
      { cpu: 12.5, memory: 45.2, responseTime: 42, recordedAt: new Date().toISOString() },
      { cpu: 15.1, memory: 48.7, responseTime: 38, recordedAt: new Date(Date.now() - 60000).toISOString() }
    ]
  });
});

// Get aggregated metrics
app.get('/metrics', (req, res) => {
  res.json({
    services: [
      { name: 'api-gateway', avgCpu: 14.2, avgMemory: 47.1, avgResponseTime: 40, status: 'healthy' },
      { name: 'auth-service', avgCpu: 8.5, avgMemory: 32.3, avgResponseTime: 25, status: 'healthy' },
      { name: 'health-checker', avgCpu: 5.1, avgMemory: 28.9, avgResponseTime: 15, status: 'healthy' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`[metrics-collector] Listening on port ${PORT}`);
});

module.exports = app;
