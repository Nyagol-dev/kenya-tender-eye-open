const pool = require('./server/db/pool.js');

async function testQuery() {
  try {
    const res = await pool.query('SELECT t.id, u.entity_name FROM tenders t LEFT JOIN users u ON t.issuing_entity_id = u.id;');
    console.log(res.rows);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit();
  }
}

testQuery();
