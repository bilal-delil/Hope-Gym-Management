const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const client = new OAuth2Client();

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new ApiError(400, 'Google idToken is required');
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientIds,
    });
  } catch (error) {
    throw new ApiError(401, 'Invalid Google ID token');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new ApiError(401, 'Google token is missing required claims');
  }

  if (payload.email_verified === false) {
    throw new ApiError(401, 'Google email is not verified');
  }

  return {
    googleSub: payload.sub,
    email: String(payload.email).toLowerCase(),
    fullName: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || null,
  };
}

module.exports = {
  verifyGoogleIdToken,
};
