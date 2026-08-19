require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── CORS ─────────────────────────────────────────────
// Allow all origins to fix Vercel → Render CORS issue
app.use(cors({
  origin: true,
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
app.use('/api/feedback',   require('./routes/feedback'));
app.use('/api/bookmarks',  require('./routes/bookmarks'));
app.use('/api/quiz',       require('./routes/quiz'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/admin', require('./routes/analytics'));

// ── Health Check ─────────────────────────────────────
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});