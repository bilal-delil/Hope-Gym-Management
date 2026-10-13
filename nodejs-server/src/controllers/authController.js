const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, publicUser } = require('../utils/tokens');

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6 }),
];

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    `SELECT id, email, password_hash, full_name, role, phone, avatar_url, is_active, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [
    user.id,
  ]);

  const token = signToken(user);

  res.json({
    success: true,
    data: {
      token,
      user: publicUser(user),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: publicUser(req.user),
  });
});

module.exports = {
  loginValidators,
  login,
  me,
};
