import { useEffect, useState, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { apiFetch } from '../api';
import './KnowledgeGraph.css';

// Stunning conceptual mock graph representing SOMA's cognitive architecture
const MOCK_GRAPH = {
  nodes: [
    { id: 'SOMA', label: 'SOMA (Core)', connections: 10, type: 'core' },
    { id: 'Cortex', label: 'Cortex Layer', connections: 8, type: 'core' },
    { id: 'Thalamus', label: 'Thalamus (Routing)', connections: 6, type: 'entity' },
    { id: 'Hippocampus', label: 'Hippocampus', connections: 7, type: 'entity' },
    { id: 'Neocortex', label: 'Neocortex', connections: 6, type: 'entity' },
    { id: 'Sensory Cortex', label: 'Sensory Cortex', connections: 4, type: 'concept' },
    { id: 'Working Memory', label: 'Working Memory', connections: 5, type: 'concept' },
    { id: 'Episodic Memory', label: 'Episodic Memory', connections: 4, type: 'concept' },
    { id: 'Sleep Cycle', label: 'Sleep Cycle', connections: 3, type: 'method' },
    { id: 'Neural Inscription', label: 'Inscription Layer', connections: 3, type: 'method' },
    { id: 'Llama 3.1', label: 'Llama 3.1', connections: 3, type: 'metric' },
    { id: 'Groq API', label: 'Groq API', connections: 2, type: 'metric' }
  ],
  links: [
    { source: 'SOMA', target: 'Cortex', label: 'ORCHESTRATES' },
    { source: 'SOMA', target: 'Neural Inscription', label: 'ACCEPTS' },
    { source: 'Cortex', target: 'Thalamus', label: 'ROUTES_BY' },
    { source: 'Cortex', target: 'Hippocampus', label: 'CONSOLIDATES' },
    { source: 'Cortex', target: 'Neocortex', label: 'STORES_IN' },
    { source: 'Sensory Cortex', target: 'Hippocampus', label: 'WRITES_TO' },
    { source: 'Working Memory', target: 'Thalamus', label: 'SYNCS_WITH' },
    { source: 'Episodic Memory', target: 'Hippocampus', label: 'LOGS_IN' },
    { source: 'Sleep Cycle', target: 'Hippocampus', label: 'OPTIMIZES' },
    { source: 'Sleep Cycle', target: 'Neocortex', label: 'REINFORCES' },
    { source: 'Cortex', target: 'Llama 3.1', label: 'COMPUTES' },
    { source: 'Llama 3.1', target: 'Groq API', label: 'HOSTED_ON' }
  ]
};

function KnowledgeGraph({ refreshTick }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [stats, setStats] = useState({ node_count: 0, edge_count: 0, top_entities: [] });
  const [physicsActive, setPhysicsActive] = useState(true);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  
  const containerRef = useRef(null);
  const fgRef = useRef();

  // Measure container dimensions to auto-resize the canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const isMobile = window.innerWidth < 768;
        const adjustedWidth = isMobile ? (window.innerWidth - 32) : width;
        const adjustedHeight = isMobile ? 700 : height;
        setDimensions({ width: adjustedWidth || 800, height: adjustedHeight || 500 });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch graph database from backend
  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/graph');
      if (!res.ok) {
        throw new Error('Graph fetch returned unhealthy status');
      }
      
      const data = await res.json();
      
      if (data.status === 'offline' || data.status === 'error') {
        setDbStatus(data.status || 'offline');
        setGraphData({ nodes: [], links: [] });
      } else {
        setDbStatus('online');
        if (!data.nodes || data.nodes.length === 0) {
          setGraphData({ nodes: [], links: [] });
        } else {
          const nodes = data.nodes.map(n => ({
            id: n.id,
            label: n.label || n.id,
            connections: n.connections || 1,
            type: 'entity'
          }));
          
          const links = data.edges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.label || 'RELATED_TO'
          }));
          
          setGraphData({ nodes, links });
        }
      }
    } catch (error) {
      console.error('Graph fetch failed', error);
      setDbStatus('offline');
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/v1/graph/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'online') {
          setStats(data);
        }
      }
    } catch (err) {
      console.error('Stats fetch failed', err);
    }
  };

  useEffect(() => {
    fetchGraph();
    fetchStats();
  }, [refreshTick]);

  // Physics force configurations to pull the neural cluster into a tight, brain-like shape
  useEffect(() => {
    if (fgRef.current) {
      const d3Force = fgRef.current.d3Force;
      if (d3Force) {
        d3Force('charge').strength(-20).distanceMax(100);
        d3Force('link').distance(30);
        
        // Custom gravity force to pull unconnected clusters to the center
        d3Force('gravity', (alpha) => {
          graphData.nodes.forEach(node => {
            node.vx = (node.vx || 0) + (0 - node.x) * 0.05 * alpha;
            node.vy = (node.vy || 0) + (0 - node.y) * 0.05 * alpha;
            node.vz = (node.vz || 0) + (0 - node.z) * 0.05 * alpha;
          });
        });
      }
      
      // Auto-fit camera with appropriate padding to ensure complete visibility
      setTimeout(() => {
        if (window.innerWidth < 768) {
          // Shift camera down on mobile to make objects at (0,0,0) appear higher (reduced shift)
          fgRef.current.cameraPosition({ x: 0, y: -80, z: 300 }, { x: 0, y: -80, z: 0 }, 600);
        } else {
          const padding = 20;
          fgRef.current.zoomToFit(800, padding);
        }
      }, 600);
    }
  }, [graphData]);

  // Calculate max connections dynamically to scale color thresholds
  const maxConnections = graphData.nodes && graphData.nodes.length > 0
    ? Math.max(...graphData.nodes.map(n => n.connections || 1), 1)
    : 1;

  // Color mapper based on node type & degree
  const getNodeColor = (node) => {
    if (node.id === 'SOMA') return '#ff6b35'; // Core Hub is SOMA Orange
    
    // For offline/mock mode, retain the pre-assigned structural category colors
    if (dbStatus !== 'online') {
      if (node.type === 'core') return '#ff6b35'; // Orange
      if (node.type === 'method') return '#ff8b54'; // Soft Orange
      if (node.type === 'concept') return '#ffa67c'; // Pale Orange
      if (node.type === 'metric') return '#a3a3a3'; // Neutral Grey
      return '#737373'; // Darker Grey
    }
    
    // For live Neo4j data, dynamically scale colors based on relative synaptic density!
    const connections = node.connections || 1;
    const ratio = connections / maxConnections;
    
    if (ratio >= 0.8) return '#ff6b35'; // High centrality (Orange)
    if (ratio >= 0.4) return '#ff9c7a'; // Medium centrality (Soft Orange)
    return '#a3a3a3'; // Low centrality (Silver/Grey)
  };

  return (
    <div className="graph-stage fade-in">
      <div className="graph-toolbar">
        <div className="graph-title-block">
          <button className="graph-select">
            <span className="material-icons">hub</span>
            <span>{dbStatus === 'online' ? 'Real-time 3D Neo4j Graph' : '3D SOMA Cognitive Memory Mesh'}</span>
          </button>
          {dbStatus !== 'online' && (
            <span className="db-status-badge warning pulse">
              <span className="dot" />
              Neo4j Database Offline
            </span>
          )}
          {dbStatus === 'online' && (
            <span className="db-status-badge success">
              <span className="dot" />
              Neo4j Synchronized (Live)
            </span>
          )}
        </div>


      </div>

      <div className="graph-network-container" ref={containerRef}>
        {/* Live Telemetry HUD Overlay */}
        <div className="graph-hud-overlay">
          <div className="hud-panel">
            <div className="hud-header" style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span className="material-icons">analytics</span>
                <span>Semantic Telemetry</span>
              </div>
              <span className="material-icons" style={{cursor: 'pointer', fontSize: '20px', color: '#ff6b35'}} onClick={() => setHudCollapsed(!hudCollapsed)}>
                {hudCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </div>
            {!hudCollapsed && (
              <>
                <div className="hud-row">
                  <span className="hud-label">Nodes:</span>
                  <span className="hud-value">{dbStatus === 'online' ? stats.node_count : graphData.nodes.length}</span>
                </div>
                <div className="hud-row">
                  <span className="hud-label">Synapses:</span>
                  <span className="hud-value">{dbStatus === 'online' ? stats.edge_count : graphData.links.length}</span>
                </div>
                <div className="hud-row">
                  <span className="hud-label">Storage:</span>
                  <span className="hud-value status-glow">{dbStatus === 'online' ? 'LTM (Neo4j)' : 'STM (Cache)'}</span>
                </div>
              </>
            )}
          </div>
          
          {!hudCollapsed && dbStatus === 'online' && stats.top_entities && stats.top_entities.length > 0 && (
            <div className="hud-panel top-entities">
              <div className="hud-header">
                <span className="material-icons">star</span>
                <span>Primary Hubs</span>
              </div>
              <div className="hud-entity-list">
                {stats.top_entities.map((ent, idx) => (
                  <div key={idx} className="hud-entity-row">
                    <span className="entity-rank">#{idx+1}</span>
                    <span className="entity-name">{ent.entity}</span>
                    <span className="entity-connections">{ent.connections} rx</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0, 0, 0, 0)" // Glassmorphic translucent rendering
          
          // Render gorgeous glowing 3D spheres with emissive materials (100% stable!)
          nodeThreeObject={node => {
            const size = Math.max(3.2, Math.min(node.connections * 1.6, 9.5)); // Perfectly scaled spheres
            const geom = new THREE.SphereGeometry(size, 24, 24);
            const mat = new THREE.MeshLambertMaterial({
              color: getNodeColor(node),
              transparent: true,
              opacity: 0.95,
              emissive: getNodeColor(node),
              emissiveIntensity: 0.45
            });
            return new THREE.Mesh(geom, mat);
          }}
          
          // Outlined holographic label rendered natively floating beside cursor on hover (100% stable!)
          nodeLabel={node => `
            <span style="color: ${getNodeColor(node)}; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
              ${node.label || node.id}
            </span>
          `}
          
          // Outlined relationship tag rendered on link hover (100% stable!)
          linkLabel={link => `
            <span style="color: #ff6b35; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
              ${link.label || 'RELATED_TO'}
            </span>
          `}
          
          nodeRelSize={3}
          linkColor={() => 'rgba(255, 107, 53, 0.25)'} // Soft, clean axon link fibers
          linkWidth={1.8} // Sleek link line thickness
          
          // Glowing Thought Flows (sliding directional particles along axons)
          linkDirectionalParticles={3}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={() => '#ff6b35'}
          
          showNavInfo={false}
          enablePointerInteraction={true}
          enableNodeDrag={true}
        />
        
        {graphData.nodes.length === 0 && !loading && (
          <div className="graph-empty-state">
            <span className="material-icons empty-icon pulse">bubble_chart</span>
            <h3>Neural Mesh Empty</h3>
            <p>
              Your cognitive space is completely clean. Start chatting with SOMA or submit a sensory inscription to build your memory graph!
            </p>
          </div>
        )}

        {/* Legend removed per user request */}

        {loading && (
          <div className="graph-loading">
            <span className="material-icons pulse">refresh</span>
            <span>Synchronizing cognitive mesh...</span>
          </div>
        )}

        <div className="graph-actions">
          <button 
            className="graph-icon-button" 
            onClick={() => {
              if (fgRef.current) fgRef.current.zoomToFit(600, 20);
            }}
            title="Recenter Camera"
          >
            <span className="material-icons">zoom_out_map</span>
          </button>
          <button 
            className="graph-icon-button" 
            onClick={() => {
              if (fgRef.current) {
                const currentPos = fgRef.current.cameraPosition();
                fgRef.current.cameraPosition(
                  { x: currentPos.x * 0.75, y: currentPos.y * 0.75, z: currentPos.z * 0.75 },
                  null,
                  300
                );
              }
            }}
            title="Zoom In"
          >
            <span className="material-icons">zoom_in</span>
          </button>
          <button 
            className="graph-icon-button" 
            onClick={() => {
              if (fgRef.current) {
                const currentPos = fgRef.current.cameraPosition();
                fgRef.current.cameraPosition(
                  { x: currentPos.x * 1.35, y: currentPos.y * 1.35, z: currentPos.z * 1.35 },
                  null,
                  300
                );
              }
            }}
            title="Zoom Out"
          >
            <span className="material-icons">zoom_out</span>
          </button>
          <button 
            className="graph-icon-button" 
            onClick={() => {
              const newActive = !physicsActive;
              setPhysicsActive(newActive);
              if (fgRef.current) {
                if (physicsActive) {
                  fgRef.current.d3PauseSimulation();
                } else {
                  fgRef.current.d3ResumeSimulation();
                }
              }
            }}
            title={physicsActive ? "Pause Simulation" : "Resume Simulation"}
          >
            <span className="material-icons">{physicsActive ? "pause" : "play_arrow"}</span>
          </button>
          <button 
            className="graph-icon-button" 
            onClick={() => {
              fetchGraph();
              fetchStats();
            }}
            title="Sync Mesh"
          >
            <span className="material-icons">sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeGraph;
