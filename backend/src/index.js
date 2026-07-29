const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Allow both local and Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes     = require('./routes/auth');
const courseRoutes   = require('./routes/courses');
const chatRoutes     = require('./routes/chat');
const materialRoutes = require('./routes/materials');
const adminRoutes    = require('./routes/admin');

app.use('/api/auth',      authRoutes);
app.use('/api/courses',   courseRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admin',     adminRoutes);

// Health check — Railway uses this to confirm app is running
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Study Assistant Backend Running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});