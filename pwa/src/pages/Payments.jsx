import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { formatDateTime, formatMoney, statusClass } from '../lib/format';

const METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    amount: '',
    method: 'bank_transfer',
    reference: '',
    description: '',
    planId: '',
  });
  const [file, setFile] = useState(null);

  const load = async () => {
    try {
      const [mine, planList] = await Promise.all([
        api.get('/member/payments?limit=30'),
        api.get('/member/plans'),
      ]);
      setPayments(mine.data || []);
      setPlans(planList.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onPlanChange = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      planId,
      amount: plan ? String(plan.price) : prev.amount,
      description: plan
        ? `Membership: ${plan.name}`
        : prev.description,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!file) {
      setError('Payment proof image is required');
      return;
    }
    if (!form.amount || Number(form.amount) < 0) {
      setError('Enter a valid amount');
      return;
    }

    const body = new FormData();
    body.append('amount', form.amount);
    body.append('method', form.method);
    if (form.reference) body.append('reference', form.reference);
    if (form.description) body.append('description', form.description);
    body.append('proofImage', file);

    setSubmitting(true);
    try {
      await api.upload('/member/payments', body);
      setMessage('Payment proof submitted for review');
      setFile(null);
      setForm((prev) => ({
        ...prev,
        reference: '',
        description: prev.planId ? prev.description : '',
      }));
      await load();
    } catch (err) {
      setError(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Payments"
        subtitle="Upload proof for admin approval"
      />

      <form className="panel" onSubmit={submit}>
        <h3>Submit payment</h3>

        <label className="field">
          <span>Plan (optional)</span>
          <select
            value={form.planId}
            onChange={(e) => onPlanChange(e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {formatMoney(plan.price, plan.currency || 'USD')}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Method</span>
          <select
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Reference</span>
          <input
            type="text"
            maxLength={100}
            placeholder="Transaction ID / note"
            value={form.reference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Description</span>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Proof image</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {file ? (
          <p className="muted tiny">Selected: {file.name}</p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary wide"
          disabled={submitting}
        >
          {submitting ? 'Uploading…' : 'Submit proof'}
        </button>
      </form>

      {message ? <p className="form-ok">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="section">
        <div className="section-head">
          <h3>History</h3>
        </div>
        {loading ? (
          <div className="screen-center compact">
            <div className="spinner" />
          </div>
        ) : payments.length === 0 ? (
          <p className="muted empty">No payments yet.</p>
        ) : (
          <div className="stack">
            {payments.map((payment) => (
              <article key={payment.id} className="list-card">
                <div className="list-card__body">
                  <h4>
                    {formatMoney(payment.amount, payment.currency || 'USD')}
                  </h4>
                  <p className="muted">
                    {formatDateTime(payment.created_at)}
                    {payment.method ? ` · ${payment.method}` : ''}
                  </p>
                  {payment.description ? (
                    <p className="muted tiny">{payment.description}</p>
                  ) : null}
                </div>
                <span className={`chip status-${statusClass(payment.status)}`}>
                  {payment.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
