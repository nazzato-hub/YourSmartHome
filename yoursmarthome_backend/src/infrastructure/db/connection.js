// ── Infrastructure – PostgreSQL Connection Pool ───────────────────────────────
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'yoursmarthome',
  user:     process.env.DB_USER     || 'ysh_user',
  password: process.env.DB_PASSWORD || 'ysh_password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Errore connessione pool:', err.message);
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
