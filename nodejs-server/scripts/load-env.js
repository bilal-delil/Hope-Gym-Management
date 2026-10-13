require('dotenv').config();

if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

const { parseDatabaseUrl } = require('../src/db/connectionConfig');

// node-pg-migrate expects a URI in DATABASE_URL. If the user provided
// libpq keyword form, convert it to a postgres:// URI for migrations.
try {
  const cfg = parseDatabaseUrl(process.env.DATABASE_URL);
  if (!cfg.connectionString && cfg.host) {
    const user = encodeURIComponent(cfg.user || '');
    const password = encodeURIComponent(cfg.password || '');
    const auth = password ? `${user}:${password}` : user;
    const port = cfg.port || 5432;
    const database = cfg.database || 'postgres';
    process.env.DATABASE_URL = `postgres://${auth}@${cfg.host}:${port}/${database}`;
  }
} catch (error) {
  // leave as-is; migrate will surface a clearer error
}
