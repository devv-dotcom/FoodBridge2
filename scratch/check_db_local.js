const mysql = require('mysql2/promise');

async function testLocalhost() {
  try {
    console.log('Testing connection to localhost...');
    const pool = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'foodbridge'
    });

    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('🎉 SUCCESS! Connected to MySQL on localhost! Solution:', rows);

    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in foodbridge database:', tables.map(t => Object.values(t)[0]));
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error to localhost:', err.code, err.message);
    process.exit(1);
  }
}

testLocalhost();
