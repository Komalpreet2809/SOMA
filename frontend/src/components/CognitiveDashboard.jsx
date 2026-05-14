import './CognitiveDashboard.css';
import CognitiveBrainImageScene from './CognitiveBrainImageScene';

function CognitiveDashboard({ statusText, stats }) {
  return (
    <div className="status-layout fade-in">
      <div className="status-visual">
        <CognitiveBrainImageScene state="reasoning" />
      </div>

      <div className="status-sidebar">
        <div className="status-card">
          <h3>Neural Vitals</h3>
          <SystemStatusChart />
          <div className="current-state">
            <span>Current Status</span>
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

function SystemStatusChart() {
  // SVG points for smooth overlapping waves
  const wave1 = "M0,40 Q30,5 60,40 T120,40 T180,40 T240,40 T300,40";
  const wave2 = "M0,50 Q40,25 80,50 T160,50 T240,50 T320,50 T400,50";
  const labels = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'THETA'];

  return (
    <div className="system-chart">
      <svg viewBox="0 0 300 80" className="system-chart-svg">
        <path d={wave2} className="secondary" />
        <path d={wave1} />
      </svg>
      <div className="chart-labels">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

export default CognitiveDashboard;
