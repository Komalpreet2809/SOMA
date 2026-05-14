import CognitiveBrainImageScene from './CognitiveBrainImageScene';
import './DreamSequence.css';

export function SleepProgress({ phaseIndex }) {
  const steps = ['Analyzing Memories', 'Linking Concepts', 'Pruning Redundancies'];

  return (
    <div className="sleep-layout fade-in">
      <div className="sleep-brain-wrap">
        <CognitiveBrainImageScene scale={1.3} />
      </div>
      <div className="sleep-copy">
        <h3>Soma is consolidating memories...</h3>
        <p>Cleaning, linking and strengthening knowledge.</p>
      </div>
      <div className="sleep-steps">
        {steps.map((step, index) => {
          const completed = index < phaseIndex;
          const active = index === phaseIndex;

          return (
            <div key={step} className="sleep-step">
              <div className={`sleep-step-dot ${completed ? 'completed' : active ? 'active' : ''}`}>
                {completed ? <span className="material-icons" style={{fontSize: '14px'}}>check</span> : (index + 1)}
              </div>
              <div className={`sleep-step-label ${active ? 'active' : ''}`}>{step}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SleepSummary({ summary, onClose }) {
  const data = summary || { linked: 12, consolidated: 28, pruned: 17, strengthened: 34 };
  const items = [
    { label: 'Linked Together', value: `${data.linked} new connections created`, icon: 'hub', tone: 'green' },
    { label: 'Consolidated', value: `${data.consolidated} memories merged`, icon: 'inventory_2', tone: 'teal' },
    { label: 'Pruned', value: `${data.pruned} redundant items removed`, icon: 'filter_alt', tone: 'orange' },
    { label: 'Strengthened', value: `${data.strengthened} memory traces updated`, icon: 'auto_awesome', tone: 'amber' },
  ];

  return (
    <div className="summary-overlay fade-in">
      <div className="summary-card">
        <button className="summary-close" onClick={onClose}><span className="material-icons">close</span></button>
        
        <div className="summary-header">
          <div className="summary-header-icon">
            <span className="material-icons">bedtime</span>
          </div>
          <div className="summary-header-copy">
            <h3>Sleep Cycle Complete</h3>
            <p>Memory consolidation finished</p>
          </div>
        </div>

        <div className="summary-list">
          {items.map((item) => (
            <div key={item.label} className="summary-item">
              <div className={`summary-item-icon ${item.tone}`}>
                <span className="material-icons">{item.icon}</span>
              </div>
              <div className="summary-item-copy">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="summary-view-btn" onClick={onClose}>View Summary</button>
      </div>
    </div>
  );
}
