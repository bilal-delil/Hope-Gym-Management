const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('firstName').isString().isLength({ min: 1, max: 100 }),
  body('lastName').isString().isLength({ min: 1, max: 100 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('status').optional().isIn(['active', 'inactive', 'on_leave']),
];

const updateValidators = [
  body('firstName').optional().isString().isLength({ min: 1, max: 100 }),
  body('lastName').optional().isString().isLength({ min: 1, max: 100 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('status').optional().isIn(['active', 'inactive', 'on_leave']),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.status) {
    values.push(req.query.status);
    where.push(`status = $${values.length}`);
  }
  if (req.query.search) {
    values.push(`%${req.query.search}%`);
    where.push(
      `(first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR email ILIKE $${values.length})`
    );
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM trainers ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT * FROM trainers
     ${whereClause}
     ORDER BY last_name ASC, first_name ASC
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
  const result = await query('SELECT * FROM trainers WHERE id = $1', [
    req.params.id,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, 'Trainer not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    specialties,
    bio,
    photoUrl,
    status,
    hireDate,
    userId,
  } = req.body;

  const result = await query(
    `INSERT INTO trainers (
      first_name, last_name, email, phone, specialties, bio,
      photo_url, status, hire_date, user_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      firstName,
      lastName,
      email || null,
      phone || null,
      specialties || [],
      bio || null,
      photoUrl || null,
      status || 'active',
      hireDate || null,
      userId || null,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM trainers WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Trainer not found');
  }

  const fields = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    specialties: req.body.specialties,
    bio: req.body.bio,
    photo_url: req.body.photoUrl,
    status: req.body.status,
    hire_date: req.body.hireDate,
    user_id: req.body.userId,
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
    `UPDATE trainers
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM trainers WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Trainer not found');
  }

  res.json({ success: true, message: 'Trainer deleted' });
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
