import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSuccess = async (response) => {
    if (!response?.credential) {
      setError('Google sign-in failed');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await loginWithGoogle(response.credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo.png" alt="Hope Fitness Center" className="login-logo" />
        <h1>Hope Gym</h1>
        <p className="muted">
          Sign in with Google to book classes, check in, and submit payments.
        </p>

        <div className={`google-wrap${busy ? ' is-busy' : ''}`}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google sign-in was cancelled')}
            useOneTap={false}
            theme="filled_black"
            size="large"
            shape="pill"
            text="continue_with"
            width="280"
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <p className="muted tiny">
          Open to any Google account. New members are created automatically.
        </p>
      </div>
    </div>
  );
}
