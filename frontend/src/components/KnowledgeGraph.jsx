import { useState, useRef, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { apiFetch } from '../api';
import './KnowledgeGraph.css';

function KnowledgeGraph({ highlightedNodes = [], refreshTick, minimal = false }) {
  const fgRef = useRef();
  const containerRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
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
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/graph');
      if (res.ok) {
        const data = await res.json();
        if (data.nodes.length > 0) {
          setGraphData({
            nodes: data.nodes.map(n => ({ id: n.id, label: n.label, val: 5 })),
            links: data.edges.map(e => ({ source: e.source, target: e.target })),
          });
        } else {
          // Mock data for demo look
          setGraphData({
            nodes: [
              { id: '1', label: 'Transformer Models', val: 10 },
              { id: '2', label: 'Sparse Attention', val: 7 },
              { id: '3', label: 'Attention Mechanism', val: 7 },
              { id: '4', label: 'Long-range Dependencies', val: 7 },
              { id: '5', label: 'Scaling Laws', val: 7 },
              { id: '6', label: 'Inference Efficiency', val: 7 },
            ],
            links: [
              { source: '1', target: '2' },
              { source: '1', target: '3' },
              { source: '1', target: '4' },
              { source: '1', target: '5' },
              { source: '1', target: '6' },
              { source: '2', target: '3' },
              { source: '4', target: '3' },
            ]
          });
        }
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);
  useEffect(() => { if (refreshTick > 0) fetchGraph(); }, [refreshTick, fetchGraph]);

  return (
    <div className={`knowledge-graph-wrap ${minimal ? 'minimal' : ''}`} ref={containerRef}>
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeColor={node => {
          if (node.id === '1') return '#8B5CF6'; // Main node purple
          if (['2', '3'].includes(node.id)) return '#6366F1'; // Indigo
          return '#EC4899'; // Pink
        }}
        nodeRelSize={2}
        nodeVal={node => node.val}
        linkColor={() => 'rgba(0, 0, 0, 0.05)'}
        linkWidth={1}
        enableNodeDrag={false}
        showNavInfo={false}
      />
      {minimal && (
        <div className="graph-overlay-minimal">
           <div className="legend-pills">
              <span className="pill concept">Concept</span>
              <span className="pill method">Method</span>
              <span className="pill relationship">Relationship</span>
           </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeGraph;
