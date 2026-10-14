const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function publicUser(user, member = null) {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    googleLinked: Boolean(user.google_sub),
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  if (member) {
    payload.member = {
      id: member.id,
      memberCode: member.member_code,
      firstName: member.first_name,
      lastName: member.last_name,
      status: member.status,
    };
  }

  return payload;
}

module.exports = {
  signToken,
  publicUser,
};
