const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('title').isString().isLength({ min: 2, max: 255 }),
  body('body').isString().isLength({ min: 1 }),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
];

const updateValidators = [
  body('title').optional().isString().isLength({ min: 2, max: 255 }),
  body('body').optional().isString().isLength({ min: 1 }),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('isPinned').optional().isBoolean(),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.active === 'true') {
    where.push(
      `(starts_at <= CURRENT_TIMESTAMP AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP))`
    );
  }
  if (req.query.priority) {
    values.push(req.query.priority);
    where.push(`priority = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM announcements ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT a.*, u.full_name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ${whereClause}
     ORDER BY a.is_pinned DESC, a.starts_at DESC
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
  const result = await query('SELECT * FROM announcements WHERE id = $1', [
    req.params.id,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const {
    title,
    body: announcementBody,
    priority,
    isPinned,
    startsAt,
    endsAt,
    audience,
  } = req.body;

  const result = await query(
    `INSERT INTO announcements (
      title, body, priority, is_pinned, starts_at, ends_at, audience, created_by
    ) VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_TIMESTAMP),$6,$7,$8)
    RETURNING *`,
    [
      title,
      announcementBody,
      priority || 'normal',
      isPinned || false,
      startsAt || null,
      endsAt || null,
      audience || 'all',
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM announcements WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Announcement not found');
  }

  const fields = {
    title: req.body.title,
    body: req.body.body,
    priority: req.body.priority,
    is_pinned: req.body.isPinned,
    starts_at: req.body.startsAt,
    ends_at: req.body.endsAt,
    audience: req.body.audience,
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
    `UPDATE announcements
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM announcements WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, message: 'Announcement deleted' });
});

module.exports = {
  createValidators,
  updateValidators,
  list,
  getById,
  create,
  update,
  remove,
};
