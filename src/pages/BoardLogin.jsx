import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { api } from '../api.js';

const BOARD_EMAIL = 'informs@scu.edu';

export default function BoardLogin() {
  const { auth, refreshAuth, staticSite } = useSite();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (staticSite) {
    return (
      <section className="section page-section">
        <div className="container auth-wrap">
          <div className="card auth-card">
            <h1>Board Login</h1>
            <p className="muted">
              This copy of the site is a read-only preview (for example on GitHub Pages). It can’t store accounts, edits, or analytics.
            </p>
            <p className="muted">To use the board dashboard, open Board Login on the main site hosted on Cloudflare.</p>
          </div>
        </div>
      </section>
    );
  }
  if (auth.loading) return <div className="page-loading">Loading…</div>;
  if (auth.authenticated) return <Navigate to="/board/edit" replace />;

  const registering = !auth.registered;
  const needsSetupCode = registering && auth.setupCodeRequired;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (registering) {
      if (email.trim().toLowerCase() !== BOARD_EMAIL) return setError('That email can’t be registered as the board account.');
      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }
    setBusy(true);
    try {
      if (registering) {
        await api('/auth/register', { method: 'POST', body: { email, password, setupCode } });
        await refreshAuth();
        setPassword('');
        setConfirm('');
        setSetupCode('');
        setNotice('Board account created. Now log in with your new password.');
      } else {
        await api('/auth/login', { method: 'POST', body: { email, password } });
        await refreshAuth();
        navigate('/board/edit');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section page-section">
      <div className="container auth-wrap">
        <form className="card auth-card" onSubmit={onSubmit}>
          <h1>{registering ? 'Register the board account' : 'Board Login'}</h1>
          <p className="muted">
            {registering
              ? needsSetupCode
                ? 'Enter the setup code, the board email, and a new password. This is a one-time setup for the student board.'
                : 'Enter the board email and create a password. This is a one-time setup for the student board.'
              : 'Log in to view analytics and edit the website.'}
          </p>

          {needsSetupCode && (
            <label>
              Setup code
              <input type="password" value={setupCode} onChange={(e) => setSetupCode(e.target.value)} required autoComplete="off" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={registering ? 8 : undefined}
              autoComplete={registering ? 'new-password' : 'current-password'}
            />
          </label>
          {registering && (
            <label>
              Confirm password
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : registering ? 'Create account' : 'Log in'}
          </button>
          {notice && <p className="form-status success">{notice}</p>}
          {error && <p className="form-status error">{error}</p>}
        </form>
      </div>
    </section>
  );
}
