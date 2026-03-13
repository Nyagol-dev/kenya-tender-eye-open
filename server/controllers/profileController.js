const pool = require("../db/pool");

exports.getProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT p.*, sc.id AS service_category_id, sc.name AS service_category_name
       FROM profiles p
       LEFT JOIN service_categories sc ON sc.id = p.service_category_id
       WHERE p.id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const row = rows[0];
    const profile = {
      ...row,
      service_category: row.service_category_id
        ? { id: row.service_category_id, name: row.service_category_name }
        : null,
    };
    delete profile.service_category_id;
    delete profile.service_category_name;

    return res.json(profile);
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
