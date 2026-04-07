import { useState } from 'react';
import './CognitiveTrace.css';

const PHASE_ICONS = {
  perception: '👀',
  recall: '📚',
  association: '🔗',
  synthesis: '🧪',
  reasoning: '🧠',
  error: '⚠️'
};

function CognitiveTrace({ traces }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!traces || traces.length === 0) {
    return (
      <div className="trace-container empty">
        <div className="label-mono" style={{ opacity: 0.4 }}>Waiting for neural activity...</div>
      </div>
    );
  }

  return (
    <div className="trace-container">
      <div className="trace-header label-mono">Cognitive Trace Log</div>
      <div className="trace-list">
        {traces.map((trace, idx) => (
          <div 
            key={idx} 
            className={`trace-item ${trace.phase} ${expandedIndex === idx ? 'expanded' : ''}`}
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            <div className="trace-main">
              <span className="trace-icon">{PHASE_ICONS[trace.phase] || '📍'}</span>
              <span className="trace-message label-mono">{trace.message}</span>
              {trace.data && <span className="trace-expand-hint">[{expandedIndex === idx ? '-' : '+'}]</span>}
            </div>
            
            {trace.data && expandedIndex === idx && (
              <div className="trace-data-glimpse">
                <pre>{JSON.stringify(trace.data, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CognitiveTrace;
