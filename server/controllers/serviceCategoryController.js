const pool = require("../db/pool");

exports.list = async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name FROM service_categories ORDER BY name");
    return res.json(rows);
  } catch (err) {
    console.error("service_categories list error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
