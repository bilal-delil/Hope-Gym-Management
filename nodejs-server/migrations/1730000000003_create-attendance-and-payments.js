/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createType('payment_status', [
    'pending',
    'completed',
    'declined',
    'failed',
    'refunded',
    'cancelled',
  ]);
  pgm.createType('payment_method', [
    'cash',
    'card',
    'bank_transfer',
    'mobile_money',
    'other',
  ]);

  pgm.createTable('attendance', {
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
    checked_in_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    checked_out_at: { type: 'timestamptz' },
    source: { type: 'varchar(50)', notNull: true, default: 'manual' },
    notes: { type: 'text' },
    recorded_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('attendance', 'member_id');
  pgm.createIndex('attendance', 'checked_in_at');

  pgm.createTable('payments', {
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
    membership_id: {
      type: 'uuid',
      references: 'memberships',
      onDelete: 'SET NULL',
    },
    amount: { type: 'numeric(12, 2)', notNull: true },
    currency: { type: 'varchar(3)', notNull: true, default: 'USD' },
    status: { type: 'payment_status', notNull: true, default: 'pending' },
    method: { type: 'payment_method', notNull: true, default: 'bank_transfer' },
    reference: { type: 'varchar(100)' },
    description: { type: 'text' },
    proof_image_path: { type: 'text', notNull: true },
    proof_image_url: { type: 'text', notNull: true },
    rejection_reason: { type: 'text' },
    paid_at: { type: 'timestamptz' },
    submitted_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    reviewed_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    reviewed_at: { type: 'timestamptz' },
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

  pgm.createIndex('payments', 'member_id');
  pgm.createIndex('payments', 'membership_id');
  pgm.createIndex('payments', 'status');
  pgm.createIndex('payments', 'created_at');
  pgm.createIndex('payments', 'paid_at');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('payments');
  pgm.dropTable('attendance');
  pgm.dropType('payment_method');
  pgm.dropType('payment_status');
};
