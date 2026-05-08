const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const logger = require("../lib/logger");

// ── Secrets & config ────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const SALT_ROUNDS = 10;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token (15 min by default).
 * Returned in the JSON response body — held in memory by the client.
 */
function signAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * Sign a long-lived refresh token (7 days).
 * Delivered as an HttpOnly cookie — never exposed to JS.
 */
function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * SHA-256 hash a raw refresh token before storing in the DB.
 * If the DB is compromised, the attacker cannot replay the tokens.
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Persist a refresh token hash in the database.
 */
async function storeRefreshToken(userId, rawToken) {
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

/**
 * Set the refresh token as an HttpOnly cookie.
 */
function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/",
  });
}

/**
 * Clear the refresh token cookie.
 */
function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
  });
}

// ── Route handlers ──────────────────────────────────────────────────────────

exports.signup = async (req, res) => {
  const { email, password, full_name, user_type, service_category_id, entity_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Acquire a dedicated client so we can run an explicit transaction.
  const client = await pool.connect();

  try {
    // ── Duplicate-email check (outside the transaction — read-only, fast) ─────
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Begin transaction ─────────────────────────────────────────────────────
    await client.query("BEGIN");

    // 1. Insert the user (service_category_id lives in profiles, not here)
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, entity_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      [email, hash, full_name || null, user_type || null, entity_name || null],
    );

    const user = rows[0];

    // 2. Insert the matching profile row.
    //    ON CONFLICT DO UPDATE handles the case where the trigger already created
    //    a stub profile row between the users INSERT and this statement.
    await client.query(
      `INSERT INTO profiles (id, user_type, full_name, service_category_id, entity_name, is_admin)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       ON CONFLICT (id) DO UPDATE
         SET user_type           = EXCLUDED.user_type,
             full_name           = EXCLUDED.full_name,
             service_category_id = EXCLUDED.service_category_id,
             entity_name         = EXCLUDED.entity_name`,
      [
        user.id,
        user_type || null,
        full_name || null,
        user_type === "supplier" ? (service_category_id || null) : null,
        user_type === "government_entity" ? (entity_name || null) : null,
      ],
    );

    await client.query("COMMIT");

    // ── Issue tokens after a successful commit ────────────────────────────────
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await storeRefreshToken(user.id, refreshToken);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await storeRefreshToken(user.id, refreshToken);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    logger.error("login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /auth/refresh
 *
 * Reads the refresh token from the HttpOnly cookie, verifies it,
 * checks the hash against the DB, then rotates: deletes the old
 * token and issues a brand-new pair.
 */
exports.refresh = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    // 1. Verify the JWT signature & expiry
    const payload = jwt.verify(rawToken, REFRESH_TOKEN_SECRET);

    // 2. Check the hash exists in the DB (not yet revoked)
    const tokenHash = hashToken(rawToken);
    const { rows } = await pool.query(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash],
    );

    if (rows.length === 0) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh token revoked or expired" });
    }

    const storedToken = rows[0];

    // 3. Fetch the user
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [payload.id],
    );

    if (userResult.rows.length === 0) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // 4. Rotate: delete old token, issue new pair
    await pool.query("DELETE FROM refresh_tokens WHERE id = $1", [storedToken.id]);

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    await storeRefreshToken(user.id, newRefreshToken);
    setRefreshCookie(res, newRefreshToken);

    return res.json({ accessToken: newAccessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    // JWT verification failed (expired, tampered, etc.)
    clearRefreshCookie(res);
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    logger.error("refresh error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.me = async (req, res) => {
  // req.user is set by the authenticate middleware
  try {
    const { rows } = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const accessToken = signAccessToken(user);

    return res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    logger.error("me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /auth/logout
 *
 * Deletes the refresh token from the DB and clears the cookie.
 */
exports.logout = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    try {
      const tokenHash = hashToken(rawToken);
      await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    } catch (err) {
      logger.error("logout error (non-fatal):", err);
      // Continue — clear cookie regardless
    }
  }

  clearRefreshCookie(res);
  return res.status(204).end();
};
