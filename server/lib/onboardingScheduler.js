const pool = require('../db/pool');
const logger = require('./logger');

async function runOnboardingCleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expiredRes = await client.query(`
      SELECT user_id FROM supplier_onboarding 
      WHERE (status = 'pending' OR status = 'in_progress') 
      AND deadline < NOW()
      FOR UPDATE SKIP LOCKED
    `);

    if (expiredRes.rows.length === 0) {
      await client.query('COMMIT');
      return { expired: 0, deleted: 0 };
    }

    const userIds = expiredRes.rows.map(r => r.user_id);

    await client.query(`
      UPDATE supplier_onboarding 
      SET status = 'expired', updated_at = NOW() 
      WHERE user_id = ANY($1)
    `, [userIds]);

    const usersRes = await client.query(`
      SELECT id, email FROM users WHERE id = ANY($1)
    `, [userIds]);

    await client.query(`
      DELETE FROM users WHERE id = ANY($1)
    `, [userIds]);

    await client.query('COMMIT');

    for (const u of usersRes.rows) {
      logger.info(`Deleted expired onboarding user: ${u.id} - ${u.email}`);
    }

    return { expired: userIds.length, deleted: usersRes.rows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('runOnboardingCleanup error:', err);
    return { expired: 0, deleted: 0 };
  } finally {
    client.release();
  }
}

function scheduleCleanup() {
  const intervalMs = 30 * 60 * 1000;
  setInterval(() => {
    runOnboardingCleanup().catch(err => logger.error('Scheduler error:', err));
  }, intervalMs);
  logger.info('Onboarding cleanup scheduler started (runs every 30 minutes)');
}

module.exports = {
  runOnboardingCleanup,
  scheduleCleanup
};
