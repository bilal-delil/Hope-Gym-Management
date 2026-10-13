const { body } = require('express-validator');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const createValidators = [
  body('title').isString().isLength({ min: 2, max: 255 }),
  body('body').isString().isLength({ min: 1 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
];

const updateValidators = [
  body('title').optional().isString().isLength({ min: 2, max: 255 }),
  body('body').optional().isString().isLength({ min: 1 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
];

async function uniqueSlug(base, excludeId = null) {
  let slug = slugify(base) || 'post';
  let candidate = slug;
  let i = 1;

  while (true) {
    const result = excludeId
      ? await query(
          'SELECT id FROM content_posts WHERE slug = $1 AND id <> $2',
          [candidate, excludeId]
        )
      : await query('SELECT id FROM content_posts WHERE slug = $1', [
          candidate,
        ]);

    if (!result.rows[0]) {
      return candidate;
    }

    i += 1;
    candidate = `${slug}-${i}`;
  }
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const where = [];

  if (req.query.status) {
    values.push(req.query.status);
    where.push(`cp.status = $${values.length}`);
  }
  if (req.query.search) {
    values.push(`%${req.query.search}%`);
    where.push(
      `(cp.title ILIKE $${values.length} OR cp.excerpt ILIKE $${values.length} OR cp.body ILIKE $${values.length})`
    );
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM content_posts cp ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await query(
    `SELECT cp.*, u.full_name AS author_name
     FROM content_posts cp
     LEFT JOIN users u ON u.id = cp.author_id
     ${whereClause}
     ORDER BY COALESCE(cp.published_at, cp.created_at) DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
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

const getById = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT cp.*, u.full_name AS author_name
     FROM content_posts cp
     LEFT JOIN users u ON u.id = cp.author_id
     WHERE cp.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Content post not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  const { title, excerpt, body, coverImageUrl, status, tags, publishedAt } =
    req.body;
  const slug = await uniqueSlug(req.body.slug || title);
  const finalStatus = status || 'draft';

  const result = await query(
    `INSERT INTO content_posts (
      title, slug, excerpt, body, cover_image_url, status, tags,
      published_at, author_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      title,
      slug,
      excerpt || null,
      body,
      coverImageUrl || null,
      finalStatus,
      tags || [],
      finalStatus === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt || null,
      req.user.id,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM content_posts WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing.rows[0]) {
    throw new ApiError(404, 'Content post not found');
  }

  let slug;
  if (req.body.slug || req.body.title) {
    slug = await uniqueSlug(
      req.body.slug || req.body.title,
      req.params.id
    );
  }

  const fields = {
    title: req.body.title,
    slug,
    excerpt: req.body.excerpt,
    body: req.body.body,
    cover_image_url: req.body.coverImageUrl,
    status: req.body.status,
    tags: req.body.tags,
    published_at: req.body.publishedAt,
  };

  if (req.body.status === 'published' && !existing.rows[0].published_at) {
    fields.published_at = req.body.publishedAt || new Date().toISOString();
  }

  const sets = [];
  const values = [];

  Object.entries(fields).forEach(([column, value]) => {
    if (value !== undefined) {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
  });

  if (!sets.length) {
    throw new ApiError(400, 'No fields provided to update');
  }

  values.push(req.params.id);
  const result = await query(
    `UPDATE content_posts
     SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM content_posts WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Content post not found');
  }

  res.json({ success: true, message: 'Content post deleted' });
});

module.exports = {
  createValidators,
  updateValidators,
  list,
  getById,
  create,
  update,
  remove,
};
