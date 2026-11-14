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
              This copy of the site is published on a static host (like GitHub Pages or Cloudflare), which can only show pages. It can’t store accounts,
              edits, or analytics.
            </p>
            <p className="muted">
              To use the board dashboard, run the site with its server: on your computer with <code>npm run dev</code>, or on a host that runs Node.js (see
              the README).
            </p>
          </div>
        </div>
      </section>
    );
  }
  if (auth.loading) return <div className="page-loading">Loading…</div>;
  if (auth.authenticated) return <Navigate to="/board/edit" replace />;

  const registering = !auth.registered;

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
        await api('/auth/register', { method: 'POST', body: { email, password } });
        await refreshAuth();
        setPassword('');
        setConfirm('');
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
              ? 'Enter the board email and create a password. This is a one-time setup for the student board.'
              : 'Log in to view analytics and edit the website.'}
          </p>

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
