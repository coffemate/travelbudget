const app = require('./app');
const pool = require('./db/pool');
const { port } = require('./config/env');

async function start() {
  await pool.query('select 1');
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
