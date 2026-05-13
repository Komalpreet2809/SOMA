import { useMemo, useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import './CognitiveFlow.css';

const STAGES = [
  { key: 'perception', title: 'Perception', region: 'Sensory Cortex', color: '#4d9fff', x: -170, y: 10, z: 0, desc: 'Captures raw language input.' },
  { key: 'attention', title: 'Attention', region: 'Thalamus', color: '#14b8a6', x: -115, y: 55, z: 20, desc: 'Scores salience and directs focus.' },
  { key: 'emotion', title: 'Emotion', region: 'Amygdala', color: '#ef4444', x: -110, y: -60, z: 15, desc: 'Flags emotional intensity when present.' },
  { key: 'routing', title: 'Routing', region: 'Thalamus', color: '#22c55e', x: -55, y: 5, z: 25, desc: 'Routes the signal to memory and reasoning systems.' },
  { key: 'prediction', title: 'Prediction', region: 'Prefrontal Cortex', color: '#8b5cf6', x: -5, y: 65, z: 30, desc: 'Forms an early expectation about user intent.' },
  { key: 'working_memory', title: 'Working Memory', region: 'Working Memory', color: '#64748b', x: -10, y: -65, z: -20, desc: 'Loads recent conversational context.' },
  { key: 'reflection', title: 'Reflection', region: 'Prefrontal Cortex', color: '#a855f7', x: 45, y: 55, z: 25, desc: 'Builds an internal intent map.' },
  { key: 'recall', title: 'Recall', region: 'Hippocampus', color: '#10b981', x: 35, y: -55, z: -15, desc: 'Retrieves vector memories from past exchanges.' },
  { key: 'inhibition', title: 'Inhibition', region: 'Thalamus', color: '#f97316', x: 90, y: -15, z: 10, desc: 'Suppresses weak or low-salience recalls.' },
  { key: 'association', title: 'Association', region: 'Neocortex', color: '#f59e0b', x: 105, y: 55, z: 15, desc: 'Traverses semantic links in the knowledge graph.' },
  { key: 'reasoning', title: 'Reasoning', region: 'Prefrontal Cortex', color: '#ec4899', x: 155, y: 5, z: 0, desc: 'Integrates memory and intent into a response plan.' },
  { key: 'language', title: 'Language', region: 'Language Cortex', color: '#f43f5e', x: 205, y: 45, z: 20, desc: 'Turns the response plan into language.' },
  { key: 'memory', title: 'Writeback', region: 'Memory Consolidation', color: '#64748b', x: 205, y: -55, z: -20, desc: 'Writes the exchange into episodic and sensory memory.' },
  { key: 'graph', title: 'Graph Update', region: 'Neocortex', color: '#06b6d4', x: 250, y: -5, z: 15, desc: 'Encodes new semantic links into the graph.' },
];

const LINKS = [
  { source: 'perception', target: 'attention' },
  { source: 'attention', target: 'routing' },
  { source: 'attention', target: 'emotion' },
  { source: 'routing', target: 'prediction' },
  { source: 'routing', target: 'working_memory' },
  { source: 'prediction', target: 'reflection' },
  { source: 'working_memory', target: 'recall' },
  { source: 'reflection', target: 'recall' },
  { source: 'recall', target: 'inhibition' },
  { source: 'inhibition', target: 'association' },
  { source: 'association', target: 'reasoning' },
  { source: 'reasoning', target: 'language' },
  { source: 'language', target: 'memory' },
  { source: 'memory', target: 'graph' },
];

function getActiveStage(brainState) {
  const lastBrainEvent = brainState.brainEvents?.[brainState.brainEvents.length - 1];
  const lastTrace = brainState.traces?.[brainState.traces.length - 1];

  if (lastBrainEvent?.phase) return lastBrainEvent.phase;
  if (brainState.isLoading && brainState.reflection && !brainState.traces.some((trace) => trace.phase === 'recall')) {
    return 'reflection';
  }
  return lastTrace?.phase || (brainState.currentQuery ? 'perception' : null);
}

function CognitiveFlow({ brainState }) {
  const fgRef = useRef();
  const activeStage = getActiveStage(brainState);
  const activeBrainEvent = brainState.brainEvents?.[brainState.brainEvents.length - 1] || null;

  const graphData = useMemo(() => ({
    nodes: STAGES.map((stage) => ({
      ...stage,
      id: stage.key,
      val: stage.key === activeStage ? Math.max(7, Math.round((activeBrainEvent?.activation || 70) / 10)) : 3,
    })),
    links: LINKS
  }), [activeBrainEvent?.activation, activeStage]);

  useEffect(() => {
    if (activeStage && fgRef.current) {
      const node = STAGES.find((stage) => stage.key === activeStage);
      if (node) {
        fgRef.current.cameraPosition(
          { x: node.x * 1.4, y: node.y * 1.4, z: 260 },
          { x: node.x, y: node.y, z: node.z },
          1500
        );
      }
    } else if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 540 }, { x: 30, y: 0, z: 0 }, 1800);
    }
  }, [activeStage]);

  const activeNode = STAGES.find((stage) => stage.key === activeStage);

  return (
    <div className="cf-3d-container">
      <div className="cf-3d-viz">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel={node => `${node.title} — ${node.region}`}
          nodeColor={node => node.id === activeStage ? '#ffffff' : node.color}
          nodeRelSize={4}
          linkColor={() => 'rgba(255,255,255,0.15)'}
          linkWidth={1.5}
          linkDirectionalParticles={node => node.source.id === activeStage || node.target.id === activeStage ? 6 : 0}
          linkDirectionalParticleSpeed={0.01}
          linkDirectionalParticleWidth={3}
          showNavInfo={false}
          enablePointerInteraction={true}
          enableNodeDrag={false}
        />
      </div>

      <div className="cf-3d-overlay">
        <div className="cf-stage-card panel-glass">
          <span className="t-label">Active Neural Process</span>
          <h3>{activeNode?.title || 'System Latent'}</h3>
          <p className="stage-loc">{activeBrainEvent?.region_label || activeNode?.region || 'Standing by...'}</p>
          <p className="stage-desc">{activeBrainEvent?.reason || activeNode?.desc || 'Waiting for synaptic trigger (user message).'}</p>
        </div>

        <div className="cf-3d-metrics">
          <div className="mini-stat">
            <span className="t-label">Stage</span>
            <span className="m-val">{activeStage || 'IDLE'}</span>
          </div>
          <div className="mini-stat">
            <span className="t-label">Region</span>
            <span className="m-val">{activeBrainEvent?.region_label || 'DORMANT'}</span>
          </div>
          <div className="mini-stat">
            <span className="t-label">Activation</span>
            <span className="m-val">{activeBrainEvent?.activation ?? 0}%</span>
          </div>
          <div className="mini-stat">
            <span className="t-label">Events</span>
            <span className="m-val">{brainState.brainEvents?.length || 0}</span>
          </div>
        </div>

        {brainState.reflection && (
          <div className="cf-reflection-toast panel-glass">
            <span className="t-label">Internal Reflection</span>
            <p>{brainState.reflection}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CognitiveFlow;
