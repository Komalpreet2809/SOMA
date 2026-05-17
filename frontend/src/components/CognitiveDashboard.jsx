import './CognitiveDashboard.css';
import { useState, useEffect, useRef } from 'react';

function CognitiveDashboard({ statusText, stats }) {
  return (
    <div className="status-layout fade-in">
      <div className="status-sidebar">
        <div className="status-card highlight">
          <h3>Neural Vitals</h3>
          <SystemStatusChart state={statusText} />
          <div className="current-state">
            <span>Neural Frequency</span>
            <strong>{statusText}</strong>
          </div>
        </div>

        <div className="status-card">
          <h3>Memory Distribution</h3>
          <div className="metric-grid">
            {stats.map((item) => (
              <div key={item.label} className="metric-item">
                <div className="metric-icon-wrap">
                  <span className="material-icons">{item.icon}</span>
                </div>
                <div className="metric-info">
                  <label>{item.label}</label>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemStatusChart({ state }) {
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");
  const frameRef = useRef(0);

  const intensity = ['reasoning', 'language', 'reflection'].includes(state) ? 'high' : 
                    ['recall', 'association', 'attention'].includes(state) ? 'medium' : 'low';

  useEffect(() => {
    let animationFrame;
    
    const generateWave = (time, freq, amp, jitter, complexity = 1) => {
      let d = "M0,40 ";
      const step = complexity > 1 ? 5 : 10;
      for (let x = 0; x <= 300; x += step) {
        // Complex brainwave math: Base Sine + Harmonics for interference
        let yBase = Math.sin(x * freq + time) * amp;
        if (complexity > 1) {
          yBase += Math.sin(x * freq * 2.3 + time * 1.4) * (amp * 0.4);
          yBase += Math.sin(x * freq * 3.9 + time * 2.1) * (amp * 0.2);
        }
        
        const noise = (Math.random() - 0.5) * jitter;
        const y = 40 + yBase + noise;
        d += `L${x},${y} `;
      }
      return d;
    };

    const animate = () => {
      frameRef.current += intensity === 'high' ? 0.28 : intensity === 'medium' ? 0.14 : 0.06;
      const t = frameRef.current;
      
      const config = {
        high:   { freq: 0.12, amp: 26, jitter: 14, comp: 3 },
        medium: { freq: 0.08, amp: 18, jitter: 4,  comp: 1 },
        low:    { freq: 0.03, amp: 10, jitter: 1,  comp: 1 }
      }[intensity];

      setPath1(generateWave(t, config.freq, config.amp, config.jitter, config.comp));
      setPath2(generateWave(t * 0.8, config.freq * 0.6, config.amp * 0.5, config.jitter * 0.4, 1));
      
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [intensity]);

  const labels = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'THETA'];

  return (
    <div className={`system-chart intensity-${intensity}`}>
      <svg viewBox="0 0 300 80" className="system-chart-svg">
        <path d={path2} className="secondary" />
        <path d={path1} />
      </svg>
      <div className="chart-labels">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

export default CognitiveDashboard;
