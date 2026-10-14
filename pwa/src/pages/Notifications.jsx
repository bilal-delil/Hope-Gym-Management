import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatDateTime } from '../lib/format';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [notes, news] = await Promise.all([
        api.get('/notifications?limit=50'),
        api.get('/member/announcements'),
      ]);
      setItems(notes.data || []);
      setAnnouncements(news.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!unreadCount) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err.message || 'Failed to mark as read');
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (id) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.is_read) return;
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      setError(err.message || 'Failed to mark as read');
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount
            ? `${unreadCount} unread`
            : 'Updates from Hope Fitness'
        }
        right={
          unreadCount ? (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={markAllRead}
            >
              {busy ? '…' : 'Mark all read'}
            </button>
          ) : null
        }
      />

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="screen-center compact">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <section className="section">
            <div className="section-head">
              <h3>Your updates</h3>
            </div>
            {items.length ? (
              <div className="stack">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`list-card list-card--button${
                      item.is_read ? '' : ' is-unread'
                    }`}
                    onClick={() => markRead(item.id)}
                  >
                    <div className="list-card__body">
                      <h4>{item.title}</h4>
                      {item.body ? (
                        <p className="muted clamp-2">{item.body}</p>
                      ) : null}
                      <p className="muted tiny">
                        {formatDateTime(item.created_at)}
                        {item.type ? ` · ${item.type}` : ''}
                      </p>
                    </div>
                    {!item.is_read ? (
                      <span className="chip chip-soft">New</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted empty">No personal notifications yet.</p>
            )}
          </section>

          {announcements.length ? (
            <section className="section">
              <div className="section-head">
                <h3>Gym announcements</h3>
              </div>
              <div className="stack">
                {announcements.map((item) => (
                  <article key={item.id} className="list-card">
                    <div className="list-card__body">
                      <h4>{item.title}</h4>
                      <p className="muted clamp-2">{item.body}</p>
                      <p className="muted tiny">
                        {formatDateTime(item.starts_at)}
                        {item.is_pinned ? ' · Pinned' : ''}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
