const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { publicUser } = require('../utils/tokens');

const updateValidators = [
  body('fullName').optional().isString().isLength({ min: 2, max: 150 }),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('avatarUrl').optional({ nullable: true }).isURL(),
];

const passwordValidators = [
  body('currentPassword').isString().isLength({ min: 6 }),
  body('newPassword').isString().isLength({ min: 8 }),
];

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, avatarUrl } = req.body;

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         avatar_url = COALESCE($3, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, email, full_name, role, phone, avatar_url, is_active, created_at, updated_at`,
    [fullName || null, phone ?? null, avatarUrl ?? null, req.user.id]
  );

  res.json({
    success: true,
    data: publicUser(result.rows[0]),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );

  const valid = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash
  );
  if (!valid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query(
    `UPDATE users
     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [passwordHash, req.user.id]
  );

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

module.exports = {
  updateValidators,
  passwordValidators,
  updateProfile,
  changePassword,
};
