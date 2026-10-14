import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatDateTime } from '../lib/format';

export default function CheckIn() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const openSession = rows.find((row) => !row.checked_out_at);

  const load = async () => {
    try {
      const result = await api.get('/member/attendance?limit=20');
      setRows(result.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkIn = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api.post('/member/attendance/check-in', {});
      setMessage('Checked in');
      await load();
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  const checkOut = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api.post('/member/attendance/check-out', {});
      setMessage('Checked out');
      await load();
    } catch (err) {
      setError(err.message || 'Check-out failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Check-in"
        subtitle="Gym floor attendance"
      />

      <section className="hero-card checkin-hero">
        <div>
          <p className="eyebrow">
            {openSession ? 'Active session' : 'Ready when you are'}
          </p>
          <h2>{openSession ? 'You are checked in' : 'Not checked in'}</h2>
          <p className="muted">
            {openSession
              ? `Since ${formatDateTime(openSession.checked_in_at)}`
              : 'Tap below when you arrive at the gym'}
          </p>
        </div>
        <div className={`pulse-dot${openSession ? ' is-on' : ''}`} />
      </section>

      <div className="card-actions center">
        {openSession ? (
          <button
            type="button"
            className="btn btn-primary wide"
            disabled={busy}
            onClick={checkOut}
          >
            {busy ? 'Working…' : 'Check out'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary wide"
            disabled={busy}
            onClick={checkIn}
          >
            {busy ? 'Working…' : 'Check in'}
          </button>
        )}
      </div>

      {message ? <p className="form-ok">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="section">
        <div className="section-head">
          <h3>Recent visits</h3>
        </div>
        {loading ? (
          <div className="screen-center compact">
            <div className="spinner" />
          </div>
        ) : rows.length === 0 ? (
          <p className="muted empty">No attendance records yet.</p>
        ) : (
          <div className="stack">
            {rows.map((row) => (
              <article key={row.id} className="list-card">
                <div className="list-card__body">
                  <h4>{formatDateTime(row.checked_in_at)}</h4>
                  <p className="muted">
                    {row.checked_out_at
                      ? `Out ${formatDateTime(row.checked_out_at)}`
                      : 'Still open'}
                    {row.source ? ` · ${row.source}` : ''}
                  </p>
                </div>
                <span
                  className={`chip ${
                    row.checked_out_at ? 'chip-soft' : 'chip-ok'
                  }`}
                >
                  {row.checked_out_at ? 'Done' : 'Open'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
