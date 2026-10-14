const { body } = require('express-validator');
const { query, getClient } = require('../db/pool');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyGoogleIdToken } = require('../services/googleAuth');
const { signToken, publicUser } = require('../utils/tokens');

const googleValidators = [body('idToken').isString().notEmpty()];

const USER_COLUMNS = `
  id, email, google_sub, full_name, role, phone, avatar_url,
  is_active, last_login_at, created_at, updated_at
`;

async function findMemberByUserId(userId) {
  const result = await query(
    `SELECT id, member_code, first_name, last_name, status
     FROM members
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

function nextMemberCode() {
  return `HG-${Date.now().toString().slice(-8)}`;
}

function splitName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return { firstName: 'Member', lastName: 'User' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'User' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

const googleAdmin = asyncHandler(async (req, res) => {
  const google = await verifyGoogleIdToken(req.body.idToken);

  // Strict allowlist: only configured admin emails can use the admin app.
  if (!env.adminEmails.includes(google.email)) {
    throw new ApiError(
      403,
      'This Google account is not authorized for admin access'
    );
  }

  let userResult = await query(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE google_sub = $1 OR email = $2
     LIMIT 1`,
    [google.googleSub, google.email]
  );

  let user = userResult.rows[0];

  if (!user) {
    userResult = await query(
      `INSERT INTO users (email, google_sub, full_name, role, avatar_url, is_active, last_login_at)
       VALUES ($1, $2, $3, 'admin', $4, true, CURRENT_TIMESTAMP)
       RETURNING ${USER_COLUMNS}`,
      [google.email, google.googleSub, google.fullName, google.avatarUrl]
    );
    user = userResult.rows[0];
  } else {
    if (user.role === 'member') {
      throw new ApiError(
        403,
        'This Google account is registered as a member, not admin/staff'
      );
    }
    if (!user.is_active) {
      throw new ApiError(403, 'Admin account is inactive');
    }
    if (user.google_sub && user.google_sub !== google.googleSub) {
      throw new ApiError(403, 'Google account mismatch for this admin email');
    }

    // Ensure allowlisted accounts stay admin/staff.
    await query(
      `UPDATE users
       SET role = CASE WHEN role IN ('admin', 'staff') THEN role ELSE 'admin' END,
           google_sub = COALESCE(google_sub, $1),
           full_name = COALESCE(NULLIF($2, ''), full_name),
           avatar_url = COALESCE($3, avatar_url),
           last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [google.googleSub, google.fullName, google.avatarUrl, user.id]
    );

    userResult = await query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      user.id,
    ]);
    user = userResult.rows[0];
  }

  res.json({
    success: true,
    data: {
      token: signToken(user),
      user: publicUser(user),
    },
  });
});

const googleMember = asyncHandler(async (req, res) => {
  const google = await verifyGoogleIdToken(req.body.idToken);
  const client = await getClient();

  try {
    await client.query('BEGIN');

    let userResult = await client.query(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE google_sub = $1 OR email = $2
       LIMIT 1
       FOR UPDATE`,
      [google.googleSub, google.email]
    );

    let user = userResult.rows[0];

    if (user && ['admin', 'staff'].includes(user.role)) {
      throw new ApiError(
        403,
        'Admin/staff accounts must sign in through the admin Google flow'
      );
    }

    if (!user) {
      userResult = await client.query(
        `INSERT INTO users (email, google_sub, full_name, role, avatar_url, is_active, last_login_at)
         VALUES ($1, $2, $3, 'member', $4, true, CURRENT_TIMESTAMP)
         RETURNING ${USER_COLUMNS}`,
        [google.email, google.googleSub, google.fullName, google.avatarUrl]
      );
      user = userResult.rows[0];
    } else {
      if (!user.is_active) {
        throw new ApiError(403, 'Member account is inactive');
      }
      if (user.google_sub && user.google_sub !== google.googleSub) {
        throw new ApiError(403, 'Google account mismatch for this member email');
      }

      await client.query(
        `UPDATE users
         SET google_sub = COALESCE(google_sub, $1),
             full_name = COALESCE(NULLIF($2, ''), full_name),
             avatar_url = COALESCE($3, avatar_url),
             role = 'member',
             last_login_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [google.googleSub, google.fullName, google.avatarUrl, user.id]
      );

      userResult = await client.query(
        `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
        [user.id]
      );
      user = userResult.rows[0];
    }

    let memberResult = await client.query(
      `SELECT id, user_id, member_code, first_name, last_name, status
       FROM members
       WHERE user_id = $1 OR email = $2
       LIMIT 1
       FOR UPDATE`,
      [user.id, google.email]
    );

    let member = memberResult.rows[0];

    if (!member) {
      const { firstName, lastName } = splitName(google.fullName);
      memberResult = await client.query(
        `INSERT INTO members (
           user_id, member_code, first_name, last_name, email, photo_url, status
         ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
         RETURNING id, member_code, first_name, last_name, status`,
        [
          user.id,
          nextMemberCode(),
          firstName,
          lastName,
          google.email,
          google.avatarUrl,
        ]
      );
      member = memberResult.rows[0];
    } else {
      await client.query(
        `UPDATE members
         SET user_id = COALESCE(user_id, $1),
             email = COALESCE(email, $2),
             photo_url = COALESCE($3, photo_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [user.id, google.email, google.avatarUrl, member.id]
      );
      memberResult = await client.query(
        `SELECT id, member_code, first_name, last_name, status
         FROM members WHERE id = $1`,
        [member.id]
      );
      member = memberResult.rows[0];
    }

    await client.query('COMMIT');

    await query(
      `INSERT INTO notifications (user_id, title, body, type)
       SELECT $1,
              'Welcome to Hope Fitness',
              'Book classes, check in, and manage payments from the member app.',
              'welcome'
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE user_id = $1 AND title = 'Welcome to Hope Fitness'
       )`,
      [user.id]
    );

    res.json({
      success: true,
      data: {
        token: signToken(user),
        user: publicUser(user, member),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const me = asyncHandler(async (req, res) => {
  let member = null;
  if (req.user.role === 'member') {
    member = await findMemberByUserId(req.user.id);
  }

  res.json({
    success: true,
    data: publicUser(req.user, member),
  });
});

module.exports = {
  googleValidators,
  googleAdmin,
  googleMember,
  me,
};
