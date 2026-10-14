const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    throw new ApiError(400, 'Query parameter q is required');
  }

  const pattern = `%${q}%`;

  const [members, trainers, classes, announcements] = await Promise.all([
    query(
      `SELECT id, member_code, first_name, last_name, email, 'member' AS entity
       FROM members
       WHERE first_name ILIKE $1
          OR last_name ILIKE $1
          OR email ILIKE $1
          OR member_code ILIKE $1
       ORDER BY last_name ASC
       LIMIT 10`,
      [pattern]
    ),
    query(
      `SELECT id, first_name, last_name, email, 'trainer' AS entity
       FROM trainers
       WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
       ORDER BY last_name ASC
       LIMIT 10`,
      [pattern]
    ),
    query(
      `SELECT id, name, category, 'class' AS entity
       FROM classes
       WHERE name ILIKE $1 OR category ILIKE $1
       ORDER BY name ASC
       LIMIT 10`,
      [pattern]
    ),
    query(
      `SELECT id, title, priority, 'announcement' AS entity
       FROM announcements
       WHERE title ILIKE $1 OR body ILIKE $1
       ORDER BY starts_at DESC
       LIMIT 10`,
      [pattern]
    ),
  ]);

  res.json({
    success: true,
    data: {
      members: members.rows,
      trainers: trainers.rows,
      classes: classes.rows,
      announcements: announcements.rows,
    },
  });
});

module.exports = {
  globalSearch,
};
