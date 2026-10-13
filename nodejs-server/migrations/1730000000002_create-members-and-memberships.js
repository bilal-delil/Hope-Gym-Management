/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createType('member_status', ['active', 'inactive', 'suspended']);
  pgm.createType('membership_status', [
    'active',
    'expired',
    'cancelled',
    'pending',
  ]);
  pgm.createType('billing_period', [
    'monthly',
    'quarterly',
    'semi_annual',
    'annual',
    'custom',
  ]);

  pgm.createTable('members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      unique: true,
      references: 'users',
      onDelete: 'SET NULL',
    },
    member_code: { type: 'varchar(50)', notNull: true, unique: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', unique: true },
    phone: { type: 'varchar(50)' },
    date_of_birth: { type: 'date' },
    gender: { type: 'varchar(20)' },
    address: { type: 'text' },
    emergency_contact_name: { type: 'varchar(150)' },
    emergency_contact_phone: { type: 'varchar(50)' },
    photo_url: { type: 'text' },
    status: { type: 'member_status', notNull: true, default: 'active' },
    notes: { type: 'text' },
    joined_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
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

  pgm.createIndex('members', 'status');
  pgm.createIndex('members', 'user_id');
  pgm.createIndex('members', ['last_name', 'first_name']);

  pgm.createTable('membership_plans', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { type: 'varchar(150)', notNull: true, unique: true },
    description: { type: 'text' },
    billing_period: { type: 'billing_period', notNull: true },
    duration_days: { type: 'integer', notNull: true },
    price: { type: 'numeric(12, 2)', notNull: true },
    currency: { type: 'varchar(3)', notNull: true, default: 'USD' },
    features: { type: 'jsonb', notNull: true, default: '[]' },
    is_active: { type: 'boolean', notNull: true, default: true },
    sort_order: { type: 'integer', notNull: true, default: 0 },
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

  pgm.createTable('memberships', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    member_id: {
      type: 'uuid',
      notNull: true,
      references: 'members',
      onDelete: 'CASCADE',
    },
    plan_id: {
      type: 'uuid',
      notNull: true,
      references: 'membership_plans',
      onDelete: 'RESTRICT',
    },
    status: { type: 'membership_status', notNull: true, default: 'pending' },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    price_paid: { type: 'numeric(12, 2)' },
    auto_renew: { type: 'boolean', notNull: true, default: false },
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

  pgm.createIndex('memberships', 'member_id');
  pgm.createIndex('memberships', 'plan_id');
  pgm.createIndex('memberships', 'status');
  pgm.createIndex('memberships', 'end_date');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('memberships');
  pgm.dropTable('membership_plans');
  pgm.dropTable('members');
  pgm.dropType('billing_period');
  pgm.dropType('membership_status');
  pgm.dropType('member_status');
};
