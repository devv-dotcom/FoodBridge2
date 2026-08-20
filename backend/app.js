require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '..')));

app.get('/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'FoodBridge authentication API is healthy.' });
  } catch (error) { next(error); }
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxSize = _req.uploadImageMaxSize || '5MB';
    return res.status(400).json({ success: false, message: `Image size must not exceed ${maxSize}.` });
  }
  if (error.message?.includes('Only PNG')) return res.status(400).json({ success: false, message: error.message });
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
});

app.listen(port, () => console.log(`FoodBridge auth API listening on port ${port}`));
