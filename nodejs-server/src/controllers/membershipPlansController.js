const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('name').isString().isLength({ min: 2, max: 150 }),
  body('billingPeriod').isIn([
    'monthly',
    'quarterly',
    'semi_annual',
    'annual',
    'custom',
  ]),
  body('durationDays').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
];

const updateValidators = [
  body('name').optional().isString().isLength({ min: 2, max: 150 }),
  body('billingPeriod')
    .optional()
    .isIn(['monthly', 'quarterly', 'semi_annual', 'annual', 'custom']),
  body('durationDays').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const activeOnly = req.query.active === 'true';

  const where = activeOnly ? 'WHERE is_active = true' : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM membership_plans ${where}`
  );

  const result = await query(
    `SELECT mp.*,
            (
              SELECT COUNT(*)::int
              FROM memberships ms
              WHERE ms.plan_id = mp.id AND ms.status = 'active'
            ) AS active_members
     FROM membership_plans mp
     ${where}
     ORDER BY mp.sort_order ASC, mp.name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
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
    `SELECT mp.*,
            (
              SELECT COUNT(*)::int
              FROM memberships ms
              WHERE ms.plan_id = mp.id AND ms.status = 'active'
            ) AS active_members
     FROM membership_plans mp
     WHERE mp.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Membership plan not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    billingPeriod,
    durationDays,
    price,
    currency,
    features,
    isActive,
    sortOrder,
  } = req.body;

  const result = await query(
    `INSERT INTO membership_plans (
      name, description, billing_period, duration_days, price, currency,
      features, is_active, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      name,
      description || null,
      billingPeriod,
      durationDays,
      price,
      currency || 'USD',
      JSON.stringify(features || []),
      isActive !== undefined ? isActive : true,
      sortOrder || 0,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query(
    'SELECT id FROM membership_plans WHERE id = $1',
    [req.params.id]
  );
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Membership plan not found');
  }

  const fields = {
    name: req.body.name,
    description: req.body.description,
    billing_period: req.body.billingPeriod,
    duration_days: req.body.durationDays,
    price: req.body.price,
    currency: req.body.currency,
    features:
      req.body.features !== undefined
        ? JSON.stringify(req.body.features)
        : undefined,
    is_active: req.body.isActive,
    sort_order: req.body.sortOrder,
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
    `UPDATE membership_plans
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const inUse = await query(
    'SELECT id FROM memberships WHERE plan_id = $1 LIMIT 1',
    [req.params.id]
  );
  if (inUse.rows[0]) {
    throw new ApiError(
      400,
      'Cannot delete a plan that has membership records. Deactivate it instead.'
    );
  }

  const result = await query(
    'DELETE FROM membership_plans WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Membership plan not found');
  }

  res.json({ success: true, message: 'Membership plan deleted' });
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
