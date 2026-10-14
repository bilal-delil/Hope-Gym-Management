import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { IconBell } from '../components/icons';
import api from '../lib/api';
import { formatDateTime, formatMoney } from '../lib/format';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [result, content] = await Promise.all([
          api.get('/member/overview'),
          api.get('/member/content'),
        ]);
        if (!alive) return;
        setData(result.data);
        setPosts(content.data || []);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load overview');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const firstName =
    data?.member?.first_name ||
    user?.fullName?.split(' ')[0] ||
    user?.full_name?.split(' ')[0] ||
    'Member';

  const membership = data?.membership;
  let progressPct = 0;
  let progressLabel = '0%';
  if (membership?.start_date && membership?.end_date) {
    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const now = Date.now();
    if (end > start) {
      // Elapsed share of the membership period (real dates only).
      progressPct = Math.min(
        100,
        Math.max(0, Math.round(((now - start) / (end - start)) * 100))
      );
      const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      progressLabel = `${daysLeft}d`;
    }
  }

  return (
    <div className="page">
      <div className="top-row">
        <div className="brand-lockup">
          <img src="/logo.png" alt="" className="brand-mark" />
          <div>
            <p className="eyebrow">Hope Fitness</p>
            <h1>Hi, {firstName}</h1>
          </div>
        </div>
        <div className="top-row__actions">
          <ThemeToggle />
          <Link
            to="/notifications"
            className="icon-btn"
            aria-label="Notifications"
          >
            <IconBell />
            {data?.unreadNotifications > 0 ? (
              <span className="badge">{data.unreadNotifications}</span>
            ) : null}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="screen-center compact">
          <div className="spinner" />
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {data ? (
        <>
          <section className="hero-card">
            <div>
              <p className="eyebrow">Membership</p>
              <h2>{membership?.plan_name || 'No active plan'}</h2>
              <p className="muted">
                {membership
                  ? `${membership.status} · until ${formatDateTime(
                      membership.end_date
                    ).split(',')[0]}`
                  : 'Pick a plan and submit payment proof'}
              </p>
            </div>
            <div
              className="ring"
              style={{ '--pct': `${progressPct}` }}
              aria-label={
                membership
                  ? `Membership elapsed ${progressPct}%, ${progressLabel} left`
                  : 'No membership'
              }
            >
              <span>{membership ? progressLabel : '—'}</span>
            </div>
          </section>

          <section className="stat-row">
            <article className="stat-card">
              <span className="stat-label">Check-ins</span>
              <strong>{data.monthlyCheckins}</strong>
              <span className="muted tiny">This month</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Pending</span>
              <strong>{data.pendingPayments}</strong>
              <span className="muted tiny">Payments</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Classes</span>
              <strong>{data.upcomingClasses?.length || 0}</strong>
              <span className="muted tiny">Upcoming</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Plan</span>
              <strong>
                {membership ? formatMoney(membership.price).replace(/\.00$/, '') : '—'}
              </strong>
              <span className="muted tiny">Current</span>
            </article>
          </section>

          <section className="section">
            <div className="section-head">
              <h3>Upcoming classes</h3>
              <Link to="/classes">View all</Link>
            </div>
            {data.upcomingClasses?.length ? (
              <div className="stack">
                {data.upcomingClasses.slice(0, 3).map((item) => {
                  const trainer = [
                    item.trainer_first_name,
                    item.trainer_last_name,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <article key={item.id} className="list-card">
                      <div className="list-card__icon">C</div>
                      <div className="list-card__body">
                        <h4>{item.class_name}</h4>
                        <p className="muted">
                          {formatDateTime(item.starts_at)}
                          {item.room ? ` · ${item.room}` : ''}
                          {trainer ? ` · ${trainer}` : ''}
                        </p>
                      </div>
                      <span
                        className={`chip ${item.booked ? 'chip-ok' : 'chip-soft'}`}
                      >
                        {item.booked ? 'Booked' : 'Open'}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="muted empty">No upcoming classes yet.</p>
            )}
          </section>

          <section className="quick-grid">
            <Link to="/classes" className="quick-tile">
              Classes
            </Link>
            <Link to="/check-in" className="quick-tile">
              Check-in
            </Link>
            <Link to="/payments" className="quick-tile">
              Payments
            </Link>
            <Link to="/profile" className="quick-tile">
              Profile
            </Link>
          </section>

          {data.announcements?.length ? (
            <section className="banner-card">
              <div>
                <p className="eyebrow">Announcement</p>
                <h3>{data.announcements[0].title}</h3>
                <p className="muted clamp-2">{data.announcements[0].body}</p>
              </div>
            </section>
          ) : null}

          {data.announcements?.length > 1 ? (
            <section className="section">
              <div className="section-head">
                <h3>More announcements</h3>
              </div>
              <div className="stack">
                {data.announcements.slice(1, 4).map((item) => (
                  <article key={item.id} className="list-card">
                    <div className="list-card__body">
                      <h4>{item.title}</h4>
                      <p className="muted clamp-2">{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {data.trainers?.length ? (
            <section className="section">
              <div className="section-head">
                <h3>Trainers</h3>
              </div>
              <div className="stack">
                {data.trainers.slice(0, 6).map((t) => {
                  const name = [t.first_name, t.last_name]
                    .filter(Boolean)
                    .join(' ');
                  const specialties = Array.isArray(t.specialties)
                    ? t.specialties.join(' · ')
                    : '';
                  return (
                    <article key={t.id} className="list-card">
                      <div className="list-card__icon">
                        {(t.first_name || 'T').slice(0, 1)}
                      </div>
                      <div className="list-card__body">
                        <h4>{name}</h4>
                        <p className="muted clamp-2">
                          {specialties || t.bio || 'Hope Fitness coach'}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {posts.length ? (
            <section className="section">
              <div className="section-head">
                <h3>Tips & news</h3>
              </div>
              <div className="stack">
                {posts.slice(0, 4).map((post) => (
                  <article key={post.id} className="list-card">
                    <div className="list-card__body">
                      <h4>{post.title}</h4>
                      <p className="muted clamp-2">
                        {post.excerpt || post.body}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
