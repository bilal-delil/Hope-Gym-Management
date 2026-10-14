const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.status) {
    values.push(req.query.status);
    where.push(`cb.status = $${values.length}`);
  }
  if (req.query.memberId) {
    values.push(req.query.memberId);
    where.push(`cb.member_id = $${values.length}`);
  }
  if (req.query.scheduleId) {
    values.push(req.query.scheduleId);
    where.push(`cb.schedule_id = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM class_bookings cb
     ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT cb.*,
            m.first_name, m.last_name, m.member_code, m.email AS member_email,
            s.starts_at, s.ends_at, s.room, s.status AS schedule_status,
            c.name AS class_name
     FROM class_bookings cb
     JOIN members m ON m.id = cb.member_id
     JOIN schedules s ON s.id = cb.schedule_id
     JOIN classes c ON c.id = s.class_id
     ${whereClause}
     ORDER BY COALESCE(cb.booked_at, cb.created_at) DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
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

const update = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!['booked', 'attended', 'cancelled', 'no_show'].includes(status)) {
    throw new ApiError(400, 'Invalid booking status');
  }

  const result = await query(
    `UPDATE class_bookings
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    `DELETE FROM class_bookings WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (!result.rows[0]) {
    throw new ApiError(404, 'Booking not found');
  }
  res.json({ success: true, message: 'Booking deleted' });
});

module.exports = {
  list,
  update,
  remove,
};
