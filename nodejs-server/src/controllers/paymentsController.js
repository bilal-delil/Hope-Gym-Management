const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const { query, getClient } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { notifyAdmins, notifyUser } = require('../utils/notifyAdmins');

const createValidators = [
  body('memberId').isUUID(),
  body('amount').isFloat({ min: 0 }),
  body('method')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'mobile_money', 'other']),
  body('membershipId').optional({ nullable: true }).isUUID(),
  body('reference').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('description').optional({ nullable: true }).isString(),
];

const declineValidators = [
  body('rejectionReason').isString().isLength({ min: 3, max: 1000 }),
];

function paymentSelect() {
  return `
    SELECT p.*,
           m.first_name,
           m.last_name,
           m.member_code,
           m.email AS member_email,
           submitter.full_name AS submitted_by_name,
           reviewer.full_name AS reviewed_by_name
    FROM payments p
    JOIN members m ON m.id = p.member_id
    LEFT JOIN users submitter ON submitter.id = p.submitted_by
    LEFT JOIN users reviewer ON reviewer.id = p.reviewed_by
  `;
}

function cleanupUploadedFile(file) {
  if (!file?.path) return;
  fs.unlink(file.path, () => {});
}

function buildProofUrls(req, filename) {
  // Files live on disk at nodejs-server/uploads/payments/<filename>
  // and are served by Express static at /uploads/payments/<filename>.
  const relativePath = path.posix.join('uploads', 'payments', filename);
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const proofImageUrl = `${proto}://${host}/${relativePath}`;
  return {
    proofImagePath: relativePath,
    proofImageUrl,
  };
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.memberId) {
    values.push(req.query.memberId);
    where.push(`p.member_id = $${values.length}`);
  }
  if (req.query.status) {
    values.push(req.query.status);
    where.push(`p.status = $${values.length}`);
  }
  if (req.query.from) {
    values.push(req.query.from);
    where.push(`p.created_at >= $${values.length}`);
  }
  if (req.query.to) {
    values.push(req.query.to);
    where.push(`p.created_at <= $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM payments p ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `${paymentSelect()}
     ${whereClause}
     ORDER BY
       CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
       p.created_at DESC
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

const listPending = asyncHandler(async (req, res) => {
  req.query.status = 'pending';
  return list(req, res);
});

const getById = asyncHandler(async (req, res) => {
  const result = await query(`${paymentSelect()} WHERE p.id = $1`, [
    req.params.id,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, 'Payment not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Payment proof image is required');
  }

  const {
    memberId,
    membershipId,
    amount,
    currency,
    method,
    reference,
    description,
  } = req.body;

  const member = await query(
    'SELECT id, first_name, last_name, member_code FROM members WHERE id = $1',
    [memberId]
  );
  if (!member.rows[0]) {
    cleanupUploadedFile(req.file);
    throw new ApiError(404, 'Member not found');
  }

  if (membershipId) {
    const membership = await query(
      'SELECT id FROM memberships WHERE id = $1 AND member_id = $2',
      [membershipId, memberId]
    );
    if (!membership.rows[0]) {
      cleanupUploadedFile(req.file);
      throw new ApiError(400, 'Membership does not belong to this member');
    }
  }

  const { proofImagePath, proofImageUrl } = buildProofUrls(
    req,
    req.file.filename
  );

  try {
    const result = await query(
      `INSERT INTO payments (
         member_id, membership_id, amount, currency, status, method,
         reference, description, proof_image_path, proof_image_url, submitted_by
       ) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        memberId,
        membershipId || null,
        amount,
        currency || 'USD',
        method || 'bank_transfer',
        reference || null,
        description || null,
        proofImagePath,
        proofImageUrl,
        req.user.id,
      ]
    );

    const payment = result.rows[0];
    const memberName = `${member.rows[0].first_name} ${member.rows[0].last_name}`;

    await notifyAdmins({
      title: 'New payment proof submitted',
      body: `${memberName} (${member.rows[0].member_code}) submitted a payment of ${payment.amount} ${payment.currency} for review.`,
      type: 'payment',
      meta: { paymentId: payment.id, memberId },
    });

    const detailed = await query(`${paymentSelect()} WHERE p.id = $1`, [
      payment.id,
    ]);

    res.status(201).json({ success: true, data: detailed.rows[0] });
  } catch (error) {
    cleanupUploadedFile(req.file);
    throw error;
  }
});

const approve = asyncHandler(async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT * FROM payments WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const payment = existing.rows[0];

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }
    if (payment.status !== 'pending') {
      throw new ApiError(400, 'Only pending payments can be approved');
    }

    const updated = await client.query(
      `UPDATE payments
       SET status = 'completed',
           paid_at = CURRENT_TIMESTAMP,
           rejection_reason = NULL,
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (payment.membership_id) {
      await client.query(
        `UPDATE memberships
         SET status = 'active',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [payment.membership_id]
      );
    }

    await client.query('COMMIT');

    const memberUser = await query(
      'SELECT user_id FROM members WHERE id = $1',
      [payment.member_id]
    );
    await notifyUser(memberUser.rows[0]?.user_id, {
      title: 'Payment approved',
      body: `Your payment of ${updated.rows[0].amount} ${updated.rows[0].currency} was approved.`,
      type: 'payment',
      meta: { paymentId: updated.rows[0].id },
    });

    const detailed = await query(`${paymentSelect()} WHERE p.id = $1`, [
      updated.rows[0].id,
    ]);

    res.json({
      success: true,
      message: 'Payment approved',
      data: detailed.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const decline = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const existing = await query('SELECT * FROM payments WHERE id = $1', [
    req.params.id,
  ]);
  const payment = existing.rows[0];

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }
  if (payment.status !== 'pending') {
    throw new ApiError(400, 'Only pending payments can be declined');
  }

  const updated = await query(
    `UPDATE payments
     SET status = 'declined',
         rejection_reason = $1,
         reviewed_by = $2,
         reviewed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [rejectionReason, req.user.id, req.params.id]
  );

  const memberUser = await query(
    'SELECT user_id FROM members WHERE id = $1',
    [payment.member_id]
  );
  await notifyUser(memberUser.rows[0]?.user_id, {
    title: 'Payment declined',
    body:
      rejectionReason ||
      `Your payment of ${updated.rows[0].amount} ${updated.rows[0].currency} was declined.`,
    type: 'payment',
    meta: { paymentId: updated.rows[0].id },
  });

  const detailed = await query(`${paymentSelect()} WHERE p.id = $1`, [
    updated.rows[0].id,
  ]);

  res.json({
    success: true,
    message: 'Payment declined',
    data: detailed.rows[0],
  });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await query(
    'SELECT id, proof_image_path, status FROM payments WHERE id = $1',
    [req.params.id]
  );

  if (!existing.rows[0]) {
    throw new ApiError(404, 'Payment not found');
  }

  await query('DELETE FROM payments WHERE id = $1', [req.params.id]);

  if (existing.rows[0].proof_image_path) {
    const absolute = path.join(process.cwd(), existing.rows[0].proof_image_path);
    fs.unlink(absolute, () => {});
  }

  res.json({ success: true, message: 'Payment deleted' });
});

module.exports = {
  createValidators,
  declineValidators,
  list,
  listPending,
  getById,
  create,
  approve,
  decline,
  remove,
};
