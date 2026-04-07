import { useState } from 'react';
import CognitiveTrace from './CognitiveTrace';
import './CognitiveDashboard.css';

function CognitiveDashboard({ brainState, setBrainState }) {
  const [ingestText, setIngestText] = useState('');
  const [ingestStatus, setIngestStatus] = useState('');

  const handleIngest = async () => {
    if (!ingestText.trim() || brainState.isLoading) return;
    
    setBrainState(prev => ({ ...prev, isLoading: true, statusMessage: 'Ingesting sensory data...' }));
    setIngestStatus('Ingesting...');

    try {
      const response = await fetch('/api/v1/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ingestText })
      });
      const data = await response.json();
      
      setIngestStatus(`Success: ${data.chunks} chunks stored.`);
      setIngestText('');
      setBrainState(prev => ({ 
        ...prev, 
        isLoading: false, 
        statusMessage: data.message
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setIngestStatus(''), 3000);
    } catch (error) {
      console.error('Ingest error:', error);
      setIngestStatus('Error injecting memory.');
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Ingestion failed.' }));
    }
  };

  const handleSleepCycle = async () => {
    if (brainState.isLoading) return;
    
    setBrainState(prev => ({ ...prev, isLoading: true, statusMessage: 'Initiating Sleep Cycle...' }));
    
    try {
      const response = await fetch('/api/v1/sleep', {
        method: 'POST'
      });
      const data = await response.json();
      
      setBrainState(prev => ({ 
        ...prev, 
        isLoading: false, 
        statusMessage: `Sleep Complete. Pruned ${data.messages_pruned} msgs, extracted ${data.graph_relations_extracted} relations.`
      }));
    } catch (error) {
      console.error('Sleep cycle error:', error);
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Sleep cycle failed.' }));
    }
  };

  return (
    <div className="cognitive-dashboard">

      <div className="dashboard-section">
        <h3 className="label-mono">System Commands</h3>
        <div className="ingest-form">
          <textarea 
            value={ingestText}
            onChange={(e) => setIngestText(e.target.value)}
            placeholder="FEED RAW DATA VECTOR..."
            style={{ 
              background: '#050505', 
              border: '1px solid #111', 
              color: 'var(--text-secondary)', 
              fontSize: '0.75rem', 
              fontFamily: 'var(--font-mono)',
              width: '100%',
              padding: '10px',
              height: '80px',
              resize: 'none'
            }}
          />
          <button onClick={handleIngest} className="action-btn-scifi" disabled={brainState.isLoading || !ingestText.trim()} style={{ width: '100%', marginTop: '10px' }}>
             <span>Initiate Ingestion</span>
             <span className="arrow">→</span>
          </button>
        </div>
        
        <button onClick={handleSleepCycle} className="action-btn-scifi" style={{ marginTop: '10px', width: '100%' }} disabled={brainState.isLoading}>
           <span>Consolidate Memory (Sleep)</span>
           <span className="arrow">→</span>
        </button>
      </div>

      <div className="dashboard-section vitals-hud">
        <h3 className="label-mono" style={{ fontSize: '0.65rem' }}>Brain Vitals</h3>
        <div className="vitals-grid">
          <div className="vital-item">
            <span className="vital-label">Sensory Neurons</span>
            <span className="vital-value">{brainState.sensoryDocuments}</span>
          </div>
          <div className="vital-item">
            <span className="vital-label">Synaptic Paths</span>
            <span className="vital-value purple">{brainState.graphRelations}</span>
          </div>
          <div className="vital-item">
            <span className="vital-label">Working Context</span>
            <span className={`vital-value ${brainState.workingMemory > 8 ? 'warning' : ''}`}>
              {brainState.workingMemory}
            </span>
          </div>
        </div>
        {brainState.workingMemory > 8 && (
          <div className="label-mono warning-text" style={{ fontSize: '0.55rem', marginTop: '5px' }}>
            ⚠ Memory Overload Detected. Suggest Sleep Cycle.
          </div>
        )}
      </div>

      <div className="dashboard-section">
         <div className={`glass-panel ${brainState.isLoading ? 'pulse-active' : ''}`} style={{ padding: '15px', position: 'relative', overflow: 'hidden' }}>
            {brainState.isLoading && <div className="neural-scan-line" />}
            <h3 className="label-mono" style={{ fontSize: '0.65rem', marginBottom: '10px' }}>Neural Status</h3>
            <div className="label-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.6rem', marginBottom: '10px' }}>{brainState.statusMessage}</div>
            
            {brainState.reflection && (
              <div className="internal-monologue label-mono">
                <span className="label-mono" style={{ fontSize: '0.5rem', opacity: 0.5, display: 'block', marginBottom: '4px' }}>// INTERNAL REFLECTION</span>
                {brainState.reflection}
              </div>
            )}

            <CognitiveTrace traces={brainState.traces} />

            {ingestStatus && (
              <div className="label-mono" style={{ color: 'var(--accent-secondary)', fontSize: '0.6rem', marginTop: '5px' }}>
                {ingestStatus}
              </div>
            )}
         </div>
      </div>

      <div className="dashboard-section">
        <h3 className="label-mono" style={{ fontSize: '0.65rem' }}>Neural Sparks (Subsurface)</h3>
        <div className="sparks-container">
          {brainState.sparks.length === 0 ? (
            <div className="label-mono" style={{ opacity: 0.3, fontSize: '0.6rem' }}>Subconscious idle...</div>
          ) : (
            brainState.sparks.map((spark, idx) => (
              <div key={idx} className="spark-item label-mono">
                <span className="spark-time">[{new Date(spark.timestamp).toLocaleTimeString()}]</span>
                <p className="spark-content">{spark.content}</p>
                <div className="spark-entities">
                  {spark.entities.map(e => <span key={e} className="spark-tag">#{e}</span>)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CognitiveDashboard;
