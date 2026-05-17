import { useState, useMemo, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import './KnowledgeInput.css';

function KnowledgeInput({ onKnowledgeSubmit, isBusy, status }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = () => {
    if (!text.trim() || isBusy) return;
    onKnowledgeSubmit(text);
    
    if (analysis) {
      setLastAnalysis(analysis);
    } else {
      // Fallback if they clicked instantly or text was < 50 chars
      const charCount = text.length;
      setLastAnalysis({
        metrics: {
          density: Math.min(charCount / 2000, 1.0),
          chunks: Math.floor(charCount / 500) + 1,
          estimated_links: 0,
          reinforcement_index: 0
        },
        entities: [],
        existing_links: []
      });
    }
    
    setText('');
    setAnalysis(null);
  };

  // Debounced analysis function
  useEffect(() => {
    if (text.length < 50) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await apiFetch('/api/v1/analyze', {
          method: 'POST',
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (error) {
        console.error('Analysis failed', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [text]);

  const displayAnalysis = analysis || lastAnalysis;

  return (
    <div className="inscription-grid fade-in">
      {/* ── LEFT: The Inscription Terminal ── */}
      <div className="inscription-main">
        {status && (
          <div className="inscription-status fade-in">
            <span className="material-icons">check_circle</span>
            {status}
          </div>
        )}

        <div className="inscription-header">
          <div className="inscription-icon">
            <span className="material-icons">auto_awesome</span>
          </div>
          <div className="inscription-title">
            <h3>Neural Inscription</h3>
            <p>Directly seed the core cortex with high-fidelity knowledge.</p>
          </div>
        </div>

        <div className="inscription-composer">
          <textarea 
            value={text}
            onChange={(e) => {
               setText(e.target.value);
               if (lastAnalysis) setLastAnalysis(null);
            }}
            placeholder="Paste research, notes, or data chunks here for deep integration..."
            maxLength={10000}
          />
          <div className="inscription-footer">
            <div className="inscription-stats">
              <span className="char-count">{text.length} / 10000 Chars</span>
              {isBusy && <span className="busy-tag pulse">Integrating...</span>}
              {isAnalyzing && <span className="busy-tag pulse" style={{color: '#3b82f6'}}>Analyzing Pattern...</span>}
            </div>
            <button 
              className="inscription-btn" 
              onClick={handleSubmit}
              disabled={!text.trim() || isBusy}
            >
              <span className="material-icons">memory</span>
              Inscribe Knowledge
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Neural Analysis Preview ── */}
      <div className="inscription-sidebar">
        <div className="analysis-panel">
          <div className="panel-label">
            <span className="material-icons">biotech</span>
            {(!analysis && lastAnalysis) ? 'Last Inscription Details' : 'Neural Analysis Preview'}
          </div>
          
          <div className="analysis-content">
            <div className="analysis-metric">
              <label>Information Density</label>
              <div className="mini-meter">
                <div className="mini-fill" style={{ width: `${(displayAnalysis?.metrics?.density || 0) * 100}%` }} />
              </div>
              <div className="metric-sub">
                <span>{Math.round((displayAnalysis?.metrics?.density || 0) * 100)}% Salience</span>
              </div>
            </div>

            <div className="analysis-metric">
              <label>Knowledge Reinforcement</label>
              <div className="mini-meter">
                <div className="mini-fill" style={{ 
                  width: `${(displayAnalysis?.metrics?.reinforcement_index || 0) * 100}%`,
                  background: '#10b981' 
                }} />
              </div>
              <div className="metric-sub">
                <span>{Math.round((displayAnalysis?.metrics?.reinforcement_index || 0) * 100)}% Integration</span>
              </div>
            </div>

            <div className="analysis-section">
              <label>Potential Semantic Links</label>
              <div className="link-tags">
                {(displayAnalysis?.entities || []).map((entity, i) => {
                  const isExisting = displayAnalysis?.existing_links?.some(l => l.name.toLowerCase() === entity.toLowerCase());
                  return (
                    <div 
                      key={i} 
                      className={`link-tag fade-in ${isExisting ? 'reinforced' : ''}`} 
                      style={{animationDelay: `${i * 0.1}s`}}
                    >
                      <span className="dot" />
                      {entity}
                      {isExisting && <span className="material-icons reinforced-icon">offline_bolt</span>}
                    </div>
                  );
                })}
                {(!displayAnalysis?.entities || displayAnalysis.entities.length === 0) && (
                  <div className="empty-tag">
                    {isAnalyzing ? 'Decoding semantic structure...' : 'Awaiting sufficient context (50+ chars)...'}
                  </div>
                )}
              </div>
            </div>

            {displayAnalysis?.existing_links?.length > 0 && (
              <div className="analysis-section fade-in">
                <label>Reinforced Concepts</label>
                <div className="existing-links-list">
                  {displayAnalysis.existing_links.map((link, i) => (
                    <div key={i} className="existing-link-item">
                      <span className="material-icons">hub</span>
                      <div className="link-info">
                        <strong>{link.name}</strong>
                        <span>{link.connections} existing connections</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analysis-section">
              <label>Estimated Memory Impact</label>
              <div className="impact-stats">
                <div className="impact-item">
                  <span className="impact-val">{displayAnalysis?.metrics?.chunks || 0}</span>
                  <span className="impact-label">Sensory Chunks</span>
                </div>
                <div className="impact-item">
                  <span className="impact-val">{Math.floor(displayAnalysis?.metrics?.estimated_links || 0)}</span>
                  <span className="impact-label">Graph Triples</span>
                </div>
              </div>
            </div>

            <div className="analysis-section">
              <label>Target Layers</label>
              <div className="layer-item">
                <span className="dot" style={{background: '#ff6b35'}} />
                <span>Semantic Memory (Graph)</span>
              </div>
              <div className="layer-item">
                <span className="dot" style={{background: '#10b981'}} />
                <span>Sensory Cortex (Vector)</span>
              </div>
            </div>
          </div>

          <div className="panel-footer">
            <span className="material-icons">info</span>
            Data will be parsed into triples and vectorized.
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeInput;

