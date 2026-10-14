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

  const adminIds = [];
  for (const [index, email] of env.seed.adminEmails.entries()) {
    const adminResult = await query(
      `INSERT INTO users (email, full_name, role, phone, is_active)
       VALUES ($1, $2, 'admin', '+10000000000', true)
       ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             role = 'admin',
             is_active = true,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        email,
        env.seed.adminEmails.length === 1
          ? env.seed.adminName
          : `${env.seed.adminName} ${index + 1}`,
      ]
    );
    adminIds.push(adminResult.rows[0].id);
  }

  const adminId = adminIds[0];

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
    [
      'Monthly Plan',
      'monthly',
      30,
      49.99,
      1,
      ['Gym floor access', 'Locker room', '2 guest passes / month'],
    ],
    [
      'Quarterly Plan',
      'quarterly',
      90,
      129.99,
      2,
      ['Everything in Monthly', '1 free PT intro', 'Class priority booking'],
    ],
    [
      'Semi-Annual Plan',
      'semi_annual',
      180,
      239.99,
      3,
      ['Everything in Quarterly', 'Towel service', 'Nutrition tips feed'],
    ],
    [
      'Annual Plan',
      'annual',
      365,
      449.99,
      4,
      ['Everything in Semi-Annual', '4 PT sessions', 'Freeze up to 30 days'],
    ],
    [
      'Student Flex',
      'custom',
      60,
      79.99,
      5,
      ['Off-peak hours', 'Gym floor access', 'Locker room'],
    ],
  ];

  for (const [name, period, days, price, sort, features] of plans) {
    await query(
      `INSERT INTO membership_plans (
         name, description, billing_period, duration_days, price, features, sort_order, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true)
       ON CONFLICT (name) DO UPDATE
         SET description = EXCLUDED.description,
             billing_period = EXCLUDED.billing_period,
             duration_days = EXCLUDED.duration_days,
             price = EXCLUDED.price,
             features = EXCLUDED.features,
             sort_order = EXCLUDED.sort_order,
             is_active = true,
             updated_at = CURRENT_TIMESTAMP`,
      [
        name,
        `${name} — Hope Fitness membership`,
        period,
        days,
        price,
        JSON.stringify(features),
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

  const trainerDefs = [
    [
      'Maya',
      'Brooks',
      'maya.brooks@hopegym.local',
      '+15551110001',
      ['HIIT', 'Strength'],
      'Head strength coach. 8 years coaching athletes and busy professionals.',
      200,
    ],
    [
      'Leo',
      'Nguyen',
      'leo.nguyen@hopegym.local',
      '+15551110002',
      ['Yoga', 'Mobility'],
      'Yoga & mobility specialist focused on recovery and flexibility.',
      120,
    ],
    [
      'Sofia',
      'Martinez',
      'sofia.martinez@hopegym.local',
      '+15551110003',
      ['Spin', 'Cardio'],
      'Indoor cycling coach who keeps every ride high-energy.',
      90,
    ],
    [
      'Jordan',
      'Okello',
      'jordan.okello@hopegym.local',
      '+15551110004',
      ['Boxing', 'Conditioning'],
      'Boxing fundamentals and conditioning for all levels.',
      150,
    ],
    [
      'Priya',
      'Shah',
      'priya.shah@hopegym.local',
      '+15551110005',
      ['Pilates', 'Core'],
      'Pilates instructor helping members build strong, stable cores.',
      60,
    ],
    [
      'Chris',
      'Anders',
      'chris.anders@hopegym.local',
      '+15551110006',
      ['CrossFit', 'Olympic Lifting'],
      'Functional fitness and Olympic lifting technique coach.',
      180,
    ],
  ];

  const trainers = [];
  for (const [first, last, email, phone, specialties, bio, hiredDaysAgo] of trainerDefs) {
    const result = await query(
      `INSERT INTO trainers (
         first_name, last_name, email, phone, specialties, bio, status, hire_date
       ) VALUES ($1,$2,$3,$4,$5::text[],$6,'active', CURRENT_DATE - $7::int)
       ON CONFLICT (email) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             phone = EXCLUDED.phone,
             specialties = EXCLUDED.specialties,
             bio = EXCLUDED.bio,
             status = 'active',
             updated_at = CURRENT_TIMESTAMP
       RETURNING id, email, first_name, last_name`,
      [first, last, email, phone, specialties, bio, hiredDaysAgo]
    );
    trainers.push(result.rows[0]);
  }

  const classDefs = [
    [
      'Morning HIIT',
      'High-intensity intervals to start your day strong.',
      'HIIT',
      45,
      20,
      'advanced',
      0,
    ],
    [
      'Yoga Flow',
      'All-levels vinyasa flow for mobility and calm.',
      'Yoga',
      60,
      25,
      'beginner',
      1,
    ],
    [
      'Strength Circuit',
      'Full-body strength stations with coaching cues.',
      'Strength',
      50,
      15,
      'intermediate',
      0,
    ],
    [
      'Spin Surge',
      '45-minute indoor cycling ride with hills and sprints.',
      'Spin',
      45,
      22,
      'intermediate',
      2,
    ],
    [
      'Boxing Basics',
      'Footwork, pads, and conditioning for beginners.',
      'Boxing',
      55,
      16,
      'beginner',
      3,
    ],
    [
      'Pilates Core',
      'Mat pilates focused on posture and deep core strength.',
      'Pilates',
      50,
      18,
      'beginner',
      4,
    ],
    [
      'Olympic Lift Lab',
      'Technique session for snatch and clean & jerk.',
      'Strength',
      60,
      12,
      'advanced',
      5,
    ],
    [
      'Mobility Reset',
      'Joint mobility and soft-tissue recovery class.',
      'Mobility',
      40,
      20,
      'beginner',
      1,
    ],
  ];

  const classes = [];
  for (const [
    name,
    description,
    category,
    duration,
    capacity,
    difficulty,
    trainerIndex,
  ] of classDefs) {
    const trainerId = trainers[trainerIndex % trainers.length]?.id || null;
    const existing = await query('SELECT id, name, duration_minutes, capacity FROM classes WHERE name = $1', [
      name,
    ]);
    if (existing.rows[0]) {
      await query(
        `UPDATE classes
         SET description = $2,
             category = $3,
             duration_minutes = $4,
             capacity = $5,
             difficulty = $6,
             default_trainer_id = $7,
             status = 'active',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          existing.rows[0].id,
          description,
          category,
          duration,
          capacity,
          difficulty,
          trainerId,
        ]
      );
      classes.push({ ...existing.rows[0], duration_minutes: duration, capacity });
      continue;
    }

    const created = await query(
      `INSERT INTO classes (
         name, description, category, duration_minutes, capacity, difficulty, status, default_trainer_id
       ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
       RETURNING id, name, duration_minutes, capacity`,
      [name, description, category, duration, capacity, difficulty, trainerId]
    );
    classes.push(created.rows[0]);
  }

  const rooms = ['Studio A', 'Studio B', 'Bike Room', 'Boxing Bay', 'Main Floor'];
  const scheduleIds = [];
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    for (let slot = 0; slot < classes.length; slot += 1) {
      if ((dayOffset + slot) % 3 === 0) continue; // keep calendar busy but not every slot
      const gymClass = classes[slot];
      const trainer = trainers[slot % trainers.length];
      const hour = 7 + ((slot * 2) % 12);
      const startsAt = dayjs()
        .add(dayOffset, 'day')
        .hour(hour)
        .minute(0)
        .second(0)
        .millisecond(0);
      const endsAt = startsAt.add(gymClass.duration_minutes || 45, 'minute');
      const room = rooms[slot % rooms.length];

      const inserted = await query(
        `INSERT INTO schedules (
           class_id, trainer_id, starts_at, ends_at, room, capacity, status, created_by
         )
         SELECT $1, $2, $3, $4, $5, $6, 'scheduled', $7
         WHERE NOT EXISTS (
           SELECT 1 FROM schedules WHERE class_id = $1 AND starts_at = $3
         )
         RETURNING id`,
        [
          gymClass.id,
          trainer?.id || null,
          startsAt.toISOString(),
          endsAt.toISOString(),
          room,
          gymClass.capacity || 20,
          adminId,
        ]
      );
      if (inserted.rows[0]) {
        scheduleIds.push(inserted.rows[0].id);
      }
    }
  }

  // Ensure we have schedule ids even on re-seed (existing rows)
  if (!scheduleIds.length) {
    const upcoming = await query(
      `SELECT id FROM schedules
       WHERE status = 'scheduled' AND starts_at >= CURRENT_TIMESTAMP
       ORDER BY starts_at ASC
       LIMIT 40`
    );
    scheduleIds.push(...upcoming.rows.map((r) => r.id));
  }

  for (let i = 0; i < scheduleIds.length; i += 1) {
    const memberId = memberIds[i % memberIds.length];
    if (!memberId) break;
    await query(
      `INSERT INTO class_bookings (schedule_id, member_id, status)
       VALUES ($1, $2, 'booked')
       ON CONFLICT (schedule_id, member_id) DO UPDATE
         SET status = 'booked', updated_at = CURRENT_TIMESTAMP`,
      [scheduleIds[i], memberId]
    );
  }

  const contentPosts = [
    [
      'Welcome to Hope Gym',
      'welcome-to-hope-gym',
      'Get started with your fitness journey.',
      'Welcome to Hope Fitness Center. Use the member app to book classes, check in, track payments, and keep your profile up to date. Our coaches are here to help you build consistency.',
      ['news', 'welcome'],
    ],
    [
      '5 Warm-Up Mistakes to Avoid',
      'warm-up-mistakes',
      'Skip these habits before your next lift.',
      'Rushing into heavy sets without priming joints and muscles raises injury risk. Spend 5–8 minutes on light cardio, then mobility for the joints you will load. Finish with light rehearsal sets of the first exercise.',
      ['training', 'tips'],
    ],
    [
      'Protein Basics for Busy Members',
      'protein-basics',
      'Simple targets without complicated meal plans.',
      'Aim for a palm-sized protein source at each meal. Greek yogurt, eggs, lentils, chicken, and tofu all work. Consistency beats perfection — hit your protein most days and training progress follows.',
      ['nutrition', 'tips'],
    ],
    [
      'How to Book Classes in the App',
      'how-to-book-classes',
      'A quick walkthrough of the Classes tab.',
      'Open Classes, filter by category if you want, then tap Book on an open session. Booked sessions show on Home under Upcoming. Arrive a few minutes early and check in from the Check-in tab.',
      ['app', 'guide'],
    ],
    [
      'Recovery Sunday Ideas',
      'recovery-sunday',
      'Low-stress ways to feel better for Monday.',
      'Try a Mobility Reset class, a long walk, or gentle yoga. Hydrate, get sunlight, and keep bedtime consistent. Recovery is training — it is what lets you push again next week.',
      ['recovery', 'lifestyle'],
    ],
    [
      'Meet Coach Sofia',
      'meet-coach-sofia',
      'Spin Surge leader and cardio specialist.',
      'Sofia Martinez joins Hope Fitness leading Spin Surge. Expect climb sets, sprint finishers, and playlists that keep the room moving. Beginners are welcome — bikes adjust to every fitness level.',
      ['trainers', 'news'],
    ],
    [
      'Locker Room Etiquette',
      'locker-room-etiquette',
      'Keep shared spaces respectful for everyone.',
      'Wipe equipment, limit peak-hour locker occupancy, and store bags in lockers. Lost & found clears every Sunday evening. Ask front desk if you need a day locker.',
      ['facility', 'rules'],
    ],
    [
      'Member Spotlight: Consistency Wins',
      'member-spotlight-consistency',
      'Why showing up beats perfect programs.',
      'Members who check in 3+ times a week see the biggest changes — not because of one perfect session, but because habits compound. Use the app streak of visits this month as your scoreboard.',
      ['community', 'motivation'],
    ],
  ];

  for (const [title, slug, excerpt, body, tags] of contentPosts) {
    await query(
      `INSERT INTO content_posts (
         title, slug, excerpt, body, status, tags, published_at, author_id
       ) VALUES ($1,$2,$3,$4,'published',$5::text[], CURRENT_TIMESTAMP - ($6 || ' hours')::interval, $7)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title,
             excerpt = EXCLUDED.excerpt,
             body = EXCLUDED.body,
             tags = EXCLUDED.tags,
             status = 'published',
             published_at = COALESCE(content_posts.published_at, EXCLUDED.published_at),
             updated_at = CURRENT_TIMESTAMP`,
      [title, slug, excerpt, body, tags, String(Math.floor(Math.random() * 72)), adminId]
    );
  }

  const announcements = [
    [
      'Holiday Hours',
      'The gym closes at 6pm this Friday for scheduled maintenance. Weekend hours are unchanged.',
      'high',
      true,
    ],
    [
      'New Spin Bikes Installed',
      'Studio Bike Room has upgraded bikes with clearer resistance dials. Try Spin Surge this week.',
      'normal',
      false,
    ],
    [
      'Bring a Friend Week',
      'Active members get one free guest pass this week. Guests must sign the waiver at reception.',
      'normal',
      true,
    ],
    [
      'PT Intro Sessions Open',
      'Quarterly and Annual members can book a complimentary PT intro with Maya or Chris at the front desk.',
      'normal',
      false,
    ],
    [
      'Parking Reminder',
      'Please use the south lot after 5pm. Street parking near the entrance is reserved for accessibility.',
      'low',
      false,
    ],
    [
      'App Check-in Preferred',
      'Wherever possible, check in from the member app when you arrive. Front desk scanners remain available.',
      'normal',
      false,
    ],
  ];

  for (const [title, body, priority, pinned] of announcements) {
    await query(
      `INSERT INTO announcements (
         title, body, priority, is_pinned, starts_at, audience, created_by
       )
       SELECT $1::text, $2::text, $3::announcement_priority, $4, CURRENT_TIMESTAMP, 'all', $5
       WHERE NOT EXISTS (
         SELECT 1 FROM announcements WHERE title = $1::text
       )`,
      [title, body, priority, pinned, adminId]
    );
  }

  await query(
    `INSERT INTO notifications (user_id, title, body, type)
     SELECT $1, 'Welcome Admin', 'Your Hope Gym admin account is ready.', 'info'
     WHERE NOT EXISTS (
       SELECT 1 FROM notifications WHERE user_id = $1 AND title = 'Welcome Admin'
     )`,
    [adminId]
  );

  const counts = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM trainers) AS trainers,
       (SELECT COUNT(*)::int FROM classes) AS classes,
       (SELECT COUNT(*)::int FROM schedules WHERE starts_at >= CURRENT_TIMESTAMP) AS upcoming_sessions,
       (SELECT COUNT(*)::int FROM class_bookings) AS bookings,
       (SELECT COUNT(*)::int FROM content_posts WHERE status = 'published') AS posts,
       (SELECT COUNT(*)::int FROM announcements) AS announcements`
  );

  console.log('Seed completed.');
  console.log('Seeded counts:', counts.rows[0]);
  console.log(
    `Admin Google sign-in allowlisted for: ${env.seed.adminEmails.join(', ')}`
  );
  console.log(
    'Only those emails can use POST /api/auth/google/admin. Any other Gmail is rejected.'
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
