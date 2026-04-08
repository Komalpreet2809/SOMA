import { useState, useRef, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import './KnowledgeGraph.css';

function KnowledgeGraph({ highlightedNodes = [], currentPersona, isBackground = false }) {
  const fgRef = useRef();
  const containerRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [graphStatus, setGraphStatus] = useState('loading');
  const [showLabels, setShowLabels] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltipData, setTooltipData] = useState(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (isBackground) {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      } else if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isBackground]);

  // Fetch Graph Data
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setGraphStatus('loading');
    try {
      const res = await fetch(`/api/v1/graph?user_id=${currentPersona}`);
      const data = await res.json();

      if (data.status === 'offline') {
        setGraphStatus('offline');
        setGraphData({ nodes: [], links: [] });
        setStats({ nodes: 0, edges: 0 });
      } else if (data.nodes.length === 0) {
        setGraphStatus('empty');
        setGraphData({ nodes: [], links: [] });
        setStats({ nodes: 0, edges: 0 });
      } else {
        setGraphStatus('online');
        
        // Format for 3D Graph
        const formattedData = {
          nodes: data.nodes.map(n => ({
            id: n.id,
            label: n.label,
            connections: n.connections || 0,
            val: Math.max(1, (n.connections || 0) * 1.5) // Node visual size
          })),
          links: data.edges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.label
          }))
        };
        
        setGraphData(formattedData);
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
      }
    } catch (err) {
      console.error('Failed to fetch graph:', err);
      setGraphStatus('error');
      setGraphData({ nodes: [], links: [] });
    }
    setLoading(false);
  }, [currentPersona]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleNodeClick = useCallback(node => {
    if (fgRef.current) {
      // Aim at node from outside it
      const distance = 80;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        1500  // ms transition duration
      );
    }
  }, [fgRef]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className={`graph-container ${isBackground ? 'graph-bg-mode' : ''}`} ref={containerRef}>
      {/* Header Bar — hidden in background mode */}
      {!isBackground && (
      <div className="graph-header">
        <div className="graph-title">
          <div className="pulse-ring" />
          <h2>Neural Mesh Topology (3D)</h2>
          <span className="label-mono" style={{ fontSize: '0.55rem' }}>
            {graphStatus === 'online' ? 'LIVE' : graphStatus.toUpperCase()}
          </span>
        </div>
        <div className="graph-controls">
          <button
            className={`graph-btn ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(prev => !prev)}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button className="graph-btn" onClick={() => {
            if (fgRef.current) {
              fgRef.current.cameraPosition({ x: 0, y: 0, z: 250 }, { x: 0, y: 0, z: 0 }, 1000);
            }
          }}>
            Reset View
          </button>
          <button className="graph-btn" onClick={fetchGraph}>
            ↻ Refresh
          </button>
        </div>
      </div>
      )}

      {/* 3D Canvas Container */}
      {(graphStatus === 'online' || graphData.nodes.length > 0) && (
        <div className="graph-canvas-3d" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ForceGraph3D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            backgroundColor="rgba(0,0,0,0)" // Transparent to show CSS background
            
            // Nodes
            nodeLabel={showLabels ? "label" : ""}
            nodeColor={node => {
              if (highlightedNodes.includes(node.id) || highlightedNodes.includes(node.label)) {
                return 'rgba(240, 171, 252, 0.95)'; // Active impulse pink
              }
              return 'rgba(167, 139, 250, 0.85)'; // Dendrite violet
            }}
            nodeRelSize={4}
            nodeResolution={16}
            
            // Edges (Synapses) -> Particles
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={d => 0.005 + (0.002 * Math.random())} // Varying speed
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={() => 'rgba(240, 171, 252, 0.8)'} // Neural impulse pink
            
            // Edge line styling
            linkColor={() => 'rgba(167, 139, 250, 0.15)'}
            linkOpacity={0.4}
            linkWidth={0.8}

            // Interaction
            onNodeClick={handleNodeClick}
            enableNodeDrag={true}
          />
        </div>
      )}

      {/* Stats Overlay — hidden in background */}
      {!isBackground && graphStatus === 'online' && (
        <div className="graph-stats-overlay">
          <div className="stat-chip">
            Nodes<span className="stat-value">{stats.nodes}</span>
          </div>
          <div className="stat-chip">
            Edges<span className="stat-value purple">{stats.edges}</span>
          </div>
          <div className="stat-chip">
            Density<span className="stat-value">
              {stats.nodes > 1
                ? ((2 * stats.edges) / (stats.nodes * (stats.nodes - 1)) * 100).toFixed(1) + '%'
                : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Legend — hidden in background */}
      {!isBackground && graphStatus === 'online' && (
        <div className="graph-legend">
          <div className="legend-title">Legend</div>
          <div className="legend-item">
            <div className="legend-dot primary" style={{ background: 'rgba(71, 191, 255, 0.8)' }} />
            <span className="legend-label">Entity Node</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot secondary" style={{ background: 'rgba(134, 59, 255, 0.8)' }} />
            <span className="legend-label">Synaptic Flow (Particle)</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="graph-loading">
          <span className="loading-text">Scanning Neural Mesh...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && (graphStatus === 'empty' || graphStatus === 'offline' || graphStatus === 'error') && (
        <div className="graph-empty-state">
          <div className="empty-brain-icon">🧠</div>
          <div className="empty-title">
            {graphStatus === 'offline' ? 'Knowledge Graph Offline' :
             graphStatus === 'error' ? 'Connection Error' :
             'No Neural Pathways Detected'}
          </div>
          <div className="empty-subtitle">
            {graphStatus === 'offline'
              ? 'Neo4j database is not connected. Configure your credentials in .env to enable the semantic memory layer.'
              : graphStatus === 'error'
              ? 'Failed to reach the backend. Ensure the API server is running.'
              : 'Start chatting or ingest data to build the knowledge graph. Entities and relationships will appear here in real-time.'}
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeGraph;
