const pool = require('../db/pool');
const logger = require('../lib/logger');

// POST /bids
exports.submitBid = async (req, res) => {
  const { tender_id, bid_amount, technical_proposal, completion_timeline_days, bid_documents } = req.body;

  // 1. Input validation
  if (!tender_id) {
    return res.status(400).json({ error: 'tender_id is required' });
  }
  if (!bid_amount || Number(bid_amount) <= 0) {
    return res.status(400).json({ error: 'bid_amount must be greater than 0' });
  }
  if (!completion_timeline_days || Number(completion_timeline_days) <= 0) {
    return res.status(400).json({ error: 'completion_timeline_days must be greater than 0' });
  }

  try {
    // 2. Fetch tender — 404 if not found
    const tenderResult = await pool.query(
      `SELECT id, status, closing_date FROM tenders WHERE id = $1`,
      [tender_id]
    );
    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const tender = tenderResult.rows[0];

    // 3. Tender must be open
    if (tender.status !== 'open') {
      return res.status(400).json({ error: 'Tender is not open for bidding' });
    }

    // 4. Closing date must be in the future
    if (new Date(tender.closing_date) <= new Date()) {
      return res.status(400).json({ error: 'Tender bidding period has closed' });
    }

    // 5. Supplier onboarding must be approved
    const onboardingResult = await pool.query(
      `SELECT id FROM supplier_onboarding WHERE user_id = $1 AND status = 'approved'`,
      [req.user.id]
    );
    if (onboardingResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Your supplier profile must be approved before bidding. Complete onboarding or contact support.',
      });
    }

    const supplierId = req.user.id;

    // 6. No duplicate bids
    const duplicateResult = await pool.query(
      `SELECT id FROM bids WHERE tender_id = $1 AND supplier_id = $2`,
      [tender_id, supplierId]
    );
    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ error: 'You have already submitted a bid for this tender' });
    }

    // Insert the bid
    const insertResult = await pool.query(
      `INSERT INTO bids
         (tender_id, supplier_id, bid_amount, technical_proposal, completion_timeline_days, bid_documents, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW())
       RETURNING *`,
      [
        tender_id,
        supplierId,
        bid_amount,
        technical_proposal || null,
        completion_timeline_days,
        JSON.stringify(bid_documents || []),
      ]
    );

    logger.info({ msg: 'Bid submitted', bid_id: insertResult.rows[0].id, supplier_id: supplierId, tender_id });
    return res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    logger.error('submitBid error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /bids/my
exports.getMyBids = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.*,
         t.title            AS tender_title,
         t.reference_number AS tender_reference_number,
         t.closing_date     AS tender_closing_date,
         t.status           AS tender_status
       FROM bids b
       JOIN tenders t ON t.id = b.tender_id
       WHERE b.supplier_id = $1
       ORDER BY b.submitted_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (err) {
    logger.error('getMyBids error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /bids/:bidId
exports.getBidById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.*,
         t.title            AS tender_title,
         t.reference_number AS tender_reference_number,
         t.closing_date     AS tender_closing_date,
         t.status           AS tender_status
       FROM bids b
       JOIN tenders t ON t.id = b.tender_id
       WHERE b.id = $1 AND b.supplier_id = $2`,
      [req.params.bidId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('getBidById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /bids/:bidId
exports.withdrawBid = async (req, res) => {
  try {
    // Only fetch the bid if it belongs to this supplier
    const bidResult = await pool.query(
      `SELECT id, status FROM bids WHERE id = $1 AND supplier_id = $2`,
      [req.params.bidId, req.user.id]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    if (bid.status !== 'submitted') {
      return res.status(400).json({
        error: `Cannot withdraw a bid with status '${bid.status}'. Only submitted bids can be withdrawn.`,
      });
    }

    const updated = await pool.query(
      `UPDATE bids SET status = 'withdrawn', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bid.id]
    );

    logger.info({ msg: 'Bid withdrawn', bid_id: bid.id, supplier_id: req.user.id });
    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    logger.error('withdrawBid error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
