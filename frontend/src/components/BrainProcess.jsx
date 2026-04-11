import './BrainProcess.css';

const PIPELINE_STAGES = [
  {
    id: 'reflect',
    label: 'REFLECT',
    region: 'Prefrontal Cortex',
    desc: 'Analyses intent & sets cognitive direction',
    icon: '◈',
    phases: ['perception'],
    color: '#f59e0b',
  },
  {
    id: 'retrieve',
    label: 'RETRIEVE',
    region: 'Hippocampus',
    desc: 'Searches sensory, semantic & episodic memory',
    icon: '◎',
    phases: ['recall', 'association'],
    color: '#06b6d4',
  },
  {
    id: 'synthesize',
    label: 'SYNTHESIZE',
    region: 'Neocortex',
    desc: 'Integrates memories → generates response',
    icon: '◉',
    phases: ['synthesis', 'reasoning'],
    color: '#10b981',
  },
];

const MEMORY_LAYERS = [
  {
    id: 'sensory',
    label: 'Sensory',
    sublabel: 'ChromaDB',
    sublabel2: 'Vector embeddings',
    key: 'sensoryDocuments',
    color: '#06b6d4',
    icon: '◈',
  },
  {
    id: 'semantic',
    label: 'Semantic',
    sublabel: 'Neo4j Graph',
    sublabel2: 'Knowledge graph',
    key: 'graphRelations',
    color: '#a78bfa',
    icon: '⬡',
  },
  {
    id: 'episodic',
    label: 'Episodic',
    sublabel: 'SQLite',
    sublabel2: 'Temporal log',
    key: 'workingMemory',
    color: '#f59e0b',
    icon: '◇',
  },
  {
    id: 'working',
    label: 'Working',
    sublabel: 'Active Context',
    sublabel2: 'Short-term buffer',
    key: 'workingMemory',
    color: '#10b981',
    icon: '◉',
  },
];

function getActiveStage(traces, isLoading) {
  if (!isLoading || !traces?.length) return null;
  const last = traces[traces.length - 1];
  if (!last) return null;
  for (const stage of PIPELINE_STAGES) {
    if (stage.phases.includes(last.phase)) return stage.id;
  }
  return null;
}

function BrainProcess({ brainState }) {
  const isActive = brainState.isLoading;
  const currentStage = getActiveStage(brainState.traces, isActive);
  const recentTraces = (brainState.traces || []).slice(-6);

  return (
    <div className="bp-panel">

      {/* ── Header ── */}
      <div className="bp-header">
        <span className="bp-title">Cognitive Architecture</span>
        <span className={`bp-status-badge ${isActive ? 'active' : 'idle'}`}>
          <span className="bp-status-dot" />
          {isActive ? 'Processing' : 'Idle'}
        </span>
      </div>

      {/* ── Pipeline ── */}
      <section className="bp-section">
        <div className="bp-section-label">Neural Pipeline</div>
        <div className="bp-pipeline">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isThis = currentStage === stage.id;
            const isPast = currentStage && PIPELINE_STAGES.findIndex(s => s.id === currentStage) > idx && isActive;
            return (
              <div key={stage.id} className="bp-pipeline-row">
                <div
                  className={`bp-stage ${isThis ? 'active' : ''} ${isPast ? 'done' : ''} ${isActive && !isThis && !isPast ? 'waiting' : ''}`}
                  style={{ '--stage-color': stage.color }}
                >
                  {isThis && <div className="bp-stage-pulse-ring" />}
                  <div className="bp-stage-icon" style={{ color: stage.color }}>{stage.icon}</div>
                  <div className="bp-stage-body">
                    <div className="bp-stage-label-text">{stage.label}</div>
                    <div className="bp-stage-region">{stage.region}</div>
                    <div className="bp-stage-desc">{stage.desc}</div>
                  </div>
                  {isPast && <div className="bp-stage-check">✓</div>}
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className={`bp-connector ${isActive ? 'flowing' : ''}`}>
                    <div className="bp-connector-line" />
                    <div className="bp-connector-arrow">↓</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Memory Layers ── */}
      <section className="bp-section">
        <div className="bp-section-label">Memory Architecture</div>
        <div className="bp-mem-grid">
          {MEMORY_LAYERS.map(layer => (
            <div
              key={layer.id}
              className="bp-mem-card"
              style={{ '--mem-color': layer.color }}
              data-layer={layer.id}
            >
              <div className="bp-mem-icon-wrap">
                <span className="bp-mem-icon" style={{ color: layer.color }}>{layer.icon}</span>
              </div>
              <div className="bp-mem-info">
                <div className="bp-mem-name">{layer.label}</div>
                <div className="bp-mem-sub">{layer.sublabel}</div>
                <div className="bp-mem-sub2">{layer.sublabel2}</div>
              </div>
              <div className="bp-mem-count" style={{ color: layer.color }}>
                {layer.key ? (brainState[layer.key] ?? 0) : '—'}
              </div>
              <div className="bp-mem-bar" style={{ background: layer.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Internal Reflection ── */}
      {brainState.reflection && (
        <section className="bp-section">
          <div className="bp-section-label">Internal Monologue</div>
          <div className="bp-reflection">
            <span className="bp-reflection-bubble">💭</span>
            <p className="bp-reflection-text">{brainState.reflection}</p>
          </div>
        </section>
      )}

      {/* ── Cognitive Trace ── */}
      {recentTraces.length > 0 && (
        <section className="bp-section">
          <div className="bp-section-label">Live Cognitive Trace</div>
          <div className="bp-traces">
            {recentTraces.map((trace, idx) => (
              <div key={idx} className={`bp-trace-row ${trace.phase || ''}`}>
                <span className="bp-trace-phase">{(trace.phase || 'info').toUpperCase()}</span>
                <span className="bp-trace-msg">{trace.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Neural Sparks ── */}
      {brainState.sparks?.length > 0 && (
        <section className="bp-section">
          <div className="bp-section-label">Neural Sparks — Background Dreaming</div>
          <div className="bp-sparks">
            {brainState.sparks.slice(0, 3).map((spark, idx) => (
              <div key={idx} className="bp-spark-card">
                <div className="bp-spark-tags">
                  {spark.entities?.map(e => (
                    <span key={e} className="bp-spark-tag">#{e}</span>
                  ))}
                </div>
                <p className="bp-spark-text">{spark.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Idle placeholder ── */}
      {!isActive && recentTraces.length === 0 && !brainState.reflection && !brainState.sparks?.length && (
        <div className="bp-idle">
          <div className="bp-idle-orb">
            <div className="bp-idle-core" />
          </div>
          <p className="bp-idle-hint">
            Send a message to watch the<br />
            cognitive process unfold live.
          </p>
          <div className="bp-idle-legend">
            <div className="bp-legend-row"><span className="bp-legend-dot" style={{ background: '#f59e0b' }} />Reflect — set intent</div>
            <div className="bp-legend-row"><span className="bp-legend-dot" style={{ background: '#06b6d4' }} />Retrieve — search memory</div>
            <div className="bp-legend-row"><span className="bp-legend-dot" style={{ background: '#10b981' }} />Synthesize — form response</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainProcess;
