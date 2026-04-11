import { useState } from 'react';
import './AuthScreen.css';

function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('login');  // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`/api/v1/auth/${mode}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // FastAPI validation errors come back as { detail: [...] }
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
    <div className="auth-overlay">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-orb">
            <div className="auth-orb-ring r1" />
            <div className="auth-orb-ring r2" />
            <div className="auth-orb-ring r3" />
            <div className="auth-orb-core" />
          </div>
          <span className="auth-logo-name">SOMA</span>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Create your brain'}
        </h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to access your personal neural space.'
            : 'Your conversations, memories, and knowledge graph — private to you.'}
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
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
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

      </div>
    </div>
  );
}

export default AuthScreen;
