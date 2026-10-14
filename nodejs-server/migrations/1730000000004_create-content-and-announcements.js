/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createType('content_status', ['draft', 'published', 'archived']);
  pgm.createType('announcement_priority', ['low', 'normal', 'high', 'urgent']);

  pgm.createTable('content_posts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: { type: 'varchar(255)', notNull: true },
    slug: { type: 'varchar(255)', notNull: true, unique: true },
    excerpt: { type: 'text' },
    body: { type: 'text', notNull: true },
    cover_image_url: { type: 'text' },
    status: { type: 'content_status', notNull: true, default: 'draft' },
    tags: { type: 'text[]', notNull: true, default: '{}' },
    published_at: { type: 'timestamptz' },
    author_id: {
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

  pgm.createIndex('content_posts', 'status');
  pgm.createIndex('content_posts', 'published_at');

  pgm.createTable('announcements', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: { type: 'varchar(255)', notNull: true },
    body: { type: 'text', notNull: true },
    priority: {
      type: 'announcement_priority',
      notNull: true,
      default: 'normal',
    },
    is_pinned: { type: 'boolean', notNull: true, default: false },
    starts_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    ends_at: { type: 'timestamptz' },
    audience: { type: 'varchar(50)', notNull: true, default: 'all' },
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

  pgm.createIndex('announcements', 'starts_at');
  pgm.createIndex('announcements', 'is_pinned');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('announcements');
  pgm.dropTable('content_posts');
  pgm.dropType('announcement_priority');
  pgm.dropType('content_status');
};
