function getPagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function paginatedResponse({ rows, total, page, limit }) {
  return {
    data: rows,
    meta: {
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit) || 0,
    },
  };
}

module.exports = {
  getPagination,
  paginatedResponse,
};
