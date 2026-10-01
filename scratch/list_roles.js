const pool = require('../config/database');
async function listRoles() {
  const [rows] = await pool.query('SELECT DISTINCT role, count(*) as cnt, MIN(email) as sample_email, MIN(full_name) as name FROM users GROUP BY role');
  console.log(rows);
  process.exit(0);
}
listRoles();
