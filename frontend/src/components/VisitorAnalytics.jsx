import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import './VisitorAnalytics.css';

function VisitorAnalytics({ onClose }) {
  const [stats, setStats] = useState({ total_visitors: 0, unique_visitors: 0, status: 'connecting' });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/v1/analytics/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setStats({ total_visitors: 0, unique_visitors: 0, status: 'offline' });
      }
    } catch (error) {
      console.error("Failed to fetch visitor stats:", error);
      setStats({ total_visitors: 0, unique_visitors: 0, status: 'offline' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const returningCount = Math.max(0, stats.total_visitors - stats.unique_visitors);
  const returningPercentage = stats.total_visitors > 0 
    ? Math.round((returningCount / stats.total_visitors) * 100) 
    : 0;
  const uniquePercentage = stats.total_visitors > 0 
    ? Math.round((stats.unique_visitors / stats.total_visitors) * 100) 
    : 100;

  return (
    <div className="analytics-modal-backdrop" onClick={onClose}>
      <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close Diagnostics">
          <span className="material-icons">close</span>
        </button>

        <div className="analytics-stage">
          <div className="analytics-header-row">
            <div className="analytics-title-area">
              <h3>Visitor Insights</h3>
              <p>Real-time visitor insights powered by Redis + CDN caching.</p>
            </div>
            <div className="analytics-db-status">
              {stats.status === 'online' && (
                <span className="status-badge success">
                  <span className="dot pulse" />
                  Live Tracking
                </span>
              )}
              {stats.status === 'offline' && (
                <span className="status-badge error">
                  <span className="dot" />
                  Simulated
                </span>
              )}
              {stats.status === 'connecting' && (
                <span className="status-badge warning pulse">
                  <span className="dot" />
                  Connecting...
                </span>
              )}
            </div>
          </div>

          <div className="analytics-grid">
            {/* Metric 1: Total Hits */}
            <div className="metric-card total-hits glow-orange">
              <div className="metric-icon">
                <span className="material-icons">visibility</span>
              </div>
              <div className="metric-data">
                <span className="metric-number">{stats.total_visitors}</span>
                <span className="metric-label">Total Visits</span>
              </div>
              <div className="metric-graph-bg">
                <div className="mini-wave" />
              </div>
            </div>

            {/* Metric 2: Unique Hits */}
            <div className="metric-card unique-hits glow-green">
              <div className="metric-icon">
                <span className="material-icons">fingerprint</span>
              </div>
              <div className="metric-data">
                <span className="metric-number">{stats.unique_visitors}</span>
                <span className="metric-label">Unique Visitors</span>
              </div>
              <div className="metric-graph-bg">
                <div className="mini-wave wave-green" />
              </div>
            </div>
          </div>

          <div className="analytics-insights-grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Traffic breakdown panel */}
            <div className="insights-panel ratio-panel">
              <h4>Visitor Retention Breakdown</h4>
              <div className="ratio-bar-container">
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill unique-fill" 
                    style={{ width: `${uniquePercentage}%` }}
                    title={`Unique: ${uniquePercentage}%`}
                  />
                  <div 
                    className="ratio-fill returning-fill" 
                    style={{ width: `${returningPercentage}%` }}
                    title={`Returning: ${returningPercentage}%`}
                  />
                </div>
                <div className="ratio-legend">
                  <div className="legend-item">
                    <span className="indicator-dot unique-dot" />
                    <span>New ({uniquePercentage}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="indicator-dot returning-dot" />
                    <span>Returning ({returningPercentage}%)</span>
                  </div>
                </div>
              </div>

              <div className="retention-score-block">
                <span className="retention-score">{returningCount}</span>
                <div className="retention-copy">
                  <h5>Repeat Visits</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-action-row">
            <button className="analytics-sync-btn" onClick={fetchStats} disabled={loading}>
              <span className="material-icons">sync</span>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorAnalytics;
