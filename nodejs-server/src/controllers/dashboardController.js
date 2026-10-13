const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');

const overview = asyncHandler(async (req, res) => {
  const [
    totals,
    monthlyRevenue,
    weeklyAttendance,
    dailyCheckins,
    membershipStatus,
    planBreakdown,
  ] = await Promise.all([
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM members) AS total_members,
        (SELECT COUNT(*)::int FROM members WHERE status = 'active') AS active_members,
        (SELECT COUNT(*)::int FROM memberships WHERE status = 'expired') AS expired_memberships,
        (SELECT COUNT(*)::int FROM attendance WHERE checked_in_at::date = CURRENT_DATE) AS todays_checkins,
        (SELECT COUNT(*)::int FROM members WHERE joined_at >= date_trunc('month', CURRENT_DATE)) AS new_members,
        (
          SELECT COALESCE(SUM(amount), 0)::numeric
          FROM payments
          WHERE status = 'completed'
            AND paid_at >= date_trunc('month', CURRENT_DATE)
        ) AS monthly_revenue,
        (
          SELECT COUNT(*)::int
          FROM payments
          WHERE status = 'pending'
        ) AS pending_payments
    `),
    query(`
      SELECT
        to_char(date_trunc('month', paid_at), 'Mon YYYY') AS label,
        date_trunc('month', paid_at) AS month,
        COALESCE(SUM(amount), 0)::numeric AS revenue
      FROM payments
      WHERE status = 'completed'
        AND paid_at >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
      GROUP BY 1, 2
      ORDER BY month ASC
    `),
    query(`
      SELECT
        to_char(checked_in_at::date, 'DD') AS label,
        checked_in_at::date AS day,
        COUNT(*)::int AS checkins
      FROM attendance
      WHERE checked_in_at >= CURRENT_DATE - INTERVAL '8 days'
      GROUP BY 1, 2
      ORDER BY day ASC
    `),
    query(`
      SELECT
        to_char(date_trunc('hour', checked_in_at), 'HH24') AS hour_label,
        date_trunc('hour', checked_in_at) AS hour_bucket,
        COUNT(*)::int AS checkins
      FROM attendance
      WHERE checked_in_at::date = CURRENT_DATE
      GROUP BY 1, 2
      ORDER BY hour_bucket ASC
    `),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'expired')::int AS expired
      FROM memberships
    `),
    query(`
      SELECT
        mp.id,
        mp.name,
        mp.price,
        COUNT(ms.id) FILTER (WHERE ms.status = 'active')::int AS quantity,
        CASE
          WHEN (SELECT COUNT(*) FROM memberships WHERE status = 'active') = 0 THEN 0
          ELSE ROUND(
            (
              COUNT(ms.id) FILTER (WHERE ms.status = 'active')::numeric
              / NULLIF((SELECT COUNT(*) FROM memberships WHERE status = 'active'), 0)::numeric
            ) * 100,
            0
          )
        END AS progress,
        CURRENT_DATE AS date
      FROM membership_plans mp
      LEFT JOIN memberships ms ON ms.plan_id = mp.id
      WHERE mp.is_active = true
      GROUP BY mp.id
      ORDER BY mp.sort_order ASC, mp.name ASC
    `),
  ]);

  const status = membershipStatus.rows[0] || { active: 0, expired: 0 };
  const statusTotal = Number(status.active) + Number(status.expired);
  const activePercent = statusTotal
    ? Math.round((Number(status.active) / statusTotal) * 100)
    : 0;

  const revenueRows = monthlyRevenue.rows;
  let growthPercent = 0;
  if (revenueRows.length >= 2) {
    const prev = Number(revenueRows[revenueRows.length - 2].revenue);
    const current = Number(revenueRows[revenueRows.length - 1].revenue);
    if (prev > 0) {
      growthPercent = Number((((current - prev) / prev) * 100).toFixed(2));
    }
  }

  res.json({
    success: true,
    data: {
      kpis: totals.rows[0],
      monthlyRevenue: {
        growthPercent,
        series: revenueRows,
      },
      weeklyAttendance: weeklyAttendance.rows,
      dailyCheckins: dailyCheckins.rows,
      membershipStatus: {
        active: Number(status.active),
        expired: Number(status.expired),
        activePercent,
        expiredPercent: 100 - activePercent,
      },
      membershipPlans: planBreakdown.rows,
    },
  });
});

module.exports = {
  overview,
};
