import './CognitiveTimeline.css';

const PHASE_CONFIG = {
  perception:     { icon: 'visibility',    color: '#ff6b35', label: 'Perception' },
  attention:      { icon: 'track_changes', color: '#3b82f6', label: 'Attention' },
  recall:         { icon: 'psychology',    color: '#10b981', label: 'Recall' },
  reasoning:      { icon: 'hub',           color: '#ff6b35', label: 'Reasoning' },
  output:         { icon: 'chat_bubble_outline', color: '#8ab892', label: 'Output' }
};

function CognitiveTimeline({ trace }) {
  if (!trace || trace.length === 0) {
    return (
      <div className="timeline-empty">
        No cognitive activity recorded yet...
      </div>
    );
  }

  return (
    <div className="timeline-container fade-in">
      {trace.map((item, index) => {
        const config = PHASE_CONFIG[item.phase.toLowerCase()] || { icon: 'circle', color: '#ccc', label: item.phase };
        
        return (
          <div key={index} className="timeline-row">
            <div className="timeline-time">{item.time}</div>
            <div className="timeline-dot-wrap">
              <div className="timeline-dot" style={{ backgroundColor: config.color }}></div>
            </div>
            <div className="timeline-content">
              <div className="phase-header">
                <div className="phase-icon" style={{ color: config.color }}>
                  <span className="material-icons">{config.icon}</span>
                </div>
                <div className="phase-title">{config.label}</div>
              </div>
              <div className="phase-desc">
                {item.content || item.desc || 'Processing information...'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CognitiveTimeline;
