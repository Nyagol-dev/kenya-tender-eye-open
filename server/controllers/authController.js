const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

exports.signup = async (req, res) => {
  const { email, password, full_name, user_type, service_category_id, entity_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, service_category_id, entity_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email`,
      [email, hash, full_name || null, user_type || null, service_category_id || null, entity_name || null],
    );

    const user = rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
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

    const token = signToken(user);

    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
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
    const token = signToken(user);

    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.logout = (_req, res) => {
  // With in-memory JWT the client simply discards the token.
  // This endpoint exists so the frontend has a consistent API to call.
  return res.status(204).end();
};
