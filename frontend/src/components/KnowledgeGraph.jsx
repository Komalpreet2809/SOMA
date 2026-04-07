import { useState, useRef, useEffect, useCallback } from 'react';
import './KnowledgeGraph.css';

/* ================================================================
   KnowledgeGraph — Canvas-based Force-Directed Graph Visualizer
   Zero external dependencies. Pure physics simulation on <canvas>.
   ================================================================ */

// ── Physics Constants ───────────────────────────────────────────
const REPULSION   = 12000;  // Coulomb repulsion between nodes
const ATTRACTION  = 0.005;  // Spring attraction along edges
const DAMPING     = 0.90;   // Velocity damping per frame
const CENTER_PULL = 0.004;  // Gravity toward canvas center
const MIN_DIST    = 90;     // Min distance before repulsion caps
const DT          = 0.8;    // Simulation timestep

// ── Visual Constants ────────────────────────────────────────────
const NODE_BASE_RADIUS  = 6;
const NODE_SCALE_FACTOR = 2.5;
const NODE_MAX_RADIUS   = 22;
const EDGE_WIDTH        = 0.8;
const LABEL_FONT        = '600 9px "JetBrains Mono", monospace';
const EDGE_LABEL_FONT   = '500 7px "JetBrains Mono", monospace';

// ── Color Palette ───────────────────────────────────────────────
const COLORS = {
  nodeFill:       'rgba(71, 191, 255, 0.9)',
  nodeGlow:       'rgba(71, 191, 255, 0.35)',
  nodeStroke:     'rgba(71, 191, 255, 0.6)',
  nodeHover:      'rgba(71, 191, 255, 1)',
  nodeHoverGlow:  'rgba(71, 191, 255, 0.6)',
  edgeLine:       'rgba(134, 59, 255, 0.25)',
  edgeHover:      'rgba(134, 59, 255, 0.55)',
  edgeLabel:      'rgba(134, 59, 255, 0.5)',
  labelText:      'rgba(224, 224, 224, 0.85)',
  labelDim:       'rgba(224, 224, 224, 0.4)',
  bg:             '#080808',
  gridLine:       'rgba(255, 255, 255, 0.03)',
  particleColor:  'rgba(71, 191, 255, 0.6)',
};


function KnowledgeGraph() {
  const canvasRef      = useRef(null);
  const animFrameRef   = useRef(null);
  const nodesRef       = useRef([]);
  const edgesRef       = useRef([]);
  const particlesRef   = useRef([]);
  const dragNodeRef    = useRef(null);
  const hoverNodeRef   = useRef(null);
  const panRef         = useRef({ x: 0, y: 0 });
  const zoomRef        = useRef(1);
  const mouseRef       = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const isDraggingRef  = useRef(false);
  const isPanningRef   = useRef(false);
  const panStartRef    = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const showLabelsRef  = useRef(true);

  const [graphData, setGraphData]     = useState({ nodes: [], edges: [] });
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({ nodes: 0, edges: 0 });
  const [graphStatus, setGraphStatus] = useState('loading');
  const [showLabels, setShowLabels]   = useState(true);
  const [tooltipData, setTooltipData] = useState(null);

  // ── Fetch Graph Data ────────────────────────────────────────
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setGraphStatus('loading');
    try {
      const res = await fetch('/api/v1/graph');
      const data = await res.json();

      if (data.status === 'offline') {
        setGraphStatus('offline');
        setGraphData({ nodes: [], edges: [] });
        setStats({ nodes: 0, edges: 0 });
      } else if (data.nodes.length === 0) {
        setGraphStatus('empty');
        setGraphData({ nodes: [], edges: [] });
        setStats({ nodes: 0, edges: 0 });
      } else {
        setGraphStatus('online');
        setGraphData(data);
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
        initializePhysics(data);
      }
    } catch (err) {
      console.error('Failed to fetch graph:', err);
      setGraphStatus('error');
      setGraphData({ nodes: [], edges: [] });
    }
    setLoading(false);
  }, []);

  // ── Initialize Physics Nodes ────────────────────────────────
  const initializePhysics = useCallback((data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    // Spread nodes in a circle around center
    const angleStep = (2 * Math.PI) / Math.max(data.nodes.length, 1);
    const spread = Math.min(cx, cy) * 0.5;

    nodesRef.current = data.nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      connections: n.connections || 0,
      x: cx + Math.cos(angleStep * i) * spread * (0.5 + Math.random() * 0.5),
      y: cy + Math.sin(angleStep * i) * spread * (0.5 + Math.random() * 0.5),
      vx: 0,
      vy: 0,
      radius: Math.min(NODE_BASE_RADIUS + (n.connections || 0) * NODE_SCALE_FACTOR, NODE_MAX_RADIUS),
    }));

    edgesRef.current = data.edges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label,
    }));

    // Initialize edge particles
    particlesRef.current = edgesRef.current.map(() => ({
      t: Math.random(),  // position along edge [0, 1]
      speed: 0.002 + Math.random() * 0.003,
    }));

    // Center the view
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
  }, []);

  // ── Physics Step ────────────────────────────────────────────
  const physicsStep = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    // Node-node repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_DIST) dist = MIN_DIST;

        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        nodes[i].vx -= fx * DT;
        nodes[i].vy -= fy * DT;
        nodes[j].vx += fx * DT;
        nodes[j].vy += fy * DT;
      }
    }

    // Edge attraction (spring)
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    for (const edge of edges) {
      const src = nodeMap[edge.source];
      const tgt = nodeMap[edge.target];
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      const force = ATTRACTION * dist;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      src.vx += fx * DT;
      src.vy += fy * DT;
      tgt.vx -= fx * DT;
      tgt.vy -= fy * DT;
    }

    // Center gravity + velocity integration
    for (const node of nodes) {
      if (dragNodeRef.current && node.id === dragNodeRef.current.id) continue;

      node.vx += (cx - node.x) * CENTER_PULL * DT;
      node.vy += (cy - node.y) * CENTER_PULL * DT;

      node.vx *= DAMPING;
      node.vy *= DAMPING;

      node.x += node.vx;
      node.y += node.vy;
    }

    // Advance particles
    particlesRef.current.forEach(p => {
      p.t += p.speed;
      if (p.t > 1) p.t -= 1;
    });
  }, []);

  // ── Render Frame ────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const particles = particlesRef.current;
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    const zoom = zoomRef.current;
    const pan = panRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Draw subtle grid
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const gridSize = 40;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5 / zoom;
    const startX = -pan.x / zoom - 200;
    const endX = (W - pan.x) / zoom + 200;
    const startY = -pan.y / zoom - 200;
    const endY = (H - pan.y) / zoom + 200;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // ── Draw Edges ──────────────────────────────────────
    edges.forEach((edge, idx) => {
      const src = nodeMap[edge.source];
      const tgt = nodeMap[edge.target];
      if (!src || !tgt) return;

      const isHovered = hoverNodeRef.current &&
        (edge.source === hoverNodeRef.current.id || edge.target === hoverNodeRef.current.id);

      // Edge line
      const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
      if (isHovered) {
        grad.addColorStop(0, 'rgba(71, 191, 255, 0.5)');
        grad.addColorStop(1, 'rgba(134, 59, 255, 0.5)');
      } else {
        grad.addColorStop(0, 'rgba(71, 191, 255, 0.12)');
        grad.addColorStop(1, COLORS.edgeLine);
      }

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = isHovered ? 1.5 / zoom : EDGE_WIDTH / zoom;
      ctx.stroke();

      // Edge particle
      if (particles[idx]) {
        const p = particles[idx];
        const px = src.x + (tgt.x - src.x) * p.t;
        const py = src.y + (tgt.y - src.y) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, (isHovered ? 2.5 : 1.5) / zoom, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.particleColor;
        ctx.fill();
      }

      // Edge label (only when hovered or labels enabled)
      if (isHovered && showLabelsRef.current) {
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        ctx.font = EDGE_LABEL_FONT;
        ctx.fillStyle = COLORS.edgeLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(edge.label.replace(/_/g, ' '), mx, my - 4 / zoom);
      }
    });

    // ── Draw Nodes ──────────────────────────────────────
    nodes.forEach(node => {
      const isHovered = hoverNodeRef.current && hoverNodeRef.current.id === node.id;
      const r = node.radius;

      // Glow effect
      const glowRadius = isHovered ? r * 3.5 : r * 2.5;
      const glow = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, glowRadius);
      glow.addColorStop(0, isHovered ? COLORS.nodeHoverGlow : COLORS.nodeGlow);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? COLORS.nodeHover : COLORS.nodeFill;
      ctx.fill();
      ctx.strokeStyle = COLORS.nodeStroke;
      ctx.lineWidth = (isHovered ? 2 : 1) / zoom;
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(node.x - r * 0.2, node.y - r * 0.2, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();

      // Label
      if (showLabelsRef.current) {
        ctx.font = LABEL_FONT;
        ctx.fillStyle = isHovered ? COLORS.labelText : COLORS.labelDim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + r + 6 / zoom);
      }
    });

    ctx.restore();
  }, []);

  // ── Animation Loop ──────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      physicsStep();
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [physicsStep, render]);

  // ── Canvas Resize ───────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      // High-DPI context preserved.
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Fetch on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // ── Coordinate transforms ───────────────────────────────────
  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: (sx - panRef.current.x) / zoomRef.current,
      y: (sy - panRef.current.y) / zoomRef.current,
    };
  }, []);

  const findNodeAt = useCallback((wx, wy) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy < (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  }, []);

  // ── Mouse Events ────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    const node = findNodeAt(wx, wy);
    if (node) {
      dragNodeRef.current = node;
      isDraggingRef.current = true;
    } else {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    mouseRef.current = { x: e.clientX, y: e.clientY, canvasX: sx, canvasY: sy };

    if (isDraggingRef.current && dragNodeRef.current) {
      const { x: wx, y: wy } = screenToWorld(sx, sy);
      dragNodeRef.current.x = wx;
      dragNodeRef.current.y = wy;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      panRef.current = {
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      };
      return;
    }

    // Hover detection
    const { x: wx, y: wy } = screenToWorld(sx, sy);
    const node = findNodeAt(wx, wy);
    hoverNodeRef.current = node;

    if (node) {
      // Build tooltip data with connected relations
      const relations = edgesRef.current
        .filter(e => e.source === node.id || e.target === node.id)
        .slice(0, 5)
        .map(e => ({
          source: e.source,
          target: e.target,
          label: e.label.replace(/_/g, ' '),
        }));

      setTooltipData({
        name: node.label,
        connections: node.connections,
        relations,
        x: e.clientX,
        y: e.clientY,
      });
      canvasRef.current.style.cursor = 'pointer';
    } else {
      setTooltipData(null);
      canvasRef.current.style.cursor = isPanningRef.current ? 'grabbing' : 'grab';
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    dragNodeRef.current = null;
    isDraggingRef.current = false;
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.2, Math.min(5, zoomRef.current * zoomFactor));

    // Zoom toward cursor
    const worldBefore = screenToWorld(sx, sy);
    zoomRef.current = newZoom;
    const worldAfter = screenToWorld(sx, sy);

    panRef.current.x += (worldAfter.x - worldBefore.x) * newZoom;
    panRef.current.y += (worldAfter.y - worldBefore.y) * newZoom;
  }, [screenToWorld]);

  // ── Attach canvas events ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Toggle labels sync ─────────────────────────────────────
  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="graph-container">
      {/* Header Bar */}
      <div className="graph-header">
        <div className="graph-title">
          <div className="pulse-ring" />
          <h2>Neural Mesh Topology</h2>
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
            panRef.current = { x: 0, y: 0 };
            zoomRef.current = 1;
          }}>
            Reset View
          </button>
          <button className="graph-btn" onClick={fetchGraph}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Stats Overlay */}
      {graphStatus === 'online' && (
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

      {/* Legend */}
      {graphStatus === 'online' && (
        <div className="graph-legend">
          <div className="legend-title">Legend</div>
          <div className="legend-item">
            <div className="legend-dot primary" />
            <span className="legend-label">Entity Node</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot secondary" />
            <span className="legend-label">Relationship</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="graph-tooltip visible"
          style={{
            left: tooltipData.x + 16,
            top: tooltipData.y - 10,
          }}
        >
          <div className="tooltip-name">{tooltipData.name}</div>
          <div className="tooltip-detail">
            Connections: {tooltipData.connections}
          </div>
          {tooltipData.relations.length > 0 && (
            <div className="tooltip-relations">
              {tooltipData.relations.map((r, i) => (
                <div key={i} className="tooltip-relation-item">
                  {r.source}<span className="rel-arrow">→</span>{r.label}<span className="rel-arrow">→</span>{r.target}
                </div>
              ))}
            </div>
          )}
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
