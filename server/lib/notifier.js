const pool = require('../db/pool');

async function notifyNewTender(tender) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Find users who have subscribed to this tender's sector
    const query = `
      SELECT user_id 
      FROM notification_preferences 
      WHERE $1 = ANY(notify_sectors)
    `;
    const result = await client.query(query, [tender.sector]);
    
    if (result.rows.length > 0) {
      const users = result.rows;
      
      // Bulk insert notifications
      const values = [];
      const queryParams = [];
      let paramCount = 1;
      
      for (const row of users) {
        values.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4})`);
        queryParams.push(
          row.user_id,
          'new_tender',
          `New Tender in ${tender.sector}`,
          `A new tender "${tender.title}" has been published in your subscribed sector.`,
          tender.id || null
        );
        paramCount += 5;
      }
      
      const insertQuery = `
        INSERT INTO notifications (user_id, type, title, message, tender_id)
        VALUES ${values.join(', ')}
      `;
      
      await client.query(insertQuery, queryParams);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error notifying users of new tender:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUnreadCount(userId) {
  const query = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false';
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  notifyNewTender,
  getUnreadCount
};
