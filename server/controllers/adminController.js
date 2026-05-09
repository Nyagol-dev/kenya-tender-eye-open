const pool = require("../db/pool");

exports.approveSupplier = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    try {
        await pool.query(
            "UPDATE profiles SET status = $1, updated_at = NOW() WHERE id = $2",
            [status, id]
        );
        res.json({ message: `Supplier status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
};