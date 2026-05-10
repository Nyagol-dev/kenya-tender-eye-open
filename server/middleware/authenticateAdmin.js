'use strict';

const jwt = require('jsonwebtoken');

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET;

/**
 * Middleware: authenticateAdmin
 *
 * Accepts the admin JWT from either:
 *   1. Authorization: Bearer <token>   (preferred for API clients / Swagger)
 *   2. adminToken HttpOnly cookie       (used by the admin SPA)
 *
 * Rejects tokens that:
 *   - are missing or malformed
 *   - fail signature verification (wrong secret / tampered)
 *   - do not carry `isAdmin: true` (blocks regular user tokens)
 *
 * On success, sets req.admin = { id, email, role }.
 */
function authenticateAdmin(req, res, next) {
  // ── 1. Extract raw token ────────────────────────────────────────────────
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  // ── 2. Verify signature & expiry ────────────────────────────────────────
  let payload;
  try {
    payload = jwt.verify(token, ADMIN_SECRET);
  } catch {
    return res.status(401).json({ message: 'Admin token expired or invalid' });
  }

  // ── 3. Reject regular-user tokens that somehow reach this middleware ────
  if (payload.isAdmin !== true) {
    return res.status(401).json({ message: 'Admin token required' });
  }

  // ── 4. Attach admin context for downstream handlers ─────────────────────
  req.admin = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  next();
}

module.exports = authenticateAdmin;
