const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { getUnreadCount } = require('../lib/notifier');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// GET /notifications
router.get('/', async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /notifications/count
router.get('/count', async (req, res, next) => {
  try {
    const unread = await getUnreadCount(req.user.id);
    res.json({ unread });
  } catch (err) {
    next(err);
  }
});

// GET /notifications/preferences
router.get('/preferences', async (req, res, next) => {
  try {
    const query = 'SELECT notify_email, notify_sectors FROM notification_preferences WHERE user_id = $1';
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.json({ notify_email: true, notify_sectors: [] });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /notifications/preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const { notify_email, notify_sectors } = req.body;
    
    const query = `
      INSERT INTO notification_preferences (user_id, notify_email, notify_sectors)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        notify_email = EXCLUDED.notify_email,
        notify_sectors = EXCLUDED.notify_sectors
      RETURNING notify_email, notify_sectors
    `;
    const result = await pool.query(query, [req.user.id, notify_email, notify_sectors || []]);
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    const query = 'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id';
    const result = await pool.query(query, [req.user.id]);
    res.json({ updated: result.rowCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
