import { useState } from 'react';
import './AuthScreen.css';

function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? 'login' : 'register';
    try {
      const res  = await fetch(`/api/v1/auth/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail[0]?.msg ?? 'Invalid input'
          : data.detail ?? 'Something went wrong';
        setError(msg);
        return;
      }

      localStorage.setItem('soma_token',    data.access_token);
      localStorage.setItem('soma_username', data.username);
      onAuth(data.username);
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">

      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="bg-grid" />
      </div>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-orb">
          <div className="hero-ring r1" />
          <div className="hero-ring r2" />
          <div className="hero-ring r3" />
          <div className="hero-core" />
        </div>
        <h1 className="hero-title">SOMA</h1>
        <p className="hero-tagline">Cognitive Architecture for AI</p>
        <p className="hero-desc">
          A brain-inspired system that builds memory as you talk.
          Every conversation shapes a living neural mesh — unique to you.
        </p>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <h3 className="feature-name">Sensory Memory</h3>
          <p className="feature-desc">Vector-powered recall that finds meaning in your words</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
              <path d="M8 6h8M6 8v8M18 8v8M8 18h8"/>
            </svg>
          </div>
          <h3 className="feature-name">Knowledge Graph</h3>
          <p className="feature-desc">Entities and relationships extracted and mapped in real time</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h3 className="feature-name">Neural Dreaming</h3>
          <p className="feature-desc">Background sparks weave new connections while you think</p>
        </div>
      </section>

      {/* ── Auth Card ── */}
      <section className="landing-auth">
        <h2 className="auth-heading">
          {mode === 'login' ? 'Welcome back' : 'Create your brain'}
        </h2>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to start a new cognitive session.'
            : 'Your own private neural space — built from scratch, every time.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. komal"
              autoFocus
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="auth-toggle-btn"
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>Soma</span>
        <span className="footer-dot" />
        <span>Brain-Inspired AI</span>
      </footer>
    </div>
  );
}

export default AuthScreen;
