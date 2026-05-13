import './CognitiveTimeline.css';

const PHASE_CONFIG = {
  perception:     { icon: 'visibility',    color: '#8B5CF6' },
  attention:      { icon: 'track_changes', color: '#3B82F6' },
  recall:         { icon: 'psychology',    color: '#10B981' },
  reasoning:      { icon: 'hub',           color: '#F59E0B' },
  prediction:     { icon: 'auto_awesome',  color: '#3B82F6' },
  reflection:     { icon: 'architecture',  color: '#EC4899' },
  working_memory: { icon: 'inventory_2',   color: '#14B8A6' },
  routing:        { icon: 'shortcut',      color: '#F43F5E' },
  memory:         { icon: 'save',          color: '#8B5CF6' },
  graph:          { icon: 'hub',           color: '#EC4899' },
  output:         { icon: 'forum',         color: '#EC4899' }
};

function CognitiveTimeline({ trace = [] }) {
  return (
    <div className="timeline-container">
      {trace.map((item, i) => {
        const config = PHASE_CONFIG[item.phase] || { icon: 'circle', color: '#64748b' };
        return (
          <div key={i} className="timeline-row">
            <div className="timeline-time">{item.time}</div>
            <div className="timeline-connector">
              <div className="timeline-line"></div>
              <div className="timeline-dot" style={{ borderColor: config.color }}>
                <span className="material-icons" style={{ color: config.color, fontSize: '18px' }}>
                  {config.icon}
                </span>
              </div>
            </div>
            <div className="timeline-content">
              <div className="phase-title" style={{ color: config.color }}>
                {item.phase?.toUpperCase()}
              </div>
              <div className="phase-desc">{item.message}</div>
            </div>
          </div>
        );
      })}
      {trace.length === 0 && (
        <div className="timeline-empty">Awaiting cognitive signals...</div>
      )}
    </div>
  );
}

export default CognitiveTimeline;
