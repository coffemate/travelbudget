const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: {
    // 针对 Supabase 等云数据库通常需要开启 SSL
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
});

module.exports = pool;