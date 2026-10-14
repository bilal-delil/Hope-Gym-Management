import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, news] = await Promise.all([
          api.get('/member/me'),
          api.get('/member/announcements'),
        ]);
        if (!alive) return;
        setProfile(me.data);
        setAnnouncements(news.data || []);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const member = profile?.member;
  const membership = profile?.membership;
  const displayName =
    [member?.first_name, member?.last_name].filter(Boolean).join(' ') ||
    user?.fullName ||
    user?.full_name ||
    'Member';

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page">
      <PageHeader title="Profile" subtitle="Your Hope Gym account" />

      {loading ? (
        <div className="screen-center compact">
          <div className="spinner" />
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {profile ? (
        <>
          <section className="profile-card">
            <img
              src={member?.photo_url || user?.avatarUrl || user?.avatar_url || '/hope.png'}
              alt=""
              className="avatar"
            />
            <div>
              <h2>{displayName}</h2>
              <p className="muted">{member?.email || user?.email}</p>
              <p className="muted tiny">
                {member?.member_code ? `ID ${member.member_code}` : null}
                {member?.status ? ` · ${member.status}` : null}
              </p>
            </div>
          </section>

          <section className="panel">
            <h3>Membership</h3>
            {membership ? (
              <ul className="kv">
                <li>
                  <span>Plan</span>
                  <strong>{membership.plan_name}</strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>{membership.status}</strong>
                </li>
                <li>
                  <span>Price</span>
                  <strong>{formatMoney(membership.price)}</strong>
                </li>
                <li>
                  <span>Starts</span>
                  <strong>{formatDate(membership.start_date)}</strong>
                </li>
                <li>
                  <span>Ends</span>
                  <strong>{formatDate(membership.end_date)}</strong>
                </li>
              </ul>
            ) : (
              <p className="muted">
                No membership yet. Submit a payment from the Payments tab.
              </p>
            )}
          </section>

          {announcements.length ? (
            <section className="section">
              <div className="section-head">
                <h3>Announcements</h3>
              </div>
              <div className="stack">
                {announcements.slice(0, 5).map((item) => (
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
        </>
      ) : null}

      <button type="button" className="btn btn-ghost wide" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
