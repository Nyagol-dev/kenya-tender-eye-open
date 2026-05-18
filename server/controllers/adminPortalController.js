const pool = require('../db/pool');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [suppliersRes, tendersRes, bidsRes, activityRes] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'pending')::int as pending_onboarding,
          COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
          COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
          COUNT(*) FILTER (WHERE status = 'expired')::int as expired,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int as new_last_7_days
        FROM supplier_onboarding
      `),
      pool.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'open')::int as open,
          COUNT(*) FILTER (WHERE status = 'under_review')::int as under_review,
          COUNT(*) FILTER (WHERE status = 'awarded')::int as awarded,
          COUNT(*) FILTER (WHERE status = 'completed')::int as completed
        FROM tenders
      `),
      pool.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'submitted')::int as submitted,
          COUNT(*) FILTER (WHERE status = 'under_review')::int as under_review,
          COUNT(*) FILTER (WHERE status = 'awarded')::int as awarded,
          COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected
        FROM bids
      `),
      pool.query(`
        SELECT l.*, a.full_name as admin_name 
        FROM admin_activity_log l
        JOIN admin_users a ON l.admin_id = a.id
        ORDER BY l.created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      suppliers: suppliersRes.rows[0],
      tenders: tendersRes.rows[0],
      bids: bidsRes.rows[0],
      recent_activity: activityRes.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getSystemAlerts = async (req, res, next) => {
  try {
    const alerts = [];

    const expiringSuppliers = await pool.query(`
      SELECT user_id as id, deadline, status 
      FROM supplier_onboarding 
      WHERE status IN ('pending', 'in_progress') 
      AND deadline BETWEEN NOW() AND NOW() + INTERVAL '6 hours'
    `);
    expiringSuppliers.rows.forEach(s => {
      alerts.push({
        type: 'onboarding_expiring',
        severity: 'high',
        message: 'Supplier onboarding deadline expiring within 6 hours',
        target_id: s.id,
        target_type: 'supplier',
        created_at: new Date().toISOString()
      });
    });

    const delayedBids = await pool.query(`
      SELECT id, submitted_at, tender_id
      FROM bids
      WHERE status = 'submitted'
      AND submitted_at < NOW() - INTERVAL '5 days'
    `);
    delayedBids.rows.forEach(b => {
      alerts.push({
        type: 'delayed_bid_review',
        severity: 'medium',
        message: 'Bid pending review for over 5 days',
        target_id: b.id,
        target_type: 'bid',
        created_at: new Date().toISOString()
      });
    });

    const expiringTenders = await pool.query(`
      SELECT t.id, t.title, t.closing_time
      FROM tenders t
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE t.closing_time BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
      AND b.id IS NULL
    `);
    expiringTenders.rows.forEach(t => {
      alerts.push({
        type: 'tender_closing_no_bids',
        severity: 'medium',
        message: 'Tender closing within 48 hours with zero bids',
        target_id: t.id,
        target_type: 'tender',
        created_at: new Date().toISOString()
      });
    });

    res.json(alerts);
  } catch (err) {
    next(err);
  }
};

exports.listSuppliers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let values = [];
    let valueIdx = 1;

    if (status) {
      whereClauses.push(`so.status = $${valueIdx++}`);
      values.push(status);
    }

    if (search) {
      whereClauses.push(`(u.email ILIKE $${valueIdx} OR so.business_name ILIKE $${valueIdx} OR so.registration_number ILIKE $${valueIdx})`);
      values.push(`%${search}%`);
      valueIdx++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(`
      SELECT COUNT(*) 
      FROM supplier_onboarding so
      JOIN users u ON so.user_id = u.id
      ${whereStr}
    `, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        u.email,
        so.user_id,
        so.status as onboarding_status,
        so.step_completed,
        so.deadline,
        so.submitted_at,
        so.business_name,
        so.registration_number,
        sc.name as primary_service_category_name
      FROM supplier_onboarding so
      JOIN users u ON so.user_id = u.id
      LEFT JOIN service_categories sc ON so.primary_service_category_id = sc.id
      ${whereStr}
      ORDER BY so.created_at DESC
      LIMIT $${valueIdx} OFFSET $${valueIdx + 1}
    `;
    const rowsRes = await pool.query(query, [...values, limit, offset]);

    res.json({
      data: rowsRes.rows,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.getSupplierDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRes = await pool.query(`SELECT id, email, entity_name, created_at FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = userRes.rows[0];

    const onboardingRes = await pool.query(`SELECT * FROM supplier_onboarding WHERE user_id = $1`, [userId]);
    const onboarding = onboardingRes.rows[0] || null;

    const docsRes = await pool.query(`SELECT * FROM onboarding_documents WHERE user_id = $1`, [userId]);
    const documents = docsRes.rows;

    const bidsRes = await pool.query(`
      SELECT b.*, t.title as tender_title, t.reference_number 
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE b.supplier_id = $1
    `, [userId]);
    const bids = bidsRes.rows;

    res.json({
      user,
      onboarding,
      documents,
      bids,
      previous_projects: onboarding ? onboarding.previous_projects : []
    });
  } catch (err) {
    next(err);
  }
};

exports.reviewOnboarding = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { decision, notes, rejection_reason } = req.body;
    
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    await client.query('BEGIN');

    const updateOnboarding = await client.query(`
      UPDATE supplier_onboarding
      SET status = $1, admin_notes = $2, rejection_reason = $3, reviewed_by = $4, reviewed_at = NOW()
      WHERE user_id = $5
      RETURNING *
    `, [decision, notes, decision === 'rejected' ? rejection_reason : null, req.admin.id, userId]);

    if (updateOnboarding.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Onboarding record not found' });
    }

    const profileStatus = decision === 'approved' ? 'approved' : 'rejected';
    
    await client.query(`
      UPDATE profiles
      SET status = $1
      WHERE id = $2
    `, [profileStatus, userId]);

    await client.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, details)
      VALUES ($1, $2, 'onboarding', $3, $4)
    `, [
      req.admin.id,
      decision === 'approved' ? 'approve_supplier' : 'reject_supplier',
      updateOnboarding.rows[0].id,
      JSON.stringify({ notes, rejection_reason })
    ]);

    await client.query('COMMIT');
    res.json(updateOnboarding.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.deleteSupplierAccount = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const bidsRes = await client.query(`
      SELECT 1 FROM bids WHERE supplier_id = $1 AND status = 'awarded' LIMIT 1
    `, [userId]);

    if (bidsRes.rows.length > 0) {
      client.release();
      return res.status(400).json({ message: 'Cannot delete supplier with awarded bids' });
    }

    await client.query('BEGIN');

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    await client.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, details)
      VALUES ($1, 'delete_account', 'supplier', $2, $3)
    `, [req.admin.id, userId, JSON.stringify({ reason })]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    if (client) client.release();
  }
};

exports.listBids = async (req, res, next) => {
  try {
    const { tender_id, supplier_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let values = [];
    let valueIdx = 1;

    if (tender_id) {
      whereClauses.push(`b.tender_id = $${valueIdx++}`);
      values.push(tender_id);
    }
    if (supplier_id) {
      whereClauses.push(`b.supplier_id = $${valueIdx++}`);
      values.push(supplier_id);
    }
    if (status) {
      whereClauses.push(`b.status = $${valueIdx++}`);
      values.push(status);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(`
      SELECT COUNT(*)
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      JOIN users u ON b.supplier_id = u.id
      ${whereStr}
    `, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        b.*,
        t.title as tender_title,
        t.reference_number as tender_reference,
        u.email as supplier_email,
        u.entity_name as supplier_name,
        p.status as supplier_status
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      JOIN users u ON b.supplier_id = u.id
      LEFT JOIN profiles p ON u.id = p.id
      ${whereStr}
      ORDER BY b.submitted_at DESC
      LIMIT $${valueIdx} OFFSET $${valueIdx + 1}
    `;

    const rowsRes = await pool.query(query, [...values, limit, offset]);

    res.json({
      data: rowsRes.rows,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.getBidDetail = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    const bidRes = await pool.query(`SELECT * FROM bids WHERE id = $1`, [bidId]);
    if (bidRes.rows.length === 0) return res.status(404).json({ message: 'Bid not found' });
    const bid = bidRes.rows[0];

    const tenderRes = await pool.query(`SELECT * FROM tenders WHERE id = $1`, [bid.tender_id]);
    const tender = tenderRes.rows[0];

    const supplierRes = await pool.query(`
      SELECT u.id, u.email, u.entity_name, p.status as profile_status, so.status as onboarding_status
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN supplier_onboarding so ON u.id = so.user_id
      WHERE u.id = $1
    `, [bid.supplier_id]);
    const supplier = supplierRes.rows[0];

    const docsRes = await pool.query(`SELECT * FROM onboarding_documents WHERE user_id = $1`, [bid.supplier_id]);
    const onboarding_documents = docsRes.rows;

    const otherBidsRes = await pool.query(`
      SELECT b.id, b.status, b.bid_amount, b.completion_timeline_days, u.entity_name as supplier_name
      FROM bids b
      JOIN users u ON b.supplier_id = u.id
      WHERE b.tender_id = $1 AND b.id != $2
    `, [bid.tender_id, bid.id]);
    const other_bids = otherBidsRes.rows;

    res.json({
      bid,
      tender,
      supplier,
      onboarding_documents,
      bid_documents: bid.bid_documents || [],
      other_bids
    });
  } catch (err) {
    next(err);
  }
};

exports.reviewBid = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { bidId } = req.params;
    const { decision, notes, rejection_reason } = req.body;

    if (!['shortlisted', 'awarded', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    await client.query('BEGIN');

    const bidRes = await client.query(`SELECT * FROM bids WHERE id = $1 FOR UPDATE`, [bidId]);
    if (bidRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Bid not found' });
    }
    const bid = bidRes.rows[0];

    if (decision === 'awarded') {
      const existingAward = await client.query(`
        SELECT 1 FROM bids WHERE tender_id = $1 AND status = 'awarded' AND id != $2
      `, [bid.tender_id, bid.id]);
      if (existingAward.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Another bid is already awarded for this tender' });
      }
    }

    const updatedBidRes = await client.query(`
      UPDATE bids
      SET status = $1, admin_notes = $2, rejection_reason = $3, reviewed_by = $4, reviewed_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [decision, notes, decision === 'rejected' ? rejection_reason : null, req.admin.id, bidId]);

    if (decision === 'awarded') {
      await client.query(`
        UPDATE tenders SET status = 'awarded' WHERE id = $1
      `, [bid.tender_id]);
    }

    await client.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, details)
      VALUES ($1, $2, 'bid', $3, $4)
    `, [
      req.admin.id,
      decision === 'awarded' ? 'award_bid' : decision === 'shortlisted' ? 'shortlist_bid' : 'reject_bid',
      bidId,
      JSON.stringify({ notes, rejection_reason })
    ]);

    await client.query('COMMIT');
    res.json(updatedBidRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.getDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const docRes = await pool.query(`SELECT * FROM onboarding_documents WHERE id = $1`, [documentId]);
    if (docRes.rows.length === 0) return res.status(404).json({ message: 'Document not found' });

    const doc = docRes.rows[0];

    await pool.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id)
      VALUES ($1, 'view_document', 'onboarding_document', $2)
    `, [req.admin.id, documentId]);

    res.json({
      id: doc.id,
      document_type: doc.document_type,
      file_name: doc.file_name,
      file_url: doc.file_url,
      mime_type: doc.mime_type
    });
  } catch (err) {
    next(err);
  }
};

exports.getActivity = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT l.*, a.full_name as admin_name
      FROM admin_activity_log l
      LEFT JOIN admin_users a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json({ activity: result.rows });
  } catch (err) {
    next(err);
  }
};

