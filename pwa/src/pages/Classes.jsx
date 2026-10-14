import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatDateTime } from '../lib/format';

export default function Classes() {
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');

  const load = async () => {
    setError('');
    try {
      const [schedules, mine] = await Promise.all([
        api.get('/member/schedules?limit=50'),
        api.get('/member/bookings'),
      ]);
      setItems(schedules.data || []);
      setBookings(mine.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(
      items.map((item) => item.category).filter(Boolean)
    );
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'booked') return items.filter((item) => item.booked);
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const book = async (id) => {
    setBusyId(id);
    setMessage('');
    try {
      await api.post(`/member/schedules/${id}/book`);
      setMessage('Class booked');
      await load();
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Classes"
        subtitle="Book upcoming sessions"
      />

      <div className="chips">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip-btn${filter === cat ? ' is-active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
        <button
          type="button"
          className={`chip-btn${filter === 'booked' ? ' is-active' : ''}`}
          onClick={() => setFilter('booked')}
        >
          My bookings
        </button>
      </div>

      {message ? <p className="form-ok">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="screen-center compact">
          <div className="spinner" />
        </div>
      ) : (
        <div className="stack">
          {filtered.length === 0 ? (
            <p className="muted empty">No classes match this filter.</p>
          ) : (
            filtered.map((item) => {
              const trainer = [item.trainer_first_name, item.trainer_last_name]
                .filter(Boolean)
                .join(' ');
              const spots =
                item.effective_capacity != null
                  ? `${item.booked_count || 0}/${item.effective_capacity}`
                  : null;

              return (
                <article key={item.id} className="class-card">
                  <div className="class-card__top">
                    <div>
                      <h3>{item.class_name}</h3>
                      <p className="muted">{formatDateTime(item.starts_at)}</p>
                    </div>
                    {item.category ? (
                      <span className="chip chip-soft">{item.category}</span>
                    ) : null}
                  </div>
                  <div className="meta-row">
                    {item.duration_minutes ? (
                      <span>{item.duration_minutes} min</span>
                    ) : null}
                    {item.difficulty ? <span>{item.difficulty}</span> : null}
                    {item.room ? <span>{item.room}</span> : null}
                    {trainer ? <span>{trainer}</span> : null}
                    {spots ? <span>{spots} booked</span> : null}
                  </div>
                  <div className="card-actions">
                    {item.booked ? (
                      <span className="chip chip-ok">Booked</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => book(item.id)}
                      >
                        {busyId === item.id ? 'Booking…' : 'Book'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {bookings.length > 0 && filter !== 'booked' ? (
        <section className="section">
          <div className="section-head">
            <h3>Recent bookings</h3>
          </div>
          <div className="stack">
            {bookings.slice(0, 5).map((b) => (
              <article key={b.id} className="list-card">
                <div className="list-card__body">
                  <h4>{b.class_name}</h4>
                  <p className="muted">{formatDateTime(b.starts_at)}</p>
                </div>
                <span className="chip chip-soft">{b.status}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
