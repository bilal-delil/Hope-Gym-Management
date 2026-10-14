export function formatMoney(amount, currency = 'USD') {
  const value = Number(amount);
  if (Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusClass(status) {
  const key = String(status || '').toLowerCase();
  if (['approved', 'active', 'attended', 'paid'].includes(key)) return 'ok';
  if (['pending', 'booked', 'scheduled'].includes(key)) return 'warn';
  if (['declined', 'cancelled', 'expired', 'inactive'].includes(key)) {
    return 'bad';
  }
  return 'neutral';
}
