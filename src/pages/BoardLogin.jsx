import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { api } from '../api.js';

export default function BoardLogin() {
  const { auth, refreshAuth, staticSite } = useSite();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      await refreshAuth();
      navigate('/board/edit');
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
          <h1>Board Login</h1>
          <p className="muted">Log in to view analytics and edit the website.</p>
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
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : 'Log in'}
          </button>
          {error && <p className="form-status error">{error}</p>}
        </form>
      </div>
    </section>
  );
}
