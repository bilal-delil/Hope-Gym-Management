const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const unreadOnly = req.query.unread === 'true';

  const values = [req.user.id];
  let where = 'WHERE user_id = $1';
  if (unreadOnly) {
    where += ' AND is_read = false';
  }

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM notifications ${where}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT * FROM notifications
     ${where}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    values
  );

  res.json({
    success: true,
    ...paginatedResponse({
      rows: result.rows,
      total: countResult.rows[0].total,
      page,
      limit,
    }),
  });
});

const markRead = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const markAllRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [req.user.id]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = {
  list,
  markRead,
  markAllRead,
};
