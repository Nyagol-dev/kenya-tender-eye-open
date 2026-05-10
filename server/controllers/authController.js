const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const logger = require('../lib/logger');
const { initOnboarding } = require('./onboardingController');

const SALT_ROUNDS = 10;
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function signAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
}

exports.signup = async (req, res) => {
  try {
    const { email, password, full_name, user_type, entity_name, service_category_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, entity_name) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
        [email, password_hash, full_name, user_type, entity_name]
      );
      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO profiles (id, user_type, full_name, service_category_id, entity_name, is_admin) 
         VALUES ($1, $2, $3, $4, $5, false)`,
        [user.id, user_type, full_name, service_category_id, entity_name]
      );

      if (user_type === 'supplier') {
        await initOnboarding(client, user.id);
      }

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
         VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      await client.query('COMMIT');

      setRefreshCookie(res, refreshToken);
      return res.status(201).json({ token: accessToken, user: { id: user.id, email: user.email } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }


    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    setRefreshCookie(res, refreshToken);
    return res.json({ token: accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    logger.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token revoked or expired' });
    }

    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const accessToken = signAccessToken(user);

    return res.json({ token: accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    logger.error('refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const accessToken = signAccessToken(user);

    return res.json({ token: accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    logger.error('me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshToken]);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.status(204).end();
  } catch (err) {
    logger.error('logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
