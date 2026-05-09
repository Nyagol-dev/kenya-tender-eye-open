const pool = require("../db/pool");
const logger = require("../lib/logger");

exports.list = async (req, res) => {
  try {
    const {
      q,
      sector,
      status,
      min_value,
      max_value,
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;
    const values = [];
    let whereClauses = [];

    let countQuery = `
      SELECT COUNT(*) 
      FROM tenders t
      LEFT JOIN users u ON t.issuing_entity_id = u.id
    `;
    
    let dataQuery = `
      SELECT 
        t.id, 
        t.reference_number AS reference, 
        t.title, 
        t.description,
        t.sector, 
        t.value, 
        t.closing_date AS "closingDate", 
        t.status, 
        u.entity_name AS "issuingAuthority"
      FROM tenders t
      LEFT JOIN users u ON t.issuing_entity_id = u.id
    `;

    if (q) {
      values.push(q);
      whereClauses.push(`to_tsvector('english', t.title || ' ' || COALESCE(t.description,'')) @@ plainto_tsquery('english', $${values.length})`);
    }

    if (sector) {
      values.push(sector);
      whereClauses.push(`t.sector = $${values.length}`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`t.status = $${values.length}`);
    }

    if (min_value) {
      values.push(min_value);
      whereClauses.push(`t.value >= $${values.length}`);
    }

    if (max_value) {
      values.push(max_value);
      whereClauses.push(`t.value <= $${values.length}`);
    }

    if (whereClauses.length > 0) {
      const whereString = " WHERE " + whereClauses.join(" AND ");
      countQuery += whereString;
      dataQuery += whereString;
    }

    dataQuery += ` ORDER BY t.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    
    const countValues = [...values];
    values.push(limit, offset);

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const { rows } = await pool.query(dataQuery, values);

    // Format closingDate to match frontend expectations (e.g. "May 10, 2023")
    const formattedRows = rows.map(r => ({
      ...r,
      value: Number(r.value),
      closingDate: new Date(r.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }));

    res.json({
      data: formattedRows,
      total,
      page: parseInt(page, 10),
      totalPages
    });
  } catch (err) {
    logger.error({ err }, "list tenders error");
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if parameter is a UUID or a reference number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = `
      SELECT 
        t.id, 
        t.reference_number AS reference, 
        t.title, 
        t.description,
        t.sector, 
        t.value, 
        t.closing_date AS "closingDate", 
        t.status, 
        u.entity_name AS "issuingAuthority"
      FROM tenders t
      LEFT JOIN users u ON t.issuing_entity_id = u.id
      WHERE ${isUuid ? "t.id = $1" : "t.reference_number = $1"}
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tender not found" });
    }

    const row = rows[0];
    row.value = Number(row.value);
    row.closingDate = new Date(row.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    res.json(row);
  } catch (err) {
    logger.error("get tender by id error: " + err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.submitBid = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profileRes = await pool.query('SELECT user_type, status FROM profiles WHERE id = $1', [req.user.id]);
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = profileRes.rows[0];
    
    if (profile.user_type === 'supplier' && profile.status !== 'approved') {
      return res.status(403).json({ message: "Only approved suppliers can submit bids." });
    }

    // Stub logic for bidding 
    res.status(200).json({ message: "Bid submitted successfully." });
  } catch (err) {
    logger.error("submit bid error: " + err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
