// NOTE: run: npm install cookie-parser
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./lib/logger');
const pool = require('./db/pool');
const { scheduleCleanup } = require('./lib/onboardingScheduler');

scheduleCleanup();

const fs = require('fs');

(async () => {
  try {
    // 1. Run 005 migration automatically if it hasn't run
    const migrationCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_onboarding'
      );
    `);
    
    if (!migrationCheck.rows[0].exists) {
      const sql = fs.readFileSync(path.join(__dirname, 'db/migrations/005_admin_onboarding_bids.sql'), 'utf-8');
      await pool.query(sql);
      logger.info('Ran migration 005_admin_onboarding_bids.sql');
    }

    // 2. Seed service categories
    const { rows } = await pool.query('SELECT count(*) FROM service_categories');
    if (parseInt(rows[0].count) === 0) {
      const cats = ['IT Services', 'Construction', 'Consulting', 'Supplies', 'Healthcare'];
      for (const cat of cats) {
        await pool.query('INSERT INTO service_categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [cat]);
      }
      logger.info('Seeded default service categories.');
    }
  } catch (err) {
    logger.error('Failed startup database initialization:', err);
  }
})();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const serviceCategoryRoutes = require('./routes/serviceCategories');
const tenderRoutes = require('./routes/tenders');
const notificationRoutes = require('./routes/notifications');
const adminAuthRoutes = require('./routes/adminAuth');
const adminPortalRoutes = require('./routes/adminPortal');
const onboardingRoutes = require('./routes/onboarding');
const bidRoutes = require('./routes/bids');

const authenticate = require('./middleware/authenticate');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('./middleware/rateLimit');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ 
      method: req.method, 
      url: req.url, 
      status: res.statusCode, 
      ms: Date.now() - start 
    });
  });
  next();
});

app.use('/api/auth/login', rateLimit({ max: 5 }));
app.use('/api/auth/signup', rateLimit({ max: 5 }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminPortalRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/bids', bidRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/debug-setup', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const sql = fs.readFileSync(path.join(__dirname, 'db/migrations/005_admin_onboarding_bids.sql'), 'utf-8');
    
    // Make CREATE TABLE statements safe
    const safeSql = sql.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
    await pool.query(safeSql);
    
    // Seed admin if missing
    await pool.query(`
      INSERT INTO admin_users (email, password_hash, full_name, role)
      VALUES ('admin@eprocurement.go.ke', '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'System Admin', 'super_admin')
      ON CONFLICT (email) DO UPDATE SET is_active = true
    `);
    
    res.json({ success: true, message: 'Setup completed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

app.get('/api/debug-data', async (req, res) => {
  try {
    const adminRes = await pool.query('SELECT * FROM admin_users');
    res.json(adminRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`Server on port ${PORT}`));

process.on('SIGTERM', () => {
  server.close(() => { 
    pool.end(); 
    process.exit(0); 
  });
});
