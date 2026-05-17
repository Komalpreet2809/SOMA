import { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { apiFetch } from '../api';
import './CognitiveBrain3DScene.css';

// Fixed Brain Lobes coordinates to anchor the 3D biological silhouette
const LOBES = [
  { id: 'LOBE_PREFRONTAL', label: 'Prefrontal Lobe (Reasoning & Language)', fx: 50, fy: 35, fz: 0, type: 'lobe', key: 'prefrontal' },
  { id: 'LOBE_TEMPORAL', label: 'Temporal Lobe (Memory & Association)', fx: -10, fy: -35, fz: -15, type: 'lobe', key: 'hippocampus' },
  { id: 'LOBE_PARIETAL', label: 'Parietal Lobe (Sensory & Intake)', fx: -55, fy: 20, fz: 0, type: 'lobe', key: 'sensory' },
  { id: 'LOBE_SUBCORTICAL', label: 'Subcortical Hub (Attention & Routing)', fx: 0, fy: 10, fz: 15, type: 'lobe', key: 'thalamus' }
];

const PHASE_TO_REGION = {
  perception: 'sensory',
  sensory: 'sensory',
  attention: 'thalamus',
  routing: 'thalamus',
  prediction: 'prefrontal',
  working_memory: 'prefrontal',
  recall: 'hippocampus',
  association: 'hippocampus',
  memory: 'hippocampus',
  emotion: 'thalamus', // Grouped in subcortical hub for positioning
  reasoning: 'prefrontal',
  reflection: 'prefrontal',
  language: 'prefrontal',
  inhibition: 'hippocampus',
  graph: 'hippocampus',
  listening: 'sensory',
  responding: 'prefrontal'
};

// Deterministic hash to anchor learned entities to specific brain lobes organically
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

function CognitiveBrain3DScene({ state = 'idle', refreshTick }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNodes, setNewNodes] = useState(new Set());
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const fgRef = useRef();

  // Highlight the active lobe based on SOMA's cognitive phase
  const activeRegion = PHASE_TO_REGION[state] || null;

  // Track layout resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 500, height: height || 400 });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch real-time learned knowledge from Neo4j database
  useEffect(() => {
    const fetchBrainData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/graph');
        if (!res.ok) throw new Error('Failed to fetch graph data');
        const data = await res.json();

        // 1. Start with the permanent brain structures (The 4 Lobes)
        const nodes = LOBES.map(l => ({ ...l }));
        const links = [];

        // Track new nodes to trigger the "synaptic spark" animation
        const currentEntityIds = new Set(data.nodes?.map(n => n.id) || []);
        const previouslyKnownIds = new Set(graphData.nodes.filter(n => n.type !== 'lobe').map(n => n.id));
        const newlyDiscovered = new Set([...currentEntityIds].filter(id => !previouslyKnownIds.has(id)));
        
        if (newlyDiscovered.size > 0) {
          setNewNodes(newlyDiscovered);
          // Clear spark animation after 4 seconds
          setTimeout(() => setNewNodes(new Set()), 4000);
        }

        if (data.nodes && data.nodes.length > 0) {
          // 2. Map actual database entities into the brain
          data.nodes.forEach(n => {
            const entityId = n.id;
            
            // Assign this entity deterministically to a brain lobe based on name hash
            const assignedLobeIndex = hashString(entityId) % LOBES.length;
            const targetLobeId = LOBES[assignedLobeIndex].id;

            nodes.push({
              id: entityId,
              label: n.label || entityId,
              connections: n.connections || 1,
              type: 'entity'
            });

            // Structural bio-link to anchor it to its parent lobe
            links.push({
              source: targetLobeId,
              target: entityId,
              type: 'structural'
            });
          });

          // 3. Map actual semantic links (Komal -> IS_A -> Student)
          if (data.edges) {
            data.edges.forEach(e => {
              links.push({
                source: e.source,
                target: e.target,
                label: e.label || 'ASSOCIATED_WITH',
                type: 'semantic'
              });
            });
          }
        } else {
          // If Neo4j is offline/empty, seed a few highly visual concept cells
          // representing basic thoughts so it never looks completely empty
          const sampleEntities = ['Komal', 'Student', 'SOMA', 'AI Architecture', 'Learning System'];
          sampleEntities.forEach((entityId, index) => {
            const targetLobeId = LOBES[index % LOBES.length].id;
            nodes.push({ id: entityId, label: entityId, connections: 2, type: 'entity' });
            links.push({ source: targetLobeId, target: entityId, type: 'structural' });
          });
          links.push({ source: 'Komal', target: 'Student', label: 'IS_A', type: 'semantic' });
          links.push({ source: 'SOMA', target: 'AI Architecture', label: 'BUILT_ON', type: 'semantic' });
        }

        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Brain mesh load error', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrainData();
  }, [refreshTick]);

  // Adjust camera to focus on the active lobe during cognitive processing
  useEffect(() => {
    if (activeRegion && fgRef.current) {
      const activeLobe = LOBES.find(l => l.key === activeRegion);
      if (activeLobe) {
        fgRef.current.cameraPosition(
          { x: activeLobe.fx * 1.5, y: activeLobe.fy * 1.5, z: 180 }, // Move camera closer
          { x: activeLobe.fx * 0.5, y: activeLobe.fy * 0.5, z: 0 },   // Point at the lobe
          1200
        );
      }
    } else if (fgRef.current) {
      // Zoom out to global brain view when idle
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 240 }, { x: 0, y: 0, z: 0 }, 1500);
    }
  }, [activeRegion]);

  // Dynamic Node Styling
  const getNodeColor = (node) => {
    if (node.type === 'lobe') {
      // Core Lobes glow when they are actively processing
      if (node.key === activeRegion) {
        return '#ffffff'; // Intense active state (pure white core)
      }
      return 'rgba(6, 182, 212, 0.4)'; // Faint resting lobe core (Cyan outline)
    }

    // Spark animation for newly learned nodes (Bright yellow-gold)
    if (newNodes.has(node.id)) {
      return '#f59e0b';
    }

    // Regular synapses colored based on connection degree
    return (node.connections || 1) > 3 ? '#ec4899' : '#06b6d4'; 
  };

  const getNodeVal = (node) => {
    if (node.type === 'lobe') {
      // Active processing lobes grow dynamically in physical scale
      return node.key === activeRegion ? 12 : 5;
    }
    // Normal synapses sized by centrality
    return Math.max(1.8, Math.min((node.connections || 1) * 1.2, 6));
  };

  return (
    <div className="brain-3d-viewport" ref={containerRef}>
      {/* 3D WebGL Learning Brain Simulation */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)" // Fully transparent to blend with dashboard
        nodeLabel={node => `
          <div class="brain-tooltip-hud">
            <strong>${node.label || node.id}</strong>
            <span class="hud-category">${node.type === 'lobe' ? 'Brain Cortex Lobe' : 'Learned Synaptic Concept'}</span>
          </div>
        `}
        nodeColor={getNodeColor}
        nodeVal={getNodeVal}
        nodeRelSize={3}
        // Link customizations to distinguish biology vs semantic relations
        linkColor={link => {
          if (link.type === 'structural') return 'rgba(255,255,255,0.03)'; // Structural bio-lines are nearly invisible
          return 'rgba(6, 182, 212, 0.25)'; // Real semantic memories are glowing cyan axons
        }}
        linkWidth={link => (link.type === 'structural' ? 0.5 : 1.5)}
        linkDirectionalParticles={link => {
          if (link.type === 'structural') return 0;
          // Newly activated semantic links run rapid data flows
          return link.source.id === activeRegion || link.target.id === activeRegion ? 6 : 2;
        }}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={link => (link.type === 'structural' ? 0 : 2.5)}
        linkDirectionalParticleColor={() => '#ec4899'} // Hot pink thought particles flowing through the axons
        showNavInfo={false}
        enablePointerInteraction={true}
        enableNodeDrag={true}
      />

      {/* Futuristic status HUD overlays */}
      <div className="brain-hud-metrics">
        <div className="hud-metric-item">
          <span className="hud-label">Cognitive Mode</span>
          <strong className="hud-val uppercase pulse">{state}</strong>
        </div>
        <div className="hud-metric-item">
          <span className="hud-label">Active Lobe</span>
          <strong className="hud-val text-cyan uppercase">{activeRegion || 'STANDBY'}</strong>
        </div>
        <div className="hud-metric-item">
          <span className="hud-label">Learned Synapses</span>
          <strong className="hud-val text-pink">
            {graphData.nodes.filter(n => n.type !== 'lobe').length} nodes
          </strong>
        </div>
      </div>

      {loading && <div className="brain-loading-label">Sparking neural networks...</div>}
    </div>
  );
}

export default CognitiveBrain3DScene;
