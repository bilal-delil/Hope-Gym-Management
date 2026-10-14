const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const checkInValidators = [
  body('memberId').isUUID(),
  body('checkedInAt').optional().isISO8601(),
  body('source').optional().isString().isLength({ max: 50 }),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.memberId) {
    values.push(req.query.memberId);
    where.push(`a.member_id = $${values.length}`);
  }
  if (req.query.from) {
    values.push(req.query.from);
    where.push(`a.checked_in_at >= $${values.length}`);
  }
  if (req.query.to) {
    values.push(req.query.to);
    where.push(`a.checked_in_at <= $${values.length}`);
  }
  if (req.query.date) {
    values.push(req.query.date);
    where.push(`a.checked_in_at::date = $${values.length}::date`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM attendance a ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT a.*,
            m.first_name,
            m.last_name,
            m.member_code,
            m.email AS member_email
     FROM attendance a
     JOIN members m ON m.id = a.member_id
     ${whereClause}
     ORDER BY a.checked_in_at DESC
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

const getById = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT a.*, m.first_name, m.last_name, m.member_code
     FROM attendance a
     JOIN members m ON m.id = a.member_id
     WHERE a.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Attendance record not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const checkIn = asyncHandler(async (req, res) => {
  const { memberId, checkedInAt, source, notes } = req.body;

  const member = await query('SELECT id, status FROM members WHERE id = $1', [
    memberId,
  ]);
  if (!member.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  const openCheckIn = await query(
    `SELECT id FROM attendance
     WHERE member_id = $1 AND checked_out_at IS NULL
     ORDER BY checked_in_at DESC
     LIMIT 1`,
    [memberId]
  );
  if (openCheckIn.rows[0]) {
    throw new ApiError(400, 'Member already has an open check-in');
  }

  const result = await query(
    `INSERT INTO attendance (member_id, checked_in_at, source, notes, recorded_by)
     VALUES ($1, COALESCE($2, CURRENT_TIMESTAMP), $3, $4, $5)
     RETURNING *`,
    [
      memberId,
      checkedInAt || null,
      source || 'manual',
      notes || null,
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const checkOut = asyncHandler(async (req, res) => {
  const checkedOutAt = req.body.checkedOutAt || null;

  const result = await query(
    `UPDATE attendance
     SET checked_out_at = COALESCE($1, CURRENT_TIMESTAMP)
     WHERE id = $2 AND checked_out_at IS NULL
     RETURNING *`,
    [checkedOutAt, req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Open attendance record not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM attendance WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Attendance record not found');
  }

  res.json({ success: true, message: 'Attendance record deleted' });
});

module.exports = {
  checkInValidators,
  list,
  getById,
  checkIn,
  checkOut,
  remove,
};
