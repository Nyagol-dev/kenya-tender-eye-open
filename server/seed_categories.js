const pool = require('./db/pool');

async function seedCategories() {
  const categories = [
    'IT Services',
    'Construction',
    'Consulting',
    'Supplies',
    'Healthcare',
    'General Merchandise',
    'Professional Services'
  ];

  try {
    for (const name of categories) {
      await pool.query(
        'INSERT INTO service_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
    }
    console.log('Successfully seeded service categories.');
  } catch (err) {
    console.error('Error seeding categories:', err);
  } finally {
    pool.end();
  }
}

seedCategories();
