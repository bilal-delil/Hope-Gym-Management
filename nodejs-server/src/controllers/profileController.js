const { body } = require('express-validator');
const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { publicUser } = require('../utils/tokens');

const updateValidators = [
  body('fullName').optional().isString().isLength({ min: 2, max: 150 }),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 50 }),
];

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, email, google_sub, full_name, role, phone, avatar_url,
               is_active, created_at, updated_at`,
    [fullName || null, phone ?? null, req.user.id]
  );

  let member = null;
  if (result.rows[0].role === 'member') {
    const memberResult = await query(
      `SELECT id, member_code, first_name, last_name, status
       FROM members
       WHERE user_id = $1`,
      [req.user.id]
    );
    member = memberResult.rows[0] || null;

    if (member && fullName) {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || member.last_name;
      await query(
        `UPDATE members
         SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [firstName, lastName, member.id]
      );
      member.first_name = firstName;
      member.last_name = lastName;
    }
  }

  res.json({
    success: true,
    data: publicUser(result.rows[0], member),
  });
});

module.exports = {
  updateValidators,
  updateProfile,
};
