/**
 * PostgreSQL 13+ provides gen_random_uuid() in core.
 * Keep this migration as a no-op for ordering / compatibility.
 */

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql('SELECT 1');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql('SELECT 1');
};
