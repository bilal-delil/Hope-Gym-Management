const dayjs = require('dayjs');
const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('classId').isUUID(),
  body('startsAt').isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('trainerId').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn(['scheduled', 'cancelled', 'completed']),
];

const updateValidators = [
  body('startsAt').optional().isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('trainerId').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn(['scheduled', 'cancelled', 'completed']),
];

const bookingValidators = [
  body('memberId').isUUID(),
  body('status').optional().isIn(['booked', 'attended', 'cancelled', 'no_show']),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.from) {
    values.push(req.query.from);
    where.push(`s.starts_at >= $${values.length}`);
  }
  if (req.query.to) {
    values.push(req.query.to);
    where.push(`s.starts_at <= $${values.length}`);
  }
  if (req.query.classId) {
    values.push(req.query.classId);
    where.push(`s.class_id = $${values.length}`);
  }
  if (req.query.trainerId) {
    values.push(req.query.trainerId);
    where.push(`s.trainer_id = $${values.length}`);
  }
  if (req.query.status) {
    values.push(req.query.status);
    where.push(`s.status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM schedules s ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT s.*,
            c.name AS class_name,
            c.duration_minutes,
            t.first_name AS trainer_first_name,
            t.last_name AS trainer_last_name,
            (
              SELECT COUNT(*)::int
              FROM class_bookings cb
              WHERE cb.schedule_id = s.id AND cb.status IN ('booked', 'attended')
            ) AS booked_count
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     ${whereClause}
     ORDER BY s.starts_at ASC
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
    `SELECT s.*,
            c.name AS class_name,
            t.first_name AS trainer_first_name,
            t.last_name AS trainer_last_name
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Schedule not found');
  }

  const bookings = await query(
    `SELECT cb.*, m.first_name, m.last_name, m.member_code
     FROM class_bookings cb
     JOIN members m ON m.id = cb.member_id
     WHERE cb.schedule_id = $1
     ORDER BY cb.booked_at ASC`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      bookings: bookings.rows,
    },
  });
});

const create = asyncHandler(async (req, res) => {
  const {
    classId,
    trainerId,
    startsAt,
    endsAt,
    room,
    capacity,
    status,
    notes,
  } = req.body;

  const classResult = await query(
    'SELECT id, duration_minutes, capacity, default_trainer_id FROM classes WHERE id = $1',
    [classId]
  );
  if (!classResult.rows[0]) {
    throw new ApiError(404, 'Class not found');
  }

  const gymClass = classResult.rows[0];
  const resolvedTrainerId = trainerId || gymClass.default_trainer_id || null;
  const resolvedEndsAt =
    endsAt ||
    dayjs(startsAt).add(gymClass.duration_minutes, 'minute').toISOString();

  const result = await query(
    `INSERT INTO schedules (
      class_id, trainer_id, starts_at, ends_at, room, capacity, status, notes, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      classId,
      resolvedTrainerId,
      startsAt,
      resolvedEndsAt,
      room || null,
      capacity || gymClass.capacity,
      status || 'scheduled',
      notes || null,
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM schedules WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Schedule not found');
  }

  const fields = {
    class_id: req.body.classId,
    trainer_id: req.body.trainerId,
    starts_at: req.body.startsAt,
    ends_at: req.body.endsAt,
    room: req.body.room,
    capacity: req.body.capacity,
    status: req.body.status,
    notes: req.body.notes,
  };

  const sets = [];
  const values = [];

  Object.entries(fields).forEach(([column, value]) => {
    if (value !== undefined) {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
  });

  if (!sets.length) {
    throw new ApiError(400, 'No fields provided to update');
  }

  values.push(req.params.id);
  const result = await query(
    `UPDATE schedules
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM schedules WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Schedule not found');
  }

  res.json({ success: true, message: 'Schedule deleted' });
});

const addBooking = asyncHandler(async (req, res) => {
  const { memberId, status, notes } = req.body;

  const schedule = await query(
    `SELECT s.*, 
            COALESCE(s.capacity, c.capacity) AS effective_capacity
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     WHERE s.id = $1`,
    [req.params.id]
  );
  if (!schedule.rows[0]) {
    throw new ApiError(404, 'Schedule not found');
  }

  const member = await query('SELECT id FROM members WHERE id = $1', [
    memberId,
  ]);
  if (!member.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  const bookedCount = await query(
    `SELECT COUNT(*)::int AS total
     FROM class_bookings
     WHERE schedule_id = $1 AND status IN ('booked', 'attended')`,
    [req.params.id]
  );

  if (bookedCount.rows[0].total >= schedule.rows[0].effective_capacity) {
    throw new ApiError(400, 'Class session is full');
  }

  const result = await query(
    `INSERT INTO class_bookings (schedule_id, member_id, status, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.params.id, memberId, status || 'booked', notes || null]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const updateBooking = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE class_bookings
     SET status = COALESCE($1, status),
         notes = COALESCE($2, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND schedule_id = $4
     RETURNING *`,
    [
      req.body.status || null,
      req.body.notes ?? null,
      req.params.bookingId,
      req.params.id,
    ]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const removeBooking = asyncHandler(async (req, res) => {
  const result = await query(
    `DELETE FROM class_bookings
     WHERE id = $1 AND schedule_id = $2
     RETURNING id`,
    [req.params.bookingId, req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json({ success: true, message: 'Booking removed' });
});

module.exports = {
  createValidators,
  updateValidators,
  bookingValidators,
  list,
  getById,
  create,
  update,
  remove,
  addBooking,
  updateBooking,
  removeBooking,
};
