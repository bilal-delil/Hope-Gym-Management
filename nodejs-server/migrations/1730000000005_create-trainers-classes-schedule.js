/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createType('trainer_status', ['active', 'inactive', 'on_leave']);
  pgm.createType('class_status', ['active', 'inactive']);
  pgm.createType('schedule_status', [
    'scheduled',
    'cancelled',
    'completed',
  ]);
  pgm.createType('booking_status', [
    'booked',
    'attended',
    'cancelled',
    'no_show',
  ]);

  pgm.createTable('trainers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', unique: true },
    phone: { type: 'varchar(50)' },
    specialties: { type: 'text[]', notNull: true, default: '{}' },
    bio: { type: 'text' },
    photo_url: { type: 'text' },
    status: { type: 'trainer_status', notNull: true, default: 'active' },
    hire_date: { type: 'date' },
    user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('trainers', 'status');

  pgm.createTable('classes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { type: 'varchar(150)', notNull: true },
    description: { type: 'text' },
    category: { type: 'varchar(100)' },
    duration_minutes: { type: 'integer', notNull: true, default: 60 },
    capacity: { type: 'integer', notNull: true, default: 20 },
    difficulty: { type: 'varchar(50)' },
    status: { type: 'class_status', notNull: true, default: 'active' },
    default_trainer_id: {
      type: 'uuid',
      references: 'trainers',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('classes', 'status');
  pgm.createIndex('classes', 'category');

  pgm.createTable('schedules', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    class_id: {
      type: 'uuid',
      notNull: true,
      references: 'classes',
      onDelete: 'CASCADE',
    },
    trainer_id: {
      type: 'uuid',
      references: 'trainers',
      onDelete: 'SET NULL',
    },
    starts_at: { type: 'timestamptz', notNull: true },
    ends_at: { type: 'timestamptz', notNull: true },
    room: { type: 'varchar(100)' },
    capacity: { type: 'integer' },
    status: { type: 'schedule_status', notNull: true, default: 'scheduled' },
    notes: { type: 'text' },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('schedules', 'class_id');
  pgm.createIndex('schedules', 'trainer_id');
  pgm.createIndex('schedules', 'starts_at');
  pgm.createIndex('schedules', 'status');

  pgm.createTable('class_bookings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    schedule_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedules',
      onDelete: 'CASCADE',
    },
    member_id: {
      type: 'uuid',
      notNull: true,
      references: 'members',
      onDelete: 'CASCADE',
    },
    status: { type: 'booking_status', notNull: true, default: 'booked' },
    booked_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('class_bookings', 'schedule_id');
  pgm.createIndex('class_bookings', 'member_id');
  pgm.addConstraint('class_bookings', 'class_bookings_schedule_member_unique', {
    unique: ['schedule_id', 'member_id'],
  });
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('class_bookings');
  pgm.dropTable('schedules');
  pgm.dropTable('classes');
  pgm.dropTable('trainers');
  pgm.dropType('booking_status');
  pgm.dropType('schedule_status');
  pgm.dropType('class_status');
  pgm.dropType('trainer_status');
};
