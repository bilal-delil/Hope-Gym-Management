const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = header.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const result = await query(
    `SELECT id, email, google_sub, full_name, role, phone, avatar_url,
            is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [payload.sub]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User account is inactive or missing');
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    return next();
  };
}

const adminOnly = authorize('admin', 'staff');
const memberOnly = authorize('member');

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  memberOnly,
};
