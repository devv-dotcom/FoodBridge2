const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('../backend/node_modules/bcrypt');
}
const pool = require('../config/database');

async function testAdmin() {
  try {
    const adminEmail = 'admin@foodbridge.org';
    const adminPass = 'AdminPassword123!';

    const [users] = await pool.execute('SELECT id, full_name, email, password, role FROM users WHERE LOWER(email) = LOWER(?)', [adminEmail]);
    console.log('Users found count:', users.length);

    let uId;
    if (users.length === 0) {
      console.log('Admin user does not exist. Creating now...');
      const hash = await bcrypt.hash(adminPass, 10);
      const [ins] = await pool.execute(
        `INSERT INTO users (full_name, email, password, role, is_verified, created_at)
         VALUES (?, ?, ?, 'admin', 1, CURRENT_TIMESTAMP)`,
        ['System Administrator', adminEmail, hash]
      );
      uId = ins.insertId;
      console.log('Created user ID:', uId);

      await pool.execute(
        `INSERT INTO admins (user_id, account_status, created_at)
         VALUES (?, 'active', CURRENT_TIMESTAMP)`,
        [uId]
      );
      console.log('Created admin profile for user ID:', uId);
    } else {
      const u = users[0];
      uId = u.id;
      console.log('User ID:', uId, 'User role:', u.role);
      const matches = await bcrypt.compare(adminPass, u.password);
      console.log('Password matches AdminPassword123!?:', matches);

      if (!matches || u.role !== 'admin') {
        console.log('Updating admin password & role...');
        const newHash = await bcrypt.hash(adminPass, 10);
        await pool.execute("UPDATE users SET password = ?, role = 'admin' WHERE id = ?", [newHash, uId]);
        console.log('Updated user password and role to admin');
      }

      const [admins] = await pool.execute('SELECT id, account_status FROM admins WHERE user_id = ?', [uId]);
      console.log('Admins profile found:', admins);
      if (admins.length === 0) {
        await pool.execute(
          `INSERT INTO admins (user_id, account_status, created_at) VALUES (?, 'active', CURRENT_TIMESTAMP)`,
          [uId]
        );
        console.log('Inserted missing admin profile');
      } else {
        await pool.execute("UPDATE admins SET account_status = 'active' WHERE user_id = ?", [uId]);
        console.log('Ensured admin account_status is active');
      }
    }

    console.log('SUCCESS: Admin user admin@foodbridge.org / AdminPassword123! is ready!');
    process.exit(0);
  } catch (err) {
    console.error('Error during testAdmin:', err.message || err);
    process.exit(1);
  }
}

testAdmin();
