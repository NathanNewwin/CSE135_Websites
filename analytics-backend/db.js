const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'collector',
  user: process.env.PGUSER || 'collector_user',
  password: process.env.PGPASSWORD || 'liveoak', 
  max: 10,
});

module.exports = pool;