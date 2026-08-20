const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// The public application is started from this directory, while the local
// development credentials are kept with the backend source. Prefer a root
// .env when one exists, then fall back to backend/.env for the documented
// project layout.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

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
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/notifications', notificationRoutes);
// Explicit HTML page routes – ensures every dashboard is served correctly
// even if express.static has path-matching issues on some systems
const sendPage = (...parts) => (_req, res) => res.sendFile(path.join(__dirname, 'frontend', ...parts));
app.get('/dashboard.html',           sendPage('dashboard.html'));
app.get('/business/dashboard.html', sendPage('business', 'dashboard.html'));
app.get('/ngo/dashboard.html',      sendPage('ngo',      'dashboard.html'));
app.get('/volunteer/dashboard.html',sendPage('volunteer', 'dashboard.html'));
app.get('/admin/dashboard.html',    sendPage('admin',     'dashboard.html'));
app.get('/donate.html',             sendPage('donate.html'));
app.get('/login.html',              sendPage('login.html'));
app.get('/register.html',           sendPage('register.html'));
app.get('/freshness.html',          sendPage('freshness.html'));
app.get('/404.html',                sendPage('404.html'));

// JSON 404 for unmatched API routes
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// HTML 404 for everything else — serve the branded not-found page
app.get('*', (_req, res) => res.status(404).sendFile(path.join(__dirname, 'frontend', '404.html')));

app.use((error, _req, res, _next) => {
  console.error(error);
  const databaseUnavailable = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR'
  ]);
  if (databaseUnavailable.has(error.code)) {
    return res.status(503).json({ success: false, message: 'The FoodBridge database is unavailable. Start MySQL, then try again.' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxSize = _req.uploadImageMaxSize || '5MB';
    return res.status(400).json({ success: false, message: `Image size must not exceed ${maxSize}.` });
  }
  if (error.message?.includes('Only PNG')) return res.status(400).json({ success: false, message: error.message });
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
});

const { seedAdminAccount } = require('./services/adminSeed');

app.listen(port, () => {
  console.log(`FoodBridge auth API listening on port ${port}`);
  seedAdminAccount();
});

