const app = require('./app');
const pool = require('./db/pool');
const { port } = require('./config/env');

async function start() {
  await pool.query('select 1');
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
