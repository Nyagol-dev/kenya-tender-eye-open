const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function run() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'kenya_tender_eye',
    password: '',
    port: 5432,
  });

  try {
    await client.connect();
    
    const hash = await bcrypt.hash('Admin@2024!', 10);
    console.log('Generated hash:', hash);

    await client.query(`
      UPDATE admin_users 
      SET password_hash = $1 
      WHERE email = 'admin@eprocurement.go.ke'
    `, [hash]);

    console.log('Successfully updated admin password.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
