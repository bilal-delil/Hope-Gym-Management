const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const upsertValidators = [
  body('key').isString().isLength({ min: 2, max: 100 }),
  body('value').exists(),
];

const list = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, key, value, description, updated_by, created_at, updated_at
     FROM settings
     ORDER BY key ASC`
  );

  res.json({ success: true, data: result.rows });
});

const getByKey = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM settings WHERE key = $1', [
    req.params.key,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, 'Setting not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const upsert = asyncHandler(async (req, res) => {
  const { key, value, description } = req.body;

  const result = await query(
    `INSERT INTO settings (key, value, description, updated_by)
     VALUES ($1, $2::jsonb, $3, $4)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           description = COALESCE(EXCLUDED.description, settings.description),
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      key,
      JSON.stringify(value),
      description || null,
      req.user.id,
    ]
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM settings WHERE key = $1 RETURNING id',
    [req.params.key]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Setting not found');
  }

  res.json({ success: true, message: 'Setting deleted' });
});

module.exports = {
  upsertValidators,
  list,
  getByKey,
  upsert,
  remove,
};
