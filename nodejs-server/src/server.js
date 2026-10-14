const app = require('./app');
const env = require('./config/env');
const { pool } = require('./db/pool');

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(env.port, () => {
      console.log(`Hope Gym API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
