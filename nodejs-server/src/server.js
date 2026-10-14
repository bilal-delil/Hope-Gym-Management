const app = require('./app');
const env = require('./config/env');
const { pool } = require('./db/pool');

async function start() {
  try {
    await pool.query('SELECT 1');
    // Bind IPv4 explicitly; Vite proxies to 127.0.0.1 to avoid localhost→::1 misses.
    app.listen(env.port, '127.0.0.1', () => {
      console.log(`Hope Gym API listening on http://127.0.0.1:${env.port}`);
    });


  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
