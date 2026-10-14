import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';

const emptyDetails = {
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyDetails);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyMemberToForm = (member) => {
    setForm({
      firstName: member?.first_name || '',
      lastName: member?.last_name || '',
      phone: member?.phone || '',
      dateOfBirth: member?.date_of_birth
        ? String(member.date_of_birth).slice(0, 10)
        : '',
      gender: member?.gender || '',
      address: member?.address || '',
      emergencyContactName: member?.emergency_contact_name || '',
      emergencyContactPhone: member?.emergency_contact_phone || '',
    });
  };

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
        applyMemberToForm(me.data?.member);
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
    [form.firstName || member?.first_name, form.lastName || member?.last_name]
      .filter(Boolean)
      .join(' ') ||
    user?.fullName ||
    user?.full_name ||
    'Member';

  const detailsIncomplete =
    !form.phone ||
    !form.dateOfBirth ||
    !form.gender ||
    !form.address ||
    !form.emergencyContactName ||
    !form.emergencyContactPhone;

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const result = await api.put('/member/me', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
      });
      setProfile(result.data);
      applyMemberToForm(result.data?.member);
      setMessage('Details saved. Admin can see your updated profile.');
    } catch (err) {
      setError(err.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
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
      {message ? <p className="form-ok">{message}</p> : null}

      {profile ? (
        <>
          <section className="profile-card">
            <img
              src={
                member?.photo_url ||
                user?.avatarUrl ||
                user?.avatar_url ||
                '/hope.png'
              }
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

          {detailsIncomplete ? (
            <p className="form-error">
              Complete your details below so the gym can contact you and keep
              your membership records accurate.
            </p>
          ) : null}

          <form className="panel" onSubmit={saveDetails}>
            <h3>Your details</h3>
            <label className="field">
              <span>First name</span>
              <input
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Last name</span>
              <input
                required
                value={form.lastName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Date of birth</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Gender</span>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="field">
              <span>Address</span>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Emergency contact name</span>
              <input
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContactName: e.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Emergency contact phone</span>
              <input
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContactPhone: e.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary wide"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save details'}
            </button>
          </form>

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

      <section className="theme-row">
        <div className="theme-row__copy">
          <h3>Appearance</h3>
          <p className="muted tiny">
            {theme === 'dark'
              ? 'Dark theme (design reference)'
              : 'Light theme (default)'}
          </p>
        </div>
        <ThemeToggle />
      </section>

      <button type="button" className="btn btn-ghost wide" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
