import './CognitiveTimeline.css';

const PHASE_CONFIG = {
  perception:     { icon: 'visibility',    color: '#ff6b35', label: 'Perception' },
  attention:      { icon: 'track_changes', color: '#3b82f6', label: 'Attention' },
  emotion:        { icon: 'favorite',      color: '#e11d48', label: 'Emotion' },
  routing:        { icon: 'route',         color: '#f59e0b', label: 'Routing' },
  prediction:     { icon: 'online_prediction', color: '#8b5cf6', label: 'Prediction' },
  working_memory: { icon: 'memory',        color: '#06b6d4', label: 'Working Memory' },
  reflection:     { icon: 'lightbulb',     color: '#f59e0b', label: 'Reflection' },
  recall:         { icon: 'psychology',    color: '#10b981', label: 'Recall' },
  inhibition:     { icon: 'block',         color: '#ef4444', label: 'Inhibition' },
  association:    { icon: 'device_hub',    color: '#3b82f6', label: 'Association' },
  reasoning:      { icon: 'hub',           color: '#ff6b35', label: 'Reasoning' },
  language:       { icon: 'chat_bubble',   color: '#8ab892', label: 'Language' },
  memory:         { icon: 'save',          color: '#10b981', label: 'Consolidation' },
  graph:          { icon: 'share',         color: '#3b82f6', label: 'Graph Update' },
};

function CognitiveTimeline({ trace }) {
  const rawTrace = trace
    .filter(item => item.phase)
    .reverse(); // Chronological order

  const consolidatedTrace = [];
  let currentPhase = null;

  rawTrace.forEach(item => {
    if (currentPhase && currentPhase.phase === item.phase) {
      currentPhase.message = item.message || item.content || item.desc;
      currentPhase.time = item.time;
    } else {
      currentPhase = { ...item };
      consolidatedTrace.push(currentPhase);
    }
  });

  if (!consolidatedTrace || consolidatedTrace.length === 0) {
    return (
      <div className="timeline-empty">
        <span className="material-icons">sensors</span>
        <p>Awaiting sensory stimuli...</p>
      </div>
    );
  }

  return (
    <div className="timeline-container fade-in">
      {consolidatedTrace.map((item, index) => {
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
                {item.message || item.content || item.desc || 'Processing information...'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CognitiveTimeline;
