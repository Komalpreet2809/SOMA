import sleepImg from '../assets/sleep_nobg.b64.js';
import './DreamSequence.css';

export function SleepProgress({ phaseIndex, isConsolidating, onStart, summary, vitals, onClose }) {
  const steps = ['Analyzing Memories', 'Linking Concepts', 'Pruning Redundancies'];

  // Parse message count in working memory
  const workingCount = parseInt(vitals?.working || 0);
  const adenosineScore = Math.min(workingCount * 12.5, 100);
  const isOptimal = workingCount >= 4;

  return (
    <div className="sleep-page-container fade-in">
      <div className="sleep-page-header">
        <h2>Sleep (Consolidation)</h2>
      </div>

      <div className="sleep-split-layout">
        {/* Left Column: Brain Image (ALWAYS VISIBLE!) */}
        <div className="sleep-left-panel">
          <div className="sleep-brain-wrap-combined">
            <img src={sleepImg} className="sleep-brain-image-asset" alt="Soma Sleeping Brain" />
          </div>
        </div>

        {/* Right Column: Dynamic State Panel */}
        <div className="sleep-right-panel">
          {summary ? (
            /* State 1: Consolidation Summary Card (Directly inline on the right side!) */
            <div className="summary-card-inline fade-in">
              <button className="summary-close-combined" onClick={onClose}>
                <span className="material-icons">close</span>
              </button>
              
              <div className="summary-header-combined">
                <div className="summary-header-icon-combined">
                  <span className="material-icons">bedtime</span>
                </div>
                <div className="summary-header-copy-combined">
                  <h3>Sleep Cycle Complete</h3>
                  <p>Memory consolidation finished</p>
                </div>
              </div>

              <div className="summary-list-combined">
                {[
                  { label: 'Linked Together', value: `${summary.linked} connections created`, icon: 'hub', tone: 'green' },
                  { label: 'Consolidated', value: `${summary.consolidated} summaries saved`, icon: 'inventory_2', tone: 'teal' },
                  { label: 'Pruned', value: `${summary.pruned} raw logs pruned`, icon: 'filter_alt', tone: 'orange' },
                ].map((item) => (
                  <div key={item.label} className="summary-item-combined">
                    <div className={`summary-item-icon-combined ${item.tone}`}>
                      <span className="material-icons">{item.icon}</span>
                    </div>
                    <div className="summary-item-copy-combined">
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="summary-view-btn-combined" onClick={onClose}>Return to Console</button>
            </div>
          ) : isConsolidating ? (
            /* State 2: Active Consolidation Checklist Steps */
            <div className="sleep-progress-combined fade-in">
              <div className="sleep-copy-combined">
                <h3>Soma is consolidating memories...</h3>
                <p>Cleaning, linking and strengthening knowledge.</p>
              </div>

              <div className="sleep-steps-vertical">
                {steps.map((step, index) => {
                  const completed = index < phaseIndex;
                  const active = index === phaseIndex;

                  return (
                    <div key={step} className="sleep-step-item-wrap-vertical">
                      {index > 0 && (
                        <div className="sleep-step-connector-vertical">
                          <div className="connector-line" />
                        </div>
                      )}
                      <div className={`sleep-step-item-vertical ${active ? 'active' : ''}`}>
                        <div className={`sleep-step-circle ${completed ? 'completed' : active ? 'active' : 'pending'}`}>
                          {completed && <span className="material-icons">check</span>}
                          {active && <div className="active-dot-inner" />}
                        </div>
                        <span className="sleep-step-text">{step}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* State 3: Landing / Idle State with Sleep button */
            <div className="sleep-landing-combined fade-in">
              <div className="sleep-copy-combined">
                <h3>Reorganize Neural Structures</h3>
                <p>
                  Consolidate recent transactional chat logs into the ChromaDB sensory database and extract semantic facts to the Neo4j Knowledge Graph.
                </p>
              </div>
              
              <button className="sleep-trigger-btn" onClick={onStart}>
                <span className="material-icons">bedtime</span>
                <span>Sleep</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Telemetry Metric Dashboard */}
      <div className="sleep-telemetry-grid">
        {/* Card 1: Sleep Pressure / Adenosine */}
        <div className="sleep-telemetry-card">
          <div className="telemetry-card-header">
            <h4>Sleep Pressure (Adenosine)</h4>
            <span className="material-icons">hourglass_empty</span>
          </div>
          <div className="telemetry-card-value">
            {adenosineScore.toFixed(0)}%
          </div>
          <div className="telemetry-card-subtext">
            {isOptimal ? 'Sleep pressure high. Consolidation critical.' : 'Accumulating data. Low neural pressure.'}
          </div>
          <div className="adenosine-progress-container">
            <div 
              className="adenosine-progress-bar" 
              style={{ 
                width: `${adenosineScore}%`,
                background: isOptimal ? 'linear-gradient(90deg, #ff8c00, #ff4500)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)' 
              }} 
            />
          </div>
        </div>

        {/* Card 2: Synaptic Queue Density */}
        <div className="sleep-telemetry-card">
          <div className="telemetry-card-header">
            <h4>Working Synapses</h4>
            <span className="material-icons">psychology</span>
          </div>
          <div className="telemetry-card-value">
            {workingCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#666', marginLeft: '4px' }}>exchanges</span>
          </div>
          <div className="telemetry-card-subtext">
            {workingCount > 0 
              ? `${workingCount} raw dialogic traces stored in pre-consolidated state.` 
              : 'Working memory fully cleared. No traces queued.'}
          </div>
        </div>

        {/* Card 3: Consolidation Readiness */}
        <div className="sleep-telemetry-card">
          <div className="telemetry-card-header">
            <h4>System Readiness</h4>
            <span className="material-icons">bolt</span>
          </div>
          <div className="telemetry-card-value">
            {isOptimal ? (
              <span className="telemetry-status-badge ready">READY TO SLEEP</span>
            ) : (
              <span className="telemetry-status-badge optimal" style={{ background: '#dbeafe', color: '#1e40af' }}>ACCUMULATING</span>
            )}
          </div>
          <div className="telemetry-card-subtext">
            {isOptimal 
              ? 'Meets minimum requirement (≥ 4 messages) for factual extraction.' 
              : 'Needs at least 4 chat messages in working memory to trigger.'}
          </div>
        </div>
      </div>
    </div>
  );
}
