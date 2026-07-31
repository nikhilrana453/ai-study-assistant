require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── CORS ─────────────────────────────────────────────
// Allows localhost for dev and Vercel URL for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ───────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/courses',   require('./routes/courses'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/admin',     require('./routes/admin'));

// ── Health Check ─────────────────────────────────────
// Railway checks this to confirm app is running
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'AI Study Assistant API Running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Study Assistant Backend Running' });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

// ── Start Server ──────────────────────────────────────
// 0.0.0.0 required for Railway to expose the port
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});