import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import './KnowledgeGraph.css';

const FALLBACK_GRAPH = {
  center: 'Transformer Models',
  nodes: [
    { label: 'Attention Mechanism', tone: 'orange' },
    { label: 'Long-range Dependencies', tone: 'orange' },
    { label: 'Efficiency', tone: 'green' },
    { label: 'Expressivity', tone: 'orange' },
    { label: 'Sparse Patterns', tone: 'orange' },
    { label: 'Recurrence', tone: 'orange' }
  ]
};

const POSITIONS = [
  { x: 50, y: 15 }, // Top
  { x: 80, y: 35 }, // Top Right
  { x: 80, y: 65 }, // Bottom Right
  { x: 50, y: 85 }, // Bottom
  { x: 20, y: 65 }, // Bottom Left
  { x: 20, y: 35 }, // Top Left
];

function KnowledgeGraph({ refreshTick }) {
  const [graph, setGraph] = useState(FALLBACK_GRAPH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/graph');
        if (!res.ok) { setLoading(false); return; }
        
        const data = await res.json();
        const labels = Array.from(new Set((data.nodes || []).map(n => n.label || n.id).filter(Boolean)));
        
        if (labels.length > 0) {
          const [center, ...rest] = labels;
          const nodes = rest.slice(0, 6).map(l => ({
            label: l,
            tone: l.toLowerCase().includes('efficiency') ? 'green' : 'orange'
          }));
          while (nodes.length < 6) {
            nodes.push(FALLBACK_GRAPH.nodes[nodes.length]);
          }
          setGraph({ center, nodes });
        }
      } catch (error) {
        console.error('Graph fetch failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [refreshTick]);

  return (
    <div className="graph-stage fade-in">
      <div className="graph-toolbar">
        <button className="graph-select">
          <span>Concept Map</span>
          <span className="material-icons">expand_more</span>
        </button>
        <div className="graph-actions">
          <button className="graph-icon-button"><span className="material-icons">open_in_full</span></button>
          <button className="graph-icon-button"><span className="material-icons">fit_screen</span></button>
        </div>
      </div>

      <div className="graph-network">
        <svg viewBox="0 0 100 100" className="graph-links">
          {POSITIONS.map((pos, i) => (
            <line key={i} x1="50" y1="50" x2={pos.x} y2={pos.y} />
          ))}
          {POSITIONS.map((pos, i) => {
            const next = POSITIONS[(i + 1) % POSITIONS.length];
            return <line key={`r-${i}`} x1={pos.x} y1={pos.y} x2={next.x} y2={next.y} className="ring-line" />;
          })}
        </svg>

        <div className="graph-node graph-center">
          <div className="graph-node-core">∿</div>
          <strong>{graph.center}</strong>
        </div>

        {graph.nodes.map((node, i) => {
          const pos = POSITIONS[i];
          return (
            <div 
              key={i} 
              className={`graph-node graph-orbit ${node.tone}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="graph-node-dot" />
              <strong>{node.label}</strong>
            </div>
          );
        })}
        
        {loading && <div className="graph-loading" style={{ position: 'absolute', bottom: '10px', fontSize: '0.7rem' }}>Refreshing graph...</div>}
      </div>

      <div className="graph-legend">
        <span className="legend-item concept">Concept</span>
        <span className="legend-item method">Method</span>
        <span className="legend-item metric">Metric</span>
        <span className="legend-item relationship">Relationship</span>
        <span className="legend-item entity">Entity</span>
      </div>
    </div>
  );
}

export default KnowledgeGraph;
