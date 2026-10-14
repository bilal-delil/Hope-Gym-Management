const { query } = require('../db/pool');

/**
 * Push an in-app notification to all active admin/staff users.
 * Used so PWA member actions (check-in, booking, profile, payments) show up in admin.
 */
async function notifyAdmins({ title, body, type = 'system', meta = {} }) {
  await query(
    `INSERT INTO notifications (user_id, title, body, type, meta)
     SELECT id, $1, $2, $3, $4::jsonb
     FROM users
     WHERE is_active = true AND role IN ('admin', 'staff')`,
    [title, body, type, JSON.stringify(meta || {})]
  );
}

/** Push an in-app notification to a single user (e.g. member PWA inbox). */
async function notifyUser(userId, { title, body, type = 'system', meta = {} }) {
  if (!userId) return;
  await query(
    `INSERT INTO notifications (user_id, title, body, type, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [userId, title, body, type, JSON.stringify(meta || {})]
  );
}

module.exports = { notifyAdmins, notifyUser };
