const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  res.status(201).json({ message: 'User registered', email, id: 'user-' + Date.now() });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  res.json({ token: 'jwt-token-placeholder', email, expiresIn: '24h' });
});

// Verify token
app.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  res.json({ valid: true, user: 'user-123' });
});

app.listen(PORT, () => {
  console.log(`[auth-service] Listening on port ${PORT}`);
});

module.exports = app;
