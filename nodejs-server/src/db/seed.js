require('dotenv').config();

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { pool, query } = require('./pool');
const env = require('../config/env');

function ensureSeedProofImage() {
  const proofPath = path.join(process.cwd(), 'uploads', 'payments', 'seed-proof.png');
  fs.mkdirSync(path.dirname(proofPath), { recursive: true });
  if (!fs.existsSync(proofPath)) {
    // Minimal valid 1x1 PNG
    fs.writeFileSync(
      proofPath,
      Buffer.from(
        '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8ffff3f0005fe02fea75a5a3a0000000049454e44ae426082',
        'hex'
      )
    );
  }
  return {
    proofPath: 'uploads/payments/seed-proof.png',
    proofUrl: 'http://localhost:4000/uploads/payments/seed-proof.png',
  };
}

async function seed() {
  console.log('Seeding Hope Gym database...');
  const { proofPath, proofUrl } = ensureSeedProofImage();

  const adminResult = await query(
    `INSERT INTO users (email, full_name, role, phone, is_active)
     VALUES ($1, $2, 'admin', '+10000000000', true)
     ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           role = 'admin',
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [env.seed.adminEmail, env.seed.adminName]
  );

  const adminId = adminResult.rows[0].id;

  await query(
    `INSERT INTO settings (key, value, description, updated_by)
     VALUES
       ('gym_name', '{"value":"Hope Gym"}'::jsonb, 'Display name', $1),
       ('currency', '{"value":"USD"}'::jsonb, 'Default currency', $1),
       ('timezone', '{"value":"UTC"}'::jsonb, 'Default timezone', $1),
       ('check_in_grace_minutes', '{"value":15}'::jsonb, 'Late check-in grace', $1)
     ON CONFLICT (key) DO NOTHING`,
    [adminId]
  );

  const plans = [
    ['Monthly Plan', 'monthly', 30, 49.99, 1],
    ['Quarterly Plan', 'quarterly', 90, 129.99, 2],
    ['Semi-Annual Plan', 'semi_annual', 180, 239.99, 3],
    ['Annual Plan', 'annual', 365, 449.99, 4],
    ['Custom Plan', 'custom', 60, 99.99, 5],
  ];

  for (const [name, period, days, price, sort] of plans) {
    await query(
      `INSERT INTO membership_plans (
         name, description, billing_period, duration_days, price, features, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (name) DO UPDATE
         SET billing_period = EXCLUDED.billing_period,
             duration_days = EXCLUDED.duration_days,
             price = EXCLUDED.price,
             sort_order = EXCLUDED.sort_order,
             updated_at = CURRENT_TIMESTAMP`,
      [
        name,
        `${name} membership`,
        period,
        days,
        price,
        JSON.stringify(['Gym access', 'Locker room']),
        sort,
      ]
    );
  }

  const planRows = (
    await query('SELECT id, name, duration_days, price FROM membership_plans ORDER BY sort_order')
  ).rows;

  const memberDefs = [
    ['HG-001', 'Amina', 'Hassan', 'amina@example.com', 'active'],
    ['HG-002', 'Omar', 'Ali', 'omar@example.com', 'active'],
    ['HG-003', 'Sara', 'Mohamed', 'sara@example.com', 'active'],
    ['HG-004', 'John', 'Doe', 'john@example.com', 'inactive'],
    ['HG-005', 'Layla', 'Ibrahim', 'layla@example.com', 'active'],
    ['HG-006', 'Noah', 'Khan', 'noah@example.com', 'active'],
    ['HG-007', 'Fatima', 'Yusuf', 'fatima@example.com', 'active'],
    ['HG-008', 'Daniel', 'Bekele', 'daniel@example.com', 'suspended'],
  ];

  const memberIds = [];
  for (const [code, first, last, email, status] of memberDefs) {
    const result = await query(
      `INSERT INTO members (
         member_code, first_name, last_name, email, phone, status, created_by, joined_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP - ($8 || ' days')::interval)
       ON CONFLICT (member_code) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             email = EXCLUDED.email,
             status = EXCLUDED.status,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        code,
        first,
        last,
        email,
        '+1555000' + code.slice(-3),
        status,
        adminId,
        String(Math.floor(Math.random() * 120)),
      ]
    );
    memberIds.push(result.rows[0].id);
  }

  for (let i = 0; i < memberIds.length; i += 1) {
    const plan = planRows[i % planRows.length];
    const start = dayjs().subtract(20 + i * 7, 'day');
    const end = start.add(plan.duration_days, 'day');
    const status = end.isBefore(dayjs()) ? 'expired' : 'active';

    await query(
      `INSERT INTO memberships (
         member_id, plan_id, status, start_date, end_date, price_paid, created_by
       )
       SELECT $1, $2, $3, $4, $5, $6, $7
       WHERE NOT EXISTS (
         SELECT 1 FROM memberships WHERE member_id = $1 AND plan_id = $2 AND start_date = $4
       )`,
      [
        memberIds[i],
        plan.id,
        status,
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD'),
        plan.price,
        adminId,
      ]
    );

    const paymentStatus = i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'completed' : 'declined';
    const description = `Seed payment for ${plan.name}`;
    const exists = await query(
      `SELECT id FROM payments WHERE member_id = $1 AND description = $2 LIMIT 1`,
      [memberIds[i], description]
    );
    if (!exists.rows[0]) {
      await query(
        `INSERT INTO payments (
           member_id, amount, currency, status, method, description,
           proof_image_path, proof_image_url, paid_at, submitted_by,
           reviewed_by, reviewed_at, rejection_reason
         ) VALUES (
           $1, $2, 'USD', $3::payment_status, 'bank_transfer', $4,
           $5, $6, $7, $8::uuid, $9::uuid, $10, $11
         )`,
        [
          memberIds[i],
          plan.price,
          paymentStatus,
          description,
          proofPath,
          proofUrl,
          paymentStatus === 'completed' ? start.toISOString() : null,
          adminId,
          paymentStatus === 'pending' ? null : adminId,
          paymentStatus === 'pending' ? null : start.toISOString(),
          paymentStatus === 'declined' ? 'Unclear transfer screenshot' : null,
        ]
      );
    }
  }

  for (let day = 0; day < 9; day += 1) {
    for (let i = 0; i < Math.min(memberIds.length, 3 + (day % 3)); i += 1) {
      const checkedIn = dayjs()
        .subtract(day, 'day')
        .hour(7 + i * 2)
        .minute(15)
        .second(0);

      await query(
        `INSERT INTO attendance (member_id, checked_in_at, source, recorded_by)
         SELECT $1, $2, 'manual', $3
         WHERE NOT EXISTS (
           SELECT 1 FROM attendance
           WHERE member_id = $1 AND checked_in_at = $2
         )`,
        [memberIds[i], checkedIn.toISOString(), adminId]
      );
    }
  }

  const trainerResult = await query(
    `INSERT INTO trainers (
       first_name, last_name, email, phone, specialties, bio, status, hire_date
     ) VALUES
       ('Maya', 'Brooks', 'maya.brooks@hopegym.local', '+15551110001', ARRAY['HIIT','Strength'], 'Strength coach', 'active', CURRENT_DATE - 200),
       ('Leo', 'Nguyen', 'leo.nguyen@hopegym.local', '+15551110002', ARRAY['Yoga','Mobility'], 'Yoga specialist', 'active', CURRENT_DATE - 120)
     ON CONFLICT (email) DO UPDATE
       SET first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           updated_at = CURRENT_TIMESTAMP
     RETURNING id, email`
  );

  const trainers = trainerResult.rows;
  if (!trainers.length) {
    const existing = await query(
      `SELECT id, email FROM trainers WHERE email IN ('maya.brooks@hopegym.local', 'leo.nguyen@hopegym.local')`
    );
    trainers.push(...existing.rows);
  }

  const classDefs = [
    ['Morning HIIT', 'High intensity interval training', 'HIIT', 45, 20, 'advanced', trainers[0]?.id || null],
    ['Yoga Flow', 'All-levels yoga session', 'Yoga', 60, 25, 'beginner', trainers[1]?.id || trainers[0]?.id || null],
    ['Strength Circuit', 'Full body strength', 'Strength', 50, 15, 'intermediate', trainers[0]?.id || null],
  ];

  const classes = [];
  for (const [name, description, category, duration, capacity, difficulty, trainerId] of classDefs) {
    const existing = await query('SELECT id, name FROM classes WHERE name = $1', [name]);
    if (existing.rows[0]) {
      classes.push(existing.rows[0]);
      continue;
    }

    const created = await query(
      `INSERT INTO classes (
         name, description, category, duration_minutes, capacity, difficulty, status, default_trainer_id
       ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
       RETURNING id, name`,
      [name, description, category, duration, capacity, difficulty, trainerId]
    );
    classes.push(created.rows[0]);
  }

  for (let i = 0; i < classes.length; i += 1) {
    const startsAt = dayjs().add(i + 1, 'day').hour(9).minute(0).second(0);
    await query(
      `INSERT INTO schedules (
         class_id, trainer_id, starts_at, ends_at, room, capacity, status, created_by
       )
       SELECT $1, $2, $3, $4, $5, 20, 'scheduled', $6
       WHERE NOT EXISTS (
         SELECT 1 FROM schedules WHERE class_id = $1 AND starts_at = $3
       )`,
      [
        classes[i].id,
        trainers[i % trainers.length]?.id || null,
        startsAt.toISOString(),
        startsAt.add(1, 'hour').toISOString(),
        `Studio ${i + 1}`,
        adminId,
      ]
    );
  }

  await query(
    `INSERT INTO content_posts (
       title, slug, excerpt, body, status, tags, published_at, author_id
     ) VALUES (
       'Welcome to Hope Gym',
       'welcome-to-hope-gym',
       'Get started with your fitness journey.',
       'Welcome to Hope Gym. Track memberships, classes, and progress in one place.',
       'published',
       ARRAY['news','welcome'],
       CURRENT_TIMESTAMP,
       $1
     )
     ON CONFLICT (slug) DO NOTHING`,
    [adminId]
  );

  await query(
    `INSERT INTO announcements (
       title, body, priority, is_pinned, starts_at, audience, created_by
     )
     SELECT
       'Holiday Hours',
       'The gym will close at 6pm on Friday for maintenance.',
       'high',
       true,
       CURRENT_TIMESTAMP,
       'all',
       $1
     WHERE NOT EXISTS (
       SELECT 1 FROM announcements WHERE title = 'Holiday Hours'
     )`,
    [adminId]
  );

  await query(
    `INSERT INTO notifications (user_id, title, body, type)
     SELECT $1, 'Welcome Admin', 'Your Hope Gym admin account is ready.', 'info'
     WHERE NOT EXISTS (
       SELECT 1 FROM notifications WHERE user_id = $1 AND title = 'Welcome Admin'
     )`,
    [adminId]
  );

  console.log('Seed completed.');
  console.log(
    `Admin Google sign-in allowlisted for: ${env.seed.adminEmail}`
  );
  console.log(
    'Use POST /api/auth/google/admin with a Google idToken from that account.'
  );
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
