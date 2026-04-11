import './BrainProcess.css';

const STAGES = [
  {
    id: 'reflect',
    label: 'Reflect',
    region: 'Prefrontal Cortex',
    desc: 'Sets cognitive direction, interprets intent',
    phases: ['perception'],
    color: '#d4a853',  /* amber */
  },
  {
    id: 'retrieve',
    label: 'Retrieve',
    region: 'Hippocampus',
    desc: 'Searches sensory, semantic & episodic stores',
    phases: ['recall', 'association'],
    color: '#4ecdc4',  /* teal */
  },
  {
    id: 'synthesize',
    label: 'Synthesize',
    region: 'Neocortex',
    desc: 'Weaves memories into language & response',
    phases: ['synthesis', 'reasoning'],
    color: '#e07a38',  /* fire */
  },
];

const MEMORY_LAYERS = [
  { id: 'sensory',   label: 'Sensory',   tech: 'ChromaDB',     detail: 'Vector embeddings',  key: 'sensoryDocuments', color: '#4ecdc4' },
  { id: 'semantic',  label: 'Semantic',  tech: 'Neo4j',        detail: 'Knowledge graph',    key: 'graphRelations',   color: '#a87ecf' },
  { id: 'episodic',  label: 'Episodic',  tech: 'SQLite',       detail: 'Temporal log',       key: null,               color: '#d4a853' },
  { id: 'working',   label: 'Working',   tech: 'Context',      detail: 'Active buffer',      key: 'workingMemory',    color: '#e07a38' },
];

function getActiveStage(traces, isLoading) {
  if (!isLoading || !traces?.length) return null;
  const last = traces[traces.length - 1];
  for (const s of STAGES) {
    if (s.phases.includes(last?.phase)) return s.id;
  }
  return null;
}

// 3D card tilt on mouse move
function tiltCard(e) {
  const el = e.currentTarget;
  const r  = el.getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
  const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
  el.style.setProperty('--tx', `${dy * -7}deg`);
  el.style.setProperty('--ty', `${dx *  7}deg`);
}

function resetTilt(e) {
  e.currentTarget.style.setProperty('--tx', '0deg');
  e.currentTarget.style.setProperty('--ty', '0deg');
}

function BrainProcess({ brainState, messageCount = 0 }) {
  const isActive   = brainState.isLoading;
  const activeId   = getActiveStage(brainState.traces, isActive);
  const traces     = (brainState.traces || []).slice(-6);
  const hasSparks  = brainState.sparks?.length > 0;
  const showIdle   = !isActive && traces.length === 0 && !brainState.reflection && !hasSparks;

  return (
    <div className="bp">

      {/* ── Section: Pipeline ── */}
      <section className="bp-section">
        <h3 className="bp-sh t-display">Neural Pipeline</h3>
        <div className={`bp-pipeline ${isActive ? 'running' : ''}`}>
          {STAGES.map((stage, i) => {
            const isThis = activeId === stage.id;
            const isDone = activeId && STAGES.findIndex(s => s.id === activeId) > i && isActive;
            return (
              <div key={stage.id} className="bp-stage-wrap">
                <div
                  className={`bp-stage ${isThis ? 'active' : ''} ${isDone ? 'done' : ''} ${isActive && !isThis ? 'dim' : ''}`}
                  style={{ '--clr': stage.color }}
                >
                  {isThis && <div className="bp-stage-aura" />}
                  <div className="bp-stage-badge" style={{ background: stage.color }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="bp-stage-body">
                    <div className="bp-stage-name">{stage.label}</div>
                    <div className="bp-stage-region t-label">{stage.region}</div>
                    <p className="bp-stage-desc">{stage.desc}</p>
                  </div>
                  {isDone && <div className="bp-stage-done">✓</div>}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`bp-arrow ${isActive ? 'pulse' : ''}`}>
                    <div className="bp-arrow-line" style={{ background: isActive ? STAGES[i].color : undefined }} />
                    <div className="bp-arrow-head" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section: Memory Architecture ── */}
      <section className="bp-section">
        <h3 className="bp-sh t-display">Memory Architecture</h3>
        <div className="bp-mem-grid scene-3d">
          {MEMORY_LAYERS.map(layer => (
            <div
              key={layer.id}
              className="bp-mem-card noisy"
              data-layer={layer.id}
              style={{ '--clr': layer.color }}
              onMouseMove={tiltCard}
              onMouseLeave={resetTilt}
            >
              <div className="bp-mem-shine" />
              <div className="bp-mem-top">
                <span className="bp-mem-name">{layer.label}</span>
                <span className="bp-mem-count" style={{ color: layer.color }}>
                  {layer.key
                    ? (brainState[layer.key] ?? 0)
                    : layer.id === 'episodic'
                      ? messageCount
                      : '—'}
                </span>
              </div>
              <div className="bp-mem-tech t-label">{layer.tech}</div>
              <div className="bp-mem-detail">{layer.detail}</div>
              <div className="bp-mem-bar" style={{ background: layer.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Internal monologue ── */}
      {brainState.reflection && (
        <section className="bp-section">
          <h3 className="bp-sh t-display">Internal Monologue</h3>
          <div className="bp-reflection">
            <span className="bp-ref-mark">"</span>
            <p>{brainState.reflection}</p>
          </div>
        </section>
      )}

      {/* ── Section: Live Trace ── */}
      {traces.length > 0 && (
        <section className="bp-section">
          <h3 className="bp-sh t-display">Cognitive Trace</h3>
          <div className="bp-traces">
            {traces.map((tr, i) => (
              <div key={i} className={`bp-trace ${tr.phase || ''}`}>
                <span className="bp-trace-ph t-label">{tr.phase || 'info'}</span>
                <span className="bp-trace-msg">{tr.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section: Neural Sparks ── */}
      {hasSparks && (
        <section className="bp-section">
          <h3 className="bp-sh t-display">Neural Sparks</h3>
          <p className="bp-spark-sub t-label">Background dreaming — spontaneous associations</p>
          <div className="bp-sparks">
            {brainState.sparks.slice(0, 3).map((s, i) => (
              <div key={i} className="bp-spark">
                <div className="bp-spark-tags">
                  {s.entities?.map(e => <span key={e} className="bp-spark-tag t-label">#{e}</span>)}
                </div>
                <p>{s.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Idle state ── */}
      {showIdle && (
        <div className="bp-idle">
          <div className="bp-idle-fig">
            <div className="bp-idle-r1" />
            <div className="bp-idle-r2" />
            <div className="bp-idle-r3" />
            <div className="bp-idle-dot" />
          </div>
          <p className="bp-idle-text">
            Send a message to watch <br />
            the cognitive process unfold live.
          </p>
          <div className="bp-idle-key">
            {STAGES.map(s => (
              <div key={s.id} className="bp-idle-row">
                <span className="bp-idle-pip" style={{ background: s.color }} />
                <span className="bp-idle-lbl t-label">{s.label} — {s.region}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainProcess;
