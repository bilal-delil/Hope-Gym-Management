const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');

function buildRangeFilters(queryParams, column) {
  const values = [];
  const clauses = [];

  if (queryParams.from) {
    values.push(queryParams.from);
    clauses.push(`${column} >= $${values.length}`);
  }
  if (queryParams.to) {
    values.push(queryParams.to);
    clauses.push(`${column} <= $${values.length}`);
  }

  return {
    values,
    sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '',
  };
}

const summary = asyncHandler(async (req, res) => {
  const paymentRange = buildRangeFilters(req.query, 'paid_at');
  const attendanceRange = buildRangeFilters(req.query, 'checked_in_at');
  const memberRange = buildRangeFilters(req.query, 'joined_at');
  const scheduleRange = buildRangeFilters(req.query, 'starts_at');

  const [members, payments, attendance, classes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_members,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active_members,
         COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive_members,
         COUNT(*) FILTER (WHERE true ${memberRange.sql})::int AS new_members_in_range
       FROM members`,
      memberRange.values
    ),
    query(
      `SELECT
         COUNT(*)::int AS payment_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::numeric AS total_revenue,
         COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0)::numeric AS average_payment
       FROM payments
       WHERE 1=1 ${paymentRange.sql}`,
      paymentRange.values
    ),
    query(
      `SELECT
         COUNT(*)::int AS checkin_count,
         COUNT(DISTINCT member_id)::int AS unique_members
       FROM attendance
       WHERE 1=1 ${attendanceRange.sql}`,
      attendanceRange.values
    ),
    query(
      `SELECT
         COUNT(*)::int AS scheduled_sessions,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_sessions,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_sessions
       FROM schedules
       WHERE 1=1 ${scheduleRange.sql}`,
      scheduleRange.values
    ),
  ]);

  const topPlans = await query(
    `SELECT mp.name,
            COUNT(ms.id)::int AS memberships,
            COALESCE(SUM(ms.price_paid), 0)::numeric AS revenue
     FROM membership_plans mp
     LEFT JOIN memberships ms ON ms.plan_id = mp.id
     GROUP BY mp.id
     ORDER BY memberships DESC
     LIMIT 10`
  );

  const recentPayments = await query(
    `SELECT p.id, p.amount, p.method, p.status, p.paid_at,
            m.first_name, m.last_name, m.member_code
     FROM payments p
     JOIN members m ON m.id = p.member_id
     ORDER BY p.paid_at DESC
     LIMIT 20`
  );

  res.json({
    success: true,
    data: {
      members: members.rows[0],
      payments: payments.rows[0],
      attendance: attendance.rows[0],
      classes: classes.rows[0],
      topPlans: topPlans.rows,
      recentPayments: recentPayments.rows,
    },
  });
});

const membersReport = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       m.id,
       m.member_code,
       m.first_name,
       m.last_name,
       m.email,
       m.phone,
       m.status,
       m.joined_at,
       ms.status AS membership_status,
       ms.end_date AS membership_end_date,
       mp.name AS plan_name
     FROM members m
     LEFT JOIN LATERAL (
       SELECT *
       FROM memberships
       WHERE member_id = m.id
       ORDER BY end_date DESC
       LIMIT 1
     ) ms ON true
     LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
     ORDER BY m.joined_at DESC`
  );

  res.json({ success: true, data: result.rows });
});

const paymentsReport = asyncHandler(async (req, res) => {
  const range = buildRangeFilters(req.query, 'p.paid_at');

  const result = await query(
    `SELECT
       p.id,
       p.amount,
       p.currency,
       p.method,
       p.reference,
       p.paid_at,
       m.member_code,
       m.first_name,
       m.last_name
     FROM payments p
     JOIN members m ON m.id = p.member_id
     WHERE p.status = 'completed' ${range.sql}
     ORDER BY p.paid_at DESC`,
    range.values
  );

  res.json({ success: true, data: result.rows });
});

const attendanceReport = asyncHandler(async (req, res) => {
  const range = buildRangeFilters(req.query, 'a.checked_in_at');

  const result = await query(
    `SELECT
       a.id,
       a.checked_in_at,
       a.checked_out_at,
       a.source,
       m.member_code,
       m.first_name,
       m.last_name
     FROM attendance a
     JOIN members m ON m.id = a.member_id
     WHERE 1=1 ${range.sql}
     ORDER BY a.checked_in_at DESC`,
    range.values
  );

  res.json({ success: true, data: result.rows });
});

module.exports = {
  summary,
  membersReport,
  paymentsReport,
  attendanceReport,
};
