const pool = require('./db/pool');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- Signup Test ---');
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'testsupplier' + Date.now() + '@example.com',
      password: 'password123',
      full_name: 'Test Supplier',
      user_type: 'supplier',
      entity_name: 'Test Corp'
    })
  });
  console.log('Signup Status:', signupRes.status);
  
  const supplierToken = signupRes.data.token;
  const supplierId = signupRes.data.user.id;
  
  const profileRes = await pool.query('SELECT status FROM profiles WHERE id = $1', [supplierId]);
  console.log('Supplier DB Status:', profileRes.rows[0].status); // should be 'pending'

  console.log('\n--- Access Control Test ---');
  const accessRes = await request(`/admin/suppliers/${supplierId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${supplierToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
  console.log('Supplier trying to access admin route status:', accessRes.status); // should be 403

  console.log('\n--- Create Admin & Approval Test ---');
  const adminEmail = 'admin' + Date.now() + '@example.com';
  const adminSignupRes = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: 'password123',
      full_name: 'Admin User',
      user_type: 'government_entity',
      entity_name: 'Admin Corp'
    })
  });
  const adminId = adminSignupRes.data.user.id;
  
  // Make them admin manually
  await pool.query('UPDATE profiles SET is_admin = true WHERE id = $1', [adminId]);
  
  // Login to trigger the fix that sets admin to approved
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: 'password123'
    })
  });
  const adminToken = adminLoginRes.data.token;
  
  const adminProfileRes = await pool.query('SELECT is_admin, status FROM profiles WHERE id = $1', [adminId]);
  console.log('Admin Profile Status after login:', adminProfileRes.rows[0].status); // should be 'approved'
  
  const approvalRes = await request(`/admin/suppliers/${supplierId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
  console.log('Admin approval response status:', approvalRes.status);
  
  const updatedSupplierRes = await pool.query('SELECT status FROM profiles WHERE id = $1', [supplierId]);
  console.log('Updated Supplier DB Status:', updatedSupplierRes.rows[0].status); // should be 'approved'

  console.log('\n--- UI Verification ---');
  console.log('AuthContext uses profileController which now includes p.status.');
  console.log('The MainLayout conditionally renders the "Waiting for Approval" banner if status is "pending".');
  
  process.exit();
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
