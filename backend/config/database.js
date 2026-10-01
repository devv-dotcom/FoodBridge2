const mysql = require('mysql2/promise');
require('dotenv').config();

// `TIDB_*` provides an explicit production connection for deployments that
// previously used a private Railway hostname.  The ordinary `DB_*` settings
// remain the local-development defaults.
const isTiDb = Boolean(process.env.TIDB_HOST);
const pool = mysql.createPool({
  host: process.env.TIDB_HOST || process.env.DB_HOST,
  port: Number(process.env.TIDB_PORT || process.env.DB_PORT || 3306),
  user: process.env.TIDB_USER || process.env.DB_USER,
  password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.TIDB_DATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  ssl: isTiDb || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

module.exports = pool;
