import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import './KnowledgeGraph.css'

const FALLBACK_GRAPH = {
  center: 'Transformer Models',
  nodes: [
    'Attention Mechanism',
    'Long-range Dependencies',
    'Efficiency',
    'Expressivity',
    'Sparse Patterns',
    'Recurrence',
  ],
}

const POSITIONS = [
  { x: 50, y: 12 },
  { x: 80, y: 30 },
  { x: 80, y: 68 },
  { x: 50, y: 86 },
  { x: 20, y: 68 },
  { x: 20, y: 30 },
]

function KnowledgeGraph({ refreshTick }) {
  const [graph, setGraph] = useState(FALLBACK_GRAPH)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/api/v1/graph')
        if (!res.ok) {
          setLoading(false)
          return
        }

        const data = await res.json()
        const labels = Array.from(new Set((data.nodes || []).map((node) => node.label || node.id).filter(Boolean)))

        if (labels.length > 0) {
          const [center, ...rest] = labels
          const nodes = [...rest.slice(0, 6)]
          while (nodes.length < 6) {
            nodes.push(FALLBACK_GRAPH.nodes[nodes.length])
          }
          setGraph({ center, nodes })
        }
      } catch (error) {
        console.error('Graph fetch failed', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [refreshTick])

  return (
    <div className="graph-stage">
      <div className="graph-toolbar">
        <button type="button" className="graph-select">
          <span>Concept Map</span>
          <span className="material-icons">expand_more</span>
        </button>
        <div className="graph-actions">
          <button type="button" className="graph-icon-button" aria-label="Expand graph">
            <span className="material-icons">open_in_full</span>
          </button>
          <button type="button" className="graph-icon-button" aria-label="Fit graph">
            <span className="material-icons">fit_screen</span>
          </button>
        </div>
      </div>

      <div className="graph-network">
        <svg viewBox="0 0 100 100" className="graph-links" aria-hidden="true">
          {POSITIONS.map((position) => (
            <line key={`${position.x}-${position.y}`} x1="50" y1="50" x2={position.x} y2={position.y} />
          ))}
          {POSITIONS.map((position, index) => {
            const next = POSITIONS[(index + 1) % POSITIONS.length]
            return <line key={`ring-${index}`} x1={position.x} y1={position.y} x2={next.x} y2={next.y} className="ring-line" />
          })}
        </svg>

        <div className="graph-node graph-center">
          <span className="graph-node-core">∿</span>
          <strong>{graph.center}</strong>
        </div>

        {graph.nodes.map((label, index) => {
          const position = POSITIONS[index]
          const tone = label.toLowerCase().includes('efficiency') ? 'green' : 'orange'

          return (
            <div
              key={label}
              className={`graph-node graph-orbit ${tone}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span className="graph-node-dot" />
              <strong>{label}</strong>
            </div>
          )
        })}

        {loading && <div className="graph-loading">Loading concept map...</div>}
      </div>

      <div className="graph-legend">
        <span className="legend-item concept">Concept</span>
        <span className="legend-item method">Method</span>
        <span className="legend-item metric">Metric</span>
        <span className="legend-item relationship">Relationship</span>
        <span className="legend-item entity">Entity</span>
      </div>
    </div>
  )
}

export default KnowledgeGraph
