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

function KnowledgeGraph({ highlightedNodes = [], currentPersona, refreshTick }) {
  const fgRef = useRef();
  const containerRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [graphStatus, setGraphStatus] = useState('loading');
  const [showLabels, setShowLabels] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [pulsingNodes, setPulsingNodes] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        // Recenter after resize so nodes don't drift off-screen
        setTimeout(() => fgRef.current?.zoomToFit(400, 80), 300);
      }
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
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
    // Recenter camera once force simulation has settled
    setTimeout(() => fgRef.current?.zoomToFit(400, 80), 1200);
  }, [currentPersona]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // Re-fetch when a chat completes (refreshTick incremented by App)
  useEffect(() => {
    if (refreshTick > 0) fetchGraph();
  }, [refreshTick, fetchGraph]);

  // Pulse nodes that were retrieved, then clear after 2.5 s
  useEffect(() => {
    if (!highlightedNodes.length) return;
    setPulsingNodes(highlightedNodes);
    const t = setTimeout(() => setPulsingNodes([]), 2500);
    return () => clearTimeout(t);
  }, [highlightedNodes]);

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
    // Currently pulsing (retrieved during last query) — bright fire
    if (pulsingNodes.includes(node.id) || pulsingNodes.includes(node.label)) {
      return 'rgba(255, 140, 60, 1)';
    }
    // Highlighted (still active) — fire
    if (highlightedNodes.includes(node.id) || highlightedNodes.includes(node.label)) {
      return 'rgba(224, 122, 56, 1)';
    }
    if (node.isDemo) {
      const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const hue = (hash * 41) % 80;
      return hue < 40
        ? `hsla(${38 + hue * 0.4}, 75%, 60%, 0.9)`
        : `hsla(${175 + hue * 0.3}, 60%, 55%, 0.9)`;
    }
    return 'rgba(212, 168, 83, 0.85)';  // amber
  };

  const getLinkColor = () => isDemo
    ? 'rgba(212, 168, 83, 0.18)'
    : 'rgba(212, 168, 83, 0.22)';

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
        </div>
        <div className="graph-controls">
          <button
            className={`graph-btn ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(p => !p)}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button className="graph-btn" onClick={() => {
            fgRef.current?.zoomToFit(600, 80);
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
            nodeVal={node =>
              (pulsingNodes.includes(node.id) || pulsingNodes.includes(node.label))
                ? (node.val || 5) * 2.2
                : (node.val || 5)
            }
            nodeRelSize={5}
            nodeResolution={16}
            nodeOpacity={0.9}

            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={isDemo ? 1.5 : 2}
            linkDirectionalParticleColor={() => isDemo
              ? 'rgba(212, 168, 83, 0.8)'
              : 'rgba(224, 122, 56, 0.9)'}

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
          <div className="legend-dot" style={{ background: 'rgba(212, 168, 83, 0.9)' }} />
          <span className="legend-label">{isDemo ? 'Brain Region' : 'Entity Node'}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(255, 140, 60, 1)' }} />
          <span className="legend-label">Active / Retrieved</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(212, 168, 83, 0.6)', borderRadius: '2px', width: '16px', height: '4px' }} />
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
