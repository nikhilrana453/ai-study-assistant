require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes added week by week
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/courses',   require('./routes/courses'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/admin',     require('./routes/admin'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});