const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('./pool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    
    console.log(`Running migration: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await pool.query(sql);
      console.log(`Successfully applied ${file}`);
    } catch (err) {
      console.error(`\n[ERROR] in ${file}:`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('All migrations applied successfully.');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
