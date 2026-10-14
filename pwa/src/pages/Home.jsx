import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconBell } from '../components/icons';
import api from '../lib/api';
import { formatDateTime, formatMoney } from '../lib/format';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await api.get('/member/overview');
        if (alive) setData(result.data);
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
  if (membership?.start_date && membership?.end_date) {
    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const now = Date.now();
    if (end > start) {
      progressPct = Math.min(
        100,
        Math.max(0, Math.round(((now - start) / (end - start)) * 100))
      );
    }
  } else if (membership?.status === 'active') {
    progressPct = 50;
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
        <Link to="/profile" className="icon-btn" aria-label="Notifications">
          <IconBell />
          {data?.pendingPayments > 0 ? (
            <span className="badge">{data.pendingPayments}</span>
          ) : null}
        </Link>
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
              aria-label={`Progress ${progressPct}%`}
            >
              <span>{progressPct}%</span>
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
                {data.upcomingClasses.slice(0, 3).map((item) => (
                  <article key={item.id} className="list-card">
                    <div className="list-card__icon">C</div>
                    <div className="list-card__body">
                      <h4>{item.class_name}</h4>
                      <p className="muted">
                        {formatDateTime(item.starts_at)}
                        {item.room ? ` · ${item.room}` : ''}
                      </p>
                    </div>
                    <span
                      className={`chip ${item.booked ? 'chip-ok' : 'chip-soft'}`}
                    >
                      {item.booked ? 'Booked' : 'Open'}
                    </span>
                  </article>
                ))}
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
          ) : (
            <section className="banner-card">
              <div>
                <p className="eyebrow">Hope Fitness</p>
                <h3>Stronger. Fitter. Healthier.</h3>
                <p className="muted">Book a class or check in at the front desk.</p>
              </div>
              <Link to="/classes" className="btn btn-primary">
                Browse classes
              </Link>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
