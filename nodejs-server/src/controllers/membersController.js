const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('memberCode').isString().isLength({ min: 2, max: 50 }),
  body('firstName').isString().isLength({ min: 1, max: 100 }),
  body('lastName').isString().isLength({ min: 1, max: 100 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
];

const updateValidators = [
  body('memberCode').optional().isString().isLength({ min: 2, max: 50 }),
  body('firstName').optional().isString().isLength({ min: 1, max: 100 }),
  body('lastName').optional().isString().isLength({ min: 1, max: 100 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
];

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search ? `%${req.query.search}%` : null;
  const status = req.query.status || null;

  const values = [];
  const where = [];

  if (search) {
    values.push(search);
    where.push(
      `(first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR email ILIKE $${values.length} OR member_code ILIKE $${values.length} OR phone ILIKE $${values.length})`
    );
  }

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM members ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT m.*,
            (
              SELECT json_build_object(
                'id', ms.id,
                'status', ms.status,
                'startDate', ms.start_date,
                'endDate', ms.end_date,
                'planName', mp.name
              )
              FROM memberships ms
              JOIN membership_plans mp ON mp.id = ms.plan_id
              WHERE ms.member_id = m.id
              ORDER BY ms.end_date DESC
              LIMIT 1
            ) AS current_membership
     FROM members m
     ${whereClause}
     ORDER BY m.created_at DESC
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
  const result = await query('SELECT * FROM members WHERE id = $1', [
    req.params.id,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  const memberships = await query(
    `SELECT ms.*, mp.name AS plan_name, mp.billing_period, mp.price
     FROM memberships ms
     JOIN membership_plans mp ON mp.id = ms.plan_id
     WHERE ms.member_id = $1
     ORDER BY ms.start_date DESC`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      memberships: memberships.rows,
    },
  });
});

const create = asyncHandler(async (req, res) => {
  const {
    memberCode,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    emergencyContactName,
    emergencyContactPhone,
    photoUrl,
    status,
    notes,
    joinedAt,
  } = req.body;

  const result = await query(
    `INSERT INTO members (
      member_code, first_name, last_name, email, phone, date_of_birth, gender,
      address, emergency_contact_name, emergency_contact_phone, photo_url,
      status, notes, joined_at, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,COALESCE($14, CURRENT_TIMESTAMP),$15)
    RETURNING *`,
    [
      memberCode,
      firstName,
      lastName,
      email || null,
      phone || null,
      dateOfBirth || null,
      gender || null,
      address || null,
      emergencyContactName || null,
      emergencyContactPhone || null,
      photoUrl || null,
      status || 'active',
      notes || null,
      joinedAt || null,
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM members WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  const fields = {
    member_code: req.body.memberCode,
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    date_of_birth: req.body.dateOfBirth,
    gender: req.body.gender,
    address: req.body.address,
    emergency_contact_name: req.body.emergencyContactName,
    emergency_contact_phone: req.body.emergencyContactPhone,
    photo_url: req.body.photoUrl,
    status: req.body.status,
    notes: req.body.notes,
    joined_at: req.body.joinedAt,
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
    `UPDATE members
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM members WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Member not found');
  }

  res.json({ success: true, message: 'Member deleted' });
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
