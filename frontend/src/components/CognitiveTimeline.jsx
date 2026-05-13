import './CognitiveTimeline.css';

const PHASES = [
  { time: '10:42:11', phase: 'PERCEPTION', icon: 'visibility', color: '#8B5CF6', desc: 'Received input and understanding intent' },
  { time: '10:42:12', phase: 'ATTENTION', icon: 'track_changes', color: '#6366F1', desc: 'Focusing on key concepts and relationships' },
  { time: '10:42:13', phase: 'RECALL', icon: 'database', color: '#10B981', desc: 'Retrieved 5 memories from sensory and 2 from semantic' },
  { time: '10:42:15', phase: 'REASONING', icon: 'psychology', color: '#F59E0B', desc: 'Synthesizing information and evaluating trade-offs' },
  { time: '10:42:18', phase: 'OUTPUT', icon: 'message', color: '#EC4899', desc: 'Generating response' }
];

function CognitiveTimeline() {
  return (
    <div className="timeline-container">
      {PHASES.map((p, i) => (
        <div key={i} className="timeline-row">
          <div className="timeline-time">{p.time}</div>
          <div className="timeline-connector">
            <div className="timeline-line"></div>
            <div className="timeline-dot" style={{ borderColor: p.color }}>
              <span className="material-icons" style={{ color: p.color, fontSize: '18px' }}>{p.icon}</span>
            </div>
          </div>
          <div className="timeline-content">
            <div className="phase-title" style={{ color: p.color }}>{p.phase}</div>
            <div className="phase-desc">{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CognitiveTimeline;
