// server/routes/adminPortal.js
// Replace the existing file with this version, which adds tender management routes.

const express = require('express');
const router = express.Router();
const adminPortalController = require('../controllers/adminPortalController');
const tenderController = require('../controllers/tenderController');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const pool = require('../db/pool');

router.use(authenticateAdmin);

// Dashboard & alerts
router.get('/dashboard', adminPortalController.getDashboardStats);
router.get('/alerts', adminPortalController.getSystemAlerts);

// Supplier management
router.get('/suppliers', adminPortalController.listSuppliers);
router.get('/suppliers/:userId', adminPortalController.getSupplierDetail);
router.post('/suppliers/:userId/review', adminPortalController.reviewOnboarding);
router.delete('/suppliers/:userId', adminPortalController.deleteSupplierAccount);

// Bid management
router.get('/bids', adminPortalController.listBids);
router.get('/bids/:bidId', adminPortalController.getBidDetail);
router.post('/bids/:bidId/review', adminPortalController.reviewBid);

// Documents
router.get('/documents/:documentId', adminPortalController.getDocument);

// Activity log
router.get('/activity', adminPortalController.getActivity);

// ---------------------------------------------------------------------------
// Tenders — admin view (read-only list + create on behalf of an entity)
// ---------------------------------------------------------------------------
router.get('/tenders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.reference_number,
        t.title,
        t.description,
        t.sector,
        t.value,
        t.closing_date,
        t.status,
        t.created_at,
        u.entity_name AS issuing_entity_name
      FROM tenders t
      LEFT JOIN users u ON t.issuing_entity_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    // Return as { tenders: [...] } so AdminDashboardPage.tsx can access data.tenders
    res.json({ tenders: rows });
  } catch (err) {
    next(err);
  }
});

// Admin can also create tenders (assign to a government entity user by email if provided)
router.post('/tenders', async (req, res, next) => {
  try {
    const { title, reference_number, description, sector, value, closing_date, issuing_entity_email } = req.body;

    if (!title || !reference_number || !closing_date) {
      return res.status(400).json({ message: 'Missing required fields: title, reference_number, closing_date' });
    }

    let issuingEntityId = null;
    if (issuing_entity_email) {
      const userRes = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND user_type = 'government_entity'`,
        [issuing_entity_email]
      );
      if (userRes.rows.length > 0) {
        issuingEntityId = userRes.rows[0].id;
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tenders (title, reference_number, description, sector, value, closing_date, issuing_entity_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       RETURNING *`,
      [title, reference_number, description || null, sector || null, value || null, closing_date, issuingEntityId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
