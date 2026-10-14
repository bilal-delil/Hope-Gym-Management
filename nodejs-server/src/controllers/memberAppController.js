const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { publicUser } = require('../utils/tokens');
const { notifyAdmins } = require('../utils/notifyAdmins');

const updateProfileValidators = [
  body('firstName').optional().isString().isLength({ min: 1, max: 100 }),
  body('lastName').optional().isString().isLength({ min: 1, max: 100 }),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('dateOfBirth').optional({ nullable: true }).isISO8601(),
  body('gender').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('address').optional({ nullable: true }).isString(),
  body('emergencyContactName')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 150 }),
  body('emergencyContactPhone')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 50 }),
];

async function requireMember(userId) {
  const result = await query(
    `SELECT id, user_id, member_code, first_name, last_name, email, phone,
            photo_url, status, joined_at, date_of_birth, gender, address,
            emergency_contact_name, emergency_contact_phone, notes
     FROM members
     WHERE user_id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw new ApiError(404, 'Member profile not found');
  }
  return result.rows[0];
}

const me = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);

  const membership = await query(
    `SELECT ms.*, mp.name AS plan_name, mp.billing_period, mp.price, mp.duration_days
     FROM memberships ms
     JOIN membership_plans mp ON mp.id = ms.plan_id
     WHERE ms.member_id = $1
     ORDER BY ms.end_date DESC
     LIMIT 1`,
    [member.id]
  );

  res.json({
    success: true,
    data: {
      user: publicUser(req.user, member),
      member,
      membership: membership.rows[0] || null,
    },
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);

  const fields = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    phone: req.body.phone,
    date_of_birth: req.body.dateOfBirth,
    gender: req.body.gender,
    address: req.body.address,
    emergency_contact_name: req.body.emergencyContactName,
    emergency_contact_phone: req.body.emergencyContactPhone,
  };

  const sets = [];
  const values = [];
  Object.entries(fields).forEach(([column, value]) => {
    if (value !== undefined) {
      values.push(value === '' ? null : value);
      sets.push(`${column} = $${values.length}`);
    }
  });

  if (!sets.length) {
    throw new ApiError(400, 'No fields provided to update');
  }

  values.push(member.id);
  const result = await query(
    `UPDATE members
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  const updated = result.rows[0];

  await notifyAdmins({
    title: 'Member profile updated (PWA)',
    body: `${updated.first_name} ${updated.last_name} (${updated.member_code}) updated their details.`,
    type: 'member',
    meta: { memberId: updated.id, source: 'pwa' },
  });

  const membership = await query(
    `SELECT ms.*, mp.name AS plan_name, mp.billing_period, mp.price, mp.duration_days
     FROM memberships ms
     JOIN membership_plans mp ON mp.id = ms.plan_id
     WHERE ms.member_id = $1
     ORDER BY ms.end_date DESC
     LIMIT 1`,
    [updated.id]
  );

  res.json({
    success: true,
    data: {
      user: publicUser(req.user, updated),
      member: updated,
      membership: membership.rows[0] || null,
    },
  });
});

const overview = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);

  const [
    membership,
    checkins,
    pendingPayments,
    upcoming,
    announcements,
    trainers,
    unread,
  ] = await Promise.all([
    query(
      `SELECT ms.status, ms.start_date, ms.end_date, mp.name AS plan_name, mp.price
         FROM memberships ms
         JOIN membership_plans mp ON mp.id = ms.plan_id
         WHERE ms.member_id = $1
         ORDER BY ms.end_date DESC
         LIMIT 1`,
      [member.id]
    ),
    query(
      `SELECT COUNT(*)::int AS total
         FROM attendance
         WHERE member_id = $1 AND checked_in_at >= date_trunc('month', CURRENT_DATE)`,
      [member.id]
    ),
    query(
      `SELECT COUNT(*)::int AS total
         FROM payments
         WHERE member_id = $1 AND status = 'pending'`,
      [member.id]
    ),
    query(
      `SELECT s.id, s.starts_at, s.ends_at, s.room, s.status,
                c.name AS class_name, c.duration_minutes,
                t.first_name AS trainer_first_name, t.last_name AS trainer_last_name,
                EXISTS (
                  SELECT 1 FROM class_bookings cb
                  WHERE cb.schedule_id = s.id
                    AND cb.member_id = $1
                    AND cb.status IN ('booked', 'attended')
                ) AS booked
         FROM schedules s
         JOIN classes c ON c.id = s.class_id
         LEFT JOIN trainers t ON t.id = s.trainer_id
         WHERE s.status = 'scheduled' AND s.starts_at >= CURRENT_TIMESTAMP
         ORDER BY s.starts_at ASC
         LIMIT 5`,
      [member.id]
    ),
    query(
      `SELECT id, title, body, priority, starts_at, is_pinned
         FROM announcements
         WHERE starts_at <= CURRENT_TIMESTAMP
           AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
         ORDER BY is_pinned DESC, starts_at DESC
         LIMIT 5`
    ),
    query(
      `SELECT id, first_name, last_name, specialties, bio, photo_url
         FROM trainers
         WHERE status = 'active'
         ORDER BY first_name ASC, last_name ASC
         LIMIT 12`
    ),
    query(
      `SELECT COUNT(*)::int AS total
         FROM notifications
         WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    ),
  ]);

  res.json({
    success: true,
    data: {
      member,
      membership: membership.rows[0] || null,
      monthlyCheckins: checkins.rows[0].total,
      pendingPayments: pendingPayments.rows[0].total,
      unreadNotifications: unread.rows[0].total,
      upcomingClasses: upcoming.rows,
      announcements: announcements.rows,
      trainers: trainers.rows,
    },
  });
});

const listPlans = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, name, description, billing_period, duration_days, price, currency, features
     FROM membership_plans
     WHERE is_active = true
     ORDER BY sort_order ASC, name ASC`
  );
  res.json({ success: true, data: result.rows });
});

const listSchedules = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);
  const { page, limit, offset } = getPagination(req.query);

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM schedules s
     WHERE s.status = 'scheduled' AND s.starts_at >= CURRENT_TIMESTAMP`
  );

  const result = await query(
    `SELECT s.*,
            c.name AS class_name,
            c.category,
            c.duration_minutes,
            c.difficulty,
            t.first_name AS trainer_first_name,
            t.last_name AS trainer_last_name,
            COALESCE(s.capacity, c.capacity) AS effective_capacity,
            (
              SELECT COUNT(*)::int FROM class_bookings cb
              WHERE cb.schedule_id = s.id AND cb.status IN ('booked', 'attended')
            ) AS booked_count,
            EXISTS (
              SELECT 1 FROM class_bookings cb
              WHERE cb.schedule_id = s.id
                AND cb.member_id = $1
                AND cb.status IN ('booked', 'attended')
            ) AS booked
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.status = 'scheduled' AND s.starts_at >= CURRENT_TIMESTAMP
     ORDER BY s.starts_at ASC
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

const bookSchedule = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);

  const schedule = await query(
    `SELECT s.*, COALESCE(s.capacity, c.capacity) AS effective_capacity
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     WHERE s.id = $1 AND s.status = 'scheduled'`,
    [req.params.id]
  );
  if (!schedule.rows[0]) {
    throw new ApiError(404, 'Schedule not found');
  }

  const existing = await query(
    `SELECT id, status FROM class_bookings
     WHERE schedule_id = $1 AND member_id = $2`,
    [req.params.id, member.id]
  );
  if (existing.rows[0] && ['booked', 'attended'].includes(existing.rows[0].status)) {
    throw new ApiError(400, 'Already booked for this session');
  }

  const bookedCount = await query(
    `SELECT COUNT(*)::int AS total
     FROM class_bookings
     WHERE schedule_id = $1 AND status IN ('booked', 'attended')`,
    [req.params.id]
  );
  if (bookedCount.rows[0].total >= schedule.rows[0].effective_capacity) {
    throw new ApiError(400, 'Class session is full');
  }

  let result;
  if (existing.rows[0]) {
    result = await query(
      `UPDATE class_bookings
       SET status = 'booked', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id]
    );
  } else {
    result = await query(
      `INSERT INTO class_bookings (schedule_id, member_id, status)
       VALUES ($1, $2, 'booked')
       RETURNING *`,
      [req.params.id, member.id]
    );
  }

  const classInfo = await query(
    `SELECT c.name AS class_name, s.starts_at
     FROM schedules s
     JOIN classes c ON c.id = s.class_id
     WHERE s.id = $1`,
    [req.params.id]
  );

  await notifyAdmins({
    title: 'Class booked (PWA)',
    body: `${member.first_name} ${member.last_name} booked ${
      classInfo.rows[0]?.class_name || 'a class'
    }.`,
    type: 'booking',
    meta: {
      bookingId: result.rows[0].id,
      scheduleId: req.params.id,
      memberId: member.id,
      source: 'pwa',
    },
  });

  res.status(201).json({ success: true, data: result.rows[0] });
});

const listBookings = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);
  const result = await query(
    `SELECT cb.*, s.starts_at, s.ends_at, s.room, c.name AS class_name
     FROM class_bookings cb
     JOIN schedules s ON s.id = cb.schedule_id
     JOIN classes c ON c.id = s.class_id
     WHERE cb.member_id = $1
     ORDER BY s.starts_at DESC
     LIMIT 50`,
    [member.id]
  );
  res.json({ success: true, data: result.rows });
});

const listAttendance = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);
  const { page, limit, offset } = getPagination(req.query);

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM attendance WHERE member_id = $1`,
    [member.id]
  );
  const result = await query(
    `SELECT * FROM attendance
     WHERE member_id = $1
     ORDER BY checked_in_at DESC
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

const checkIn = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);

  if (member.status !== 'active') {
    throw new ApiError(403, 'Member account is not active');
  }

  const open = await query(
    `SELECT id FROM attendance
     WHERE member_id = $1 AND checked_out_at IS NULL
     ORDER BY checked_in_at DESC
     LIMIT 1`,
    [member.id]
  );
  if (open.rows[0]) {
    throw new ApiError(400, 'You already have an open check-in');
  }

  const result = await query(
    `INSERT INTO attendance (member_id, source, notes)
     VALUES ($1, 'pwa', $2)
     RETURNING *`,
    [member.id, req.body.notes || null]
  );

  await notifyAdmins({
    title: 'Member checked in (PWA)',
    body: `${member.first_name} ${member.last_name} (${member.member_code}) checked in.`,
    type: 'attendance',
    meta: { attendanceId: result.rows[0].id, memberId: member.id, source: 'pwa' },
  });

  res.status(201).json({ success: true, data: result.rows[0] });
});

const checkOut = asyncHandler(async (req, res) => {
  const member = await requireMember(req.user.id);
  const result = await query(
    `UPDATE attendance
     SET checked_out_at = CURRENT_TIMESTAMP
     WHERE member_id = $1 AND checked_out_at IS NULL
     RETURNING *`,
    [member.id]
  );
  if (!result.rows[0]) {
    throw new ApiError(404, 'No open check-in found');
  }

  await notifyAdmins({
    title: 'Member checked out (PWA)',
    body: `${member.first_name} ${member.last_name} (${member.member_code}) checked out.`,
    type: 'attendance',
    meta: { attendanceId: result.rows[0].id, memberId: member.id, source: 'pwa' },
  });

  res.json({ success: true, data: result.rows[0] });
});

const listAnnouncements = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, title, body, priority, is_pinned, starts_at, ends_at
     FROM announcements
     WHERE starts_at <= CURRENT_TIMESTAMP
       AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
     ORDER BY is_pinned DESC, starts_at DESC
     LIMIT 50`
  );
  res.json({ success: true, data: result.rows });
});

const listTrainers = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, first_name, last_name, specialties, bio, photo_url
     FROM trainers
     WHERE status = 'active'
     ORDER BY first_name ASC, last_name ASC`
  );
  res.json({ success: true, data: result.rows });
});

const listContent = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, title, slug, excerpt, cover_image_url, tags, published_at
     FROM content_posts
     WHERE status = 'published'
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT 50`
  );
  res.json({ success: true, data: result.rows });
});

const getContent = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, title, slug, excerpt, body, cover_image_url, tags, published_at
     FROM content_posts
     WHERE id = $1 AND status = 'published'`,
    [req.params.id]
  );
  if (!result.rows[0]) {
    throw new ApiError(404, 'Post not found');
  }
  res.json({ success: true, data: result.rows[0] });
});

module.exports = {
  me,
  updateMe,
  updateProfileValidators,
  overview,
  listPlans,
  listSchedules,
  bookSchedule,
  listBookings,
  listAttendance,
  checkIn,
  checkOut,
  listAnnouncements,
  listTrainers,
  listContent,
  getContent,
};
