const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const paymentsController = require('./paymentsController');

const createValidators = [
  body('amount').isFloat({ min: 0 }),
  body('method')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'mobile_money', 'other']),
  body('membershipId').optional({ nullable: true }).isUUID(),
  body('reference').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('description').optional({ nullable: true }).isString(),
];

async function requireMemberProfile(userId) {
  const result = await query(
    `SELECT id, first_name, last_name, member_code, status
     FROM members
     WHERE user_id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw new ApiError(404, 'Member profile not found for this account');
  }
  return result.rows[0];
}

const listMine = asyncHandler(async (req, res) => {
  const member = await requireMemberProfile(req.user.id);
  const { page, limit, offset } = getPagination(req.query);

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM payments WHERE member_id = $1`,
    [member.id]
  );

  const result = await query(
    `SELECT *
     FROM payments
     WHERE member_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [member.id, limit, offset]
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

const submitMine = asyncHandler(async (req, res) => {
  const member = await requireMemberProfile(req.user.id);

  req.body.memberId = member.id;
  return paymentsController.create(req, res);
});

module.exports = {
  createValidators,
  listMine,
  submitMine,
};
