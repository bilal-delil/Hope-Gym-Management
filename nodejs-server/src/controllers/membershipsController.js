const dayjs = require('dayjs');
const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('memberId').isUUID(),
  body('planId').isUUID(),
  body('startDate').isISO8601(),
  body('status')
    .optional()
    .isIn(['active', 'expired', 'cancelled', 'pending']),
];

const updateValidators = [
  body('status')
    .optional()
    .isIn(['active', 'expired', 'cancelled', 'pending']),
  body('planId').optional().isUUID(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('autoRenew').optional().isBoolean(),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.memberId) {
    values.push(req.query.memberId);
    where.push(`ms.member_id = $${values.length}`);
  }
  if (req.query.planId) {
    values.push(req.query.planId);
    where.push(`ms.plan_id = $${values.length}`);
  }
  if (req.query.status) {
    values.push(req.query.status);
    where.push(`ms.status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM memberships ms ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT ms.*,
            mp.name AS plan_name,
            mp.billing_period,
            m.first_name,
            m.last_name,
            m.member_code,
            m.email AS member_email
     FROM memberships ms
     JOIN membership_plans mp ON mp.id = ms.plan_id
     JOIN members m ON m.id = ms.member_id
     ${whereClause}
     ORDER BY ms.created_at DESC
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
    `SELECT ms.*,
            mp.name AS plan_name,
            mp.billing_period,
            mp.price AS plan_price,
            m.first_name,
            m.last_name,
            m.member_code
     FROM memberships ms
     JOIN membership_plans mp ON mp.id = ms.plan_id
     JOIN members m ON m.id = ms.member_id
     WHERE ms.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Membership not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const {
    memberId,
    planId,
    startDate,
    endDate,
    status,
    pricePaid,
    autoRenew,
    notes,
  } = req.body;

  const member = await query('SELECT id FROM members WHERE id = $1', [
    memberId,
  ]);
  if (!member.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  const plan = await query(
    'SELECT id, duration_days, price FROM membership_plans WHERE id = $1',
    [planId]
  );
  if (!plan.rows[0]) {
    throw new ApiError(404, 'Membership plan not found');
  }

  const computedEnd =
    endDate ||
    dayjs(startDate).add(plan.rows[0].duration_days, 'day').format('YYYY-MM-DD');

  const result = await query(
    `INSERT INTO memberships (
      member_id, plan_id, status, start_date, end_date, price_paid,
      auto_renew, notes, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      memberId,
      planId,
      status || 'active',
      startDate,
      computedEnd,
      pricePaid ?? plan.rows[0].price,
      autoRenew || false,
      notes || null,
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM memberships WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Membership not found');
  }

  const fields = {
    status: req.body.status,
    start_date: req.body.startDate,
    end_date: req.body.endDate,
    price_paid: req.body.pricePaid,
    auto_renew: req.body.autoRenew,
    notes: req.body.notes,
    plan_id: req.body.planId,
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
    `UPDATE memberships
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM memberships WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Membership not found');
  }

  res.json({ success: true, message: 'Membership deleted' });
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
