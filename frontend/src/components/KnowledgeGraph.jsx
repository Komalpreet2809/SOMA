import { useState, useRef, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import './KnowledgeGraph.css';

// Brain anatomy scaffold shown when Neo4j is empty / offline
const DEMO_GRAPH = {
  nodes: [
    { id: 'prefrontal',   label: 'Prefrontal Cortex',  connections: 5, isDemo: true, val: 8  },
    { id: 'hippocampus',  label: 'Hippocampus',         connections: 8, isDemo: true, val: 12 },
    { id: 'amygdala',     label: 'Amygdala',            connections: 4, isDemo: true, val: 6  },
    { id: 'neocortex',    label: 'Neocortex',           connections: 7, isDemo: true, val: 10 },
    { id: 'thalamus',     label: 'Thalamus',            connections: 9, isDemo: true, val: 14 },
    { id: 'cerebellum',   label: 'Cerebellum',          connections: 4, isDemo: true, val: 7  },
    { id: 'broca',        label: "Broca's Area",        connections: 3, isDemo: true, val: 5  },
    { id: 'wernicke',     label: "Wernicke's Area",     connections: 3, isDemo: true, val: 5  },
    { id: 'sensory_c',    label: 'Sensory Cortex',      connections: 5, isDemo: true, val: 7  },
    { id: 'motor_c',      label: 'Motor Cortex',        connections: 4, isDemo: true, val: 6  },
    { id: 'basal',        label: 'Basal Ganglia',       connections: 4, isDemo: true, val: 6  },
    { id: 'insula',       label: 'Insula',              connections: 3, isDemo: true, val: 5  },
  ],
  links: [
    { source: 'thalamus',    target: 'neocortex',   label: 'relays_signals'        },
    { source: 'thalamus',    target: 'prefrontal',  label: 'executive_relay'       },
    { source: 'thalamus',    target: 'sensory_c',   label: 'sensory_routing'       },
    { source: 'hippocampus', target: 'neocortex',   label: 'memory_consolidation'  },
    { source: 'hippocampus', target: 'amygdala',    label: 'emotional_memory'      },
    { source: 'hippocampus', target: 'prefrontal',  label: 'working_memory'        },
    { source: 'prefrontal',  target: 'amygdala',    label: 'emotional_regulation'  },
    { source: 'prefrontal',  target: 'motor_c',     label: 'motor_planning'        },
    { source: 'neocortex',   target: 'broca',       label: 'language_production'   },
    { source: 'neocortex',   target: 'wernicke',    label: 'language_comprehension'},
    { source: 'broca',       target: 'wernicke',    label: 'language_integration'  },
    { source: 'motor_c',     target: 'cerebellum',  label: 'motor_coordination'    },
    { source: 'cerebellum',  target: 'thalamus',    label: 'feedback_loop'         },
    { source: 'basal',       target: 'thalamus',    label: 'reward_circuit'        },
    { source: 'basal',       target: 'prefrontal',  label: 'decision_making'       },
    { source: 'insula',      target: 'amygdala',    label: 'interoception'         },
    { source: 'sensory_c',   target: 'neocortex',   label: 'sensory_processing'    },
  ],
};

function KnowledgeGraph({ highlightedNodes = [], currentPersona }) {
  const fgRef = useRef();
  const containerRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [graphStatus, setGraphStatus] = useState('loading');
  const [showLabels, setShowLabels] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setGraphStatus('loading');
    try {
      const res = await fetch(`/api/v1/graph?user_id=${currentPersona}`);
      const data = await res.json();

      if (data.status === 'offline' || data.nodes.length === 0) {
        // Show brain anatomy demo so the graph is never empty
        setIsDemo(true);
        setGraphStatus('demo');
        setGraphData(DEMO_GRAPH);
        setStats({ nodes: DEMO_GRAPH.nodes.length, edges: DEMO_GRAPH.links.length });
      } else {
        setIsDemo(false);
        setGraphStatus('online');
        const formatted = {
          nodes: data.nodes.map(n => ({
            id: n.id,
            label: n.label,
            connections: n.connections || 0,
            val: Math.max(2, (n.connections || 0) * 1.5),
          })),
          links: data.edges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.label,
          })),
        };
        setGraphData(formatted);
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
      }
    } catch {
      setIsDemo(true);
      setGraphStatus('demo');
      setGraphData(DEMO_GRAPH);
      setStats({ nodes: DEMO_GRAPH.nodes.length, edges: DEMO_GRAPH.links.length });
    }
    setLoading(false);
  }, [currentPersona]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const handleNodeClick = useCallback(node => {
    if (!fgRef.current) return;
    const distance = 80;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      1200
    );
  }, []);

  const getNodeColor = node => {
    if (highlightedNodes.includes(node.id) || highlightedNodes.includes(node.label)) {
      return 'rgba(240, 171, 252, 1)';
    }
    if (node.isDemo) {
      // Gradient from violet → cyan for demo anatomy nodes
      const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const hue = (hash * 37) % 60; // 0–60 → violet to indigo range
      return `hsla(${260 + hue}, 80%, 72%, 0.9)`;
    }
    return 'rgba(192, 132, 252, 0.9)';
  };

  const getLinkColor = () => isDemo
    ? 'rgba(130, 100, 220, 0.25)'
    : 'rgba(167, 139, 250, 0.2)';

  return (
    <div className="graph-container" ref={containerRef}>

      {/* Header */}
      <div className="graph-header">
        <div className="graph-title">
          <div className="pulse-ring" />
          <h2>Neural Mesh Topology</h2>
          <span className="label-mono graph-status-chip">
            {isDemo ? 'DEMO' : graphStatus === 'online' ? 'LIVE' : graphStatus.toUpperCase()}
          </span>
          {isDemo && (
            <span className="demo-badge">Brain Anatomy Template</span>
          )}
        </div>
        <div className="graph-controls">
          <button
            className={`graph-btn ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(p => !p)}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button className="graph-btn" onClick={() => {
            fgRef.current?.cameraPosition({ x: 0, y: 0, z: 280 }, { x: 0, y: 0, z: 0 }, 900);
          }}>
            Reset
          </button>
          <button className="graph-btn" onClick={fetchGraph}>↻</button>
        </div>
      </div>

      {/* 3D Canvas */}
      {graphData.nodes.length > 0 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ForceGraph3D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            backgroundColor="rgba(0,0,0,0)"

            nodeLabel={showLabels ? 'label' : ''}
            nodeColor={getNodeColor}
            nodeRelSize={5}
            nodeResolution={16}
            nodeOpacity={0.9}

            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={isDemo ? 1.5 : 2}
            linkDirectionalParticleColor={() => isDemo
              ? 'rgba(167, 139, 250, 0.7)'
              : 'rgba(240, 171, 252, 0.85)'}

            linkColor={getLinkColor}
            linkOpacity={isDemo ? 0.45 : 0.5}
            linkWidth={isDemo ? 0.6 : 0.9}

            onNodeClick={handleNodeClick}
            enableNodeDrag={true}
          />
        </div>
      )}

      {/* Stats overlay */}
      <div className="graph-stats-overlay">
        <div className="stat-chip">
          Nodes<span className="stat-value">{stats.nodes}</span>
        </div>
        <div className="stat-chip">
          Edges<span className="stat-value purple">{stats.edges}</span>
        </div>
        <div className="stat-chip">
          Density
          <span className="stat-value">
            {stats.nodes > 1
              ? ((2 * stats.edges) / (stats.nodes * (stats.nodes - 1)) * 100).toFixed(1) + '%'
              : '—'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(192, 132, 252, 0.9)' }} />
          <span className="legend-label">{isDemo ? 'Brain Region' : 'Entity Node'}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(240, 171, 252, 0.9)' }} />
          <span className="legend-label">Active Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(167, 139, 250, 0.7)', borderRadius: '2px', width: '16px', height: '4px' }} />
          <span className="legend-label">Synaptic Flow</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="graph-loading">
          <span className="loading-text">Scanning Neural Mesh...</span>
        </div>
      )}
    </div>
  );
}

export default KnowledgeGraph;
