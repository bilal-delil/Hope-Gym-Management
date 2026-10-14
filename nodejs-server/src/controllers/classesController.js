const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('name').isString().isLength({ min: 2, max: 150 }),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('capacity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive']),
];

const updateValidators = [
  body('name').optional().isString().isLength({ min: 2, max: 150 }),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('capacity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive']),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.status) {
    values.push(req.query.status);
    where.push(`c.status = $${values.length}`);
  }
  if (req.query.category) {
    values.push(req.query.category);
    where.push(`c.category = $${values.length}`);
  }
  if (req.query.search) {
    values.push(`%${req.query.search}%`);
    where.push(
      `(c.name ILIKE $${values.length} OR c.description ILIKE $${values.length})`
    );
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM classes c ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT c.*,
            t.first_name AS trainer_first_name,
            t.last_name AS trainer_last_name
     FROM classes c
     LEFT JOIN trainers t ON t.id = c.default_trainer_id
     ${whereClause}
     ORDER BY c.name ASC
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
    `SELECT c.*,
            t.first_name AS trainer_first_name,
            t.last_name AS trainer_last_name
     FROM classes c
     LEFT JOIN trainers t ON t.id = c.default_trainer_id
     WHERE c.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Class not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    durationMinutes,
    capacity,
    difficulty,
    status,
    defaultTrainerId,
  } = req.body;

  if (defaultTrainerId) {
    const trainer = await query('SELECT id FROM trainers WHERE id = $1', [
      defaultTrainerId,
    ]);
    if (!trainer.rows[0]) {
      throw new ApiError(400, 'Default trainer not found');
    }
  }

  const result = await query(
    `INSERT INTO classes (
      name, description, category, duration_minutes, capacity,
      difficulty, status, default_trainer_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      name,
      description || null,
      category || null,
      durationMinutes || 60,
      capacity || 20,
      difficulty || null,
      status || 'active',
      defaultTrainerId || null,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM classes WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Class not found');
  }

  const fields = {
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    duration_minutes: req.body.durationMinutes,
    capacity: req.body.capacity,
    difficulty: req.body.difficulty,
    status: req.body.status,
    default_trainer_id: req.body.defaultTrainerId,
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
    `UPDATE classes
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM classes WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Class not found');
  }

  res.json({ success: true, message: 'Class deleted' });
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
