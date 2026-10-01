const pool = require('../config/database');
async function check() {
  try {
    const [users] = await pool.query("SELECT id, email, role FROM users WHERE role = 'admin'");
    const [admins] = await pool.query("SELECT * FROM admins");
    console.log('Admin users:', users);
    console.log('Admins table:', admins);
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
check();
