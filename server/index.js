// NOTE: run: npm install cookie-parser
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./lib/logger');
const pool = require('./db/pool');
const { scheduleCleanup } = require('./lib/onboardingScheduler');

scheduleCleanup();


const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const serviceCategoryRoutes = require('./routes/serviceCategories');
const tenderRoutes = require('./routes/tenders');
const notificationRoutes = require('./routes/notifications');
const adminAuthRoutes = require('./routes/adminAuth');
const onboardingRoutes = require('./routes/onboarding');

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
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`Server on port ${PORT}`));

process.on('SIGTERM', () => {
  server.close(() => { 
    pool.end(); 
    process.exit(0); 
  });
});
