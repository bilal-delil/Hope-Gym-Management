const { Pool } = require('pg');
const env = require('../config/env');
const { parseDatabaseUrl } = require('./connectionConfig');

const pool = new Pool(parseDatabaseUrl(env.databaseUrl));

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
};
