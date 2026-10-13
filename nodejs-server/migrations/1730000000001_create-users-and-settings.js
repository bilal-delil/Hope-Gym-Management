/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createType('user_role', ['admin', 'staff']);

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    full_name: { type: 'varchar(150)', notNull: true },
    role: { type: 'user_role', notNull: true, default: 'staff' },
    phone: { type: 'varchar(50)' },
    avatar_url: { type: 'text' },
    is_active: { type: 'boolean', notNull: true, default: true },
    last_login_at: { type: 'timestamptz' },
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

  pgm.createTable('settings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    key: { type: 'varchar(100)', notNull: true, unique: true },
    value: { type: 'jsonb', notNull: true, default: '{}' },
    description: { type: 'text' },
    updated_by: {
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

  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    title: { type: 'varchar(200)', notNull: true },
    body: { type: 'text' },
    type: { type: 'varchar(50)', notNull: true, default: 'info' },
    is_read: { type: 'boolean', notNull: true, default: false },
    meta: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', ['user_id', 'is_read']);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('notifications');
  pgm.dropTable('settings');
  pgm.dropTable('users');
  pgm.dropType('user_role');
};
