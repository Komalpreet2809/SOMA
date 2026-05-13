import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onEnter }) => {
  return (
    <div className="landing-container">
      <div className="neural-background">
        <div className="neural-particles"></div>
        <div className="synaptic-pulses"></div>
      </div>
      
      <div className="hero-section fade-in">
        <h1 className="hero-title t-display">SOMA</h1>
        <p className="hero-subtitle">A Brain-Inspired Cognitive AI System</p>
        <p className="hero-description">Observe cognition in real time.</p>
        
        <div className="hero-actions">
          <button className="btn-primary btn-large" onClick={onEnter}>
            <span className="material-icons">psychology</span>
            Enter Cognitive Console
          </button>
          <button className="btn-secondary btn-large">
            <span className="material-icons">play_circle</span>
            Watch Demo Replay
          </button>
        </div>
      </div>

      <div className="features-grid slide-up">
        <div className="feature-card glass-card">
          <span className="material-icons feature-icon" style={{ color: 'var(--color-memory)' }}>memory</span>
          <h3>Working Memory</h3>
          <p>Real-time context management inspired by biological short-term storage.</p>
        </div>
        <div className="feature-card glass-card">
          <span className="material-icons feature-icon" style={{ color: 'var(--color-reasoning)' }}>insights</span>
          <h3>Semantic Association</h3>
          <p>Dynamic knowledge graph linking concepts through neural weights.</p>
        </div>
        <div className="feature-card glass-card">
          <span className="material-icons feature-icon" style={{ color: 'var(--color-dreaming)' }}>auto_awesome</span>
          <h3>Dreaming System</h3>
          <p>Subconscious consolidation of memories and concept strengthening.</p>
        </div>
      </div>

      <footer className="landing-footer">
        <p className="t-label">Soma visualizes a brain-inspired computational model. It is not a biological brain simulation.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
