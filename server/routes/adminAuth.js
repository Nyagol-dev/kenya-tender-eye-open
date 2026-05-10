'use strict';

const { Router } = require('express');
const adminAuth = require('../controllers/adminAuthController');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const rateLimit = require('../middleware/rateLimit');

const router = Router();

// Stricter limiter for admin login — 5 attempts per 15 min per IP+route
const adminLoginLimiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });

// POST /admin/auth/login
router.post('/login', adminLoginLimiter, adminAuth.adminLogin);

// POST /admin/auth/logout  (token required — prevents CSRF-style logout spam)
router.post('/logout', authenticateAdmin, adminAuth.adminLogout);

// GET  /admin/auth/me
router.get('/me', authenticateAdmin, adminAuth.adminMe);

module.exports = router;
