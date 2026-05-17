import { useState, useEffect, useRef } from 'react';
import './AuthScreen.css';

function AuthScreen({ onAuth, darkMode, setDarkMode }) {
  const [stage, setStage]       = useState('splash');   // 'splash' | 'enter'
  const [username, setUsername]  = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const inputRef = useRef(null);

  // Focus input when entering name stage
  useEffect(() => {
    if (stage === 'enter' && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 600);
    }
  }, [stage]);

  const handleEnterClick = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStage('enter');
      setTransitioning(false);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/enter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim() }),
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
    <div className={`landing ${transitioning ? 'transitioning' : ''} ${darkMode ? 'dark' : ''}`}>

      {/* Dark Mode Toggle */}
      <button 
        className="landing-theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
      </button>

      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="bg-grid" />
        {/* Floating particles */}
        <div className="particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="particle" style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--duration': `${8 + Math.random() * 12}s`,
              '--delay': `${Math.random() * 5}s`,
              '--size': `${2 + Math.random() * 3}px`,
            }} />
          ))}
        </div>
      </div>

      {/* â•â•â•â•â•â• STAGE 1: Splash â•â•â•â•â•â• */}
      {stage === 'splash' && (
        <div className={`splash-content ${transitioning ? 'exit' : ''}`}>
          {/* Neural orb */}
          <div className="hero-orb">
            <div className="hero-ring r1" />
            <div className="hero-ring r2" />
            <div className="hero-ring r3" />
            <div className="hero-pulse-ring" />
            <div className="hero-core" />
          </div>

          <h1 className="hero-title">SOMA</h1>
          <p className="hero-tagline">Cognitive Architecture for AI</p>
          <p className="hero-desc">
            A brain-inspired system that builds memory as you talk.
            Every conversation shapes a living neural mesh — unique to you.
          </p>

          {/* Features row */}
          <div className="splash-features">
            <div className="splash-feature">
              <div className="sf-dot" />
              <span>Sensory Memory</span>
            </div>
            <div className="splash-feature">
              <div className="sf-dot" />
              <span>Knowledge Graph</span>
            </div>
            <div className="splash-feature">
              <div className="sf-dot" />
              <span>Neural Dreaming</span>
            </div>
          </div>

          <button className="enter-btn" onClick={handleEnterClick}>
            <span className="enter-btn-text">Enter</span>
            <span className="enter-btn-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </button>

          <div className="splash-hint">Press Enter or click to begin</div>
        </div>
      )}

      {/* â•â•â•â•â•â• STAGE 2: Name Input â•â•â•â•â•â• */}
      {stage === 'enter' && (
        <div className="name-content">
          {/* Small orb */}
          <div className="name-orb">
            <div className="hero-ring r1" />
            <div className="hero-ring r2" />
            <div className="hero-core" />
          </div>

          <h2 className="name-heading">Who are you?</h2>
          <p className="name-sub">
            Enter your name to initialize your neural space.
            New here? We'll create your brain automatically.
          </p>

          <form className="name-form" onSubmit={handleSubmit}>
            <div className="name-input-wrap">
              <input
                ref={inputRef}
                className="name-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Type your name..."
                autoComplete="username"
                required
              />
              <div className="name-input-glow" />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="name-submit" type="submit" disabled={loading || !username.trim()}>
              {loading ? (
                <span className="loading-dots">
                  <span />
                  <span />
                  <span />
                </span>
              ) : 'Initialize'}
            </button>
          </form>

          <button className="back-link" onClick={() => setStage('splash')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <span>Soma</span>
        <span className="footer-dot" />
        <span>Brain-Inspired AI</span>
      </footer>
    </div>
  );
}

export default AuthScreen;

