require('dotenv').config();

// Accept either DATABASE_URL or DB_URL
if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

const required = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_IDS'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const googleClientIds = process.env.GOOGLE_CLIENT_IDS.split(',')
  .map((id) => id.trim())
  .filter(Boolean);

if (!googleClientIds.length) {
  throw new Error('GOOGLE_CLIENT_IDS must include at least one client ID');
}

const adminEmails = (
  process.env.ADMIN_GOOGLE_EMAILS ||
  process.env.SEED_ADMIN_EMAIL ||
  ''
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins,
  googleClientIds,
  adminEmails,
  seed: {
    adminEmail: (
      process.env.SEED_ADMIN_EMAIL ||
      adminEmails[0] ||
      'admin@hopegym.local'
    ).toLowerCase(),
    adminName: process.env.SEED_ADMIN_NAME || 'Hope Admin',
  },
};
