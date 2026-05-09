const pool = require("../db/pool");

module.exports = async (req, res, next) => {
    try {
        // req.user is set by your existing authenticate middleware
        const { rows } = await pool.query("SELECT is_admin FROM profiles WHERE id = $1", [req.user.id]);

        if (rows.length === 0 || !rows[0].is_admin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};