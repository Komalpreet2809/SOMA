import { useState } from 'react';
import './MemoryExplorer.css';

const MEMORIES = [
  {
    id: '1',
    title: 'Neural architecture trade-offs in transformer models',
    type: 'conversation',
    dot: '#3b82f6',
    date: 'Today, 10:41 AM',
    similarity: 0.92,
    summary: 'We discussed how attention mechanisms enable parallelism but have quadratic complexity with sequence length. Sparse patterns, recurrence, and hybrid approaches help balance efficiency and expressivity.',
    entities: ['Attention Mechanism', 'Long-range Dependencies', 'Transformer Models', 'Efficiency', 'Expressivity'],
    source: { memories: 5, entities: 2 }
  },
  {
    id: '2',
    title: 'Attention mechanisms and long-range dependencies',
    type: 'concept',
    dot: '#ff6b35',
    date: 'Today, 10:32 AM',
    similarity: 0.89,
    summary: 'Long-range dependencies benefit from attention, but scaling cost needs careful control for production systems.',
    entities: ['Attention', 'Context Windows', 'Scalability'],
    source: { memories: 3, entities: 1 }
  },
  {
    id: '3',
    title: 'Sparse attention patterns for efficient inference',
    type: 'note',
    dot: '#10b981',
    date: 'Yesterday, 08:15 PM',
    similarity: 0.87,
    summary: 'Sparse routing lowers compute while preserving useful global pathways for key tokens.',
    entities: ['Sparse Attention', 'Inference', 'Efficiency'],
    source: { memories: 2, entities: 1 }
  },
  {
    id: '4',
    title: 'Depth vs width scaling laws in neural networks',
    type: 'note',
    dot: '#10b981',
    date: 'Yesterday, 07:42 PM',
    similarity: 0.85,
    summary: 'Model depth and width trade off optimization stability, memory, and generalization.',
    entities: ['Scaling Laws', 'Depth', 'Width'],
    source: { memories: 4, entities: 3 }
  },
  {
    id: '5',
    title: 'Positional encoding variants and their impacts',
    type: 'concept',
    dot: '#ff6b35',
    date: 'Yesterday, 06:11 PM',
    similarity: 0.80,
    summary: 'Rotary, learned, and relative position schemes each affect extrapolation and training behavior differently.',
    entities: ['RoPE', 'Relative Position', 'Learned Embeddings'],
    source: { memories: 6, entities: 2 }
  },
];

function MemoryExplorer() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(MEMORIES[0].id);

  const filteredMemories = MEMORIES.filter(memory => 
    memory.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMemory = filteredMemories.find(m => m.id === selectedId) || filteredMemories[0] || MEMORIES[0];

  return (
    <div className="memory-view-grid fade-in">
      <section className="memory-surface list-surface">
        <div className="memory-toolbar">
          <label className="memory-search">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..." 
            />
          </label>
          <button className="memory-filter">
            <span>All Types</span>
            <span className="material-icons">expand_more</span>
          </button>
        </div>

        <div className="memory-list">
          {filteredMemories.map((memory) => (
            <button 
              key={memory.id}
              className={`memory-row ${memory.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(memory.id)}
            >
              <div className="memory-dot" style={{ backgroundColor: memory.dot }} />
              <div className="memory-row-copy">
                <strong>{memory.title}</strong>
                <div className="memory-row-meta">
                  <span>{memory.date}</span>
                  <span>•</span>
                  <span>{memory.similarity} similarity</span>
                </div>
              </div>
              <span className="memory-tag">{memory.type}</span>
            </button>
          ))}
        </div>

        <button className="memory-link-button">View All Memories</button>
      </section>

      <section className="memory-surface detail-surface">
        <div className="memory-detail-body">
          <div className="memory-tag" style={{ marginBottom: '12px', textTransform: 'capitalize' }}>{selectedMemory.type}</div>
          <h3>{selectedMemory.title}</h3>
          <p className="memory-detail-date">{selectedMemory.date}</p>
          <p className="memory-detail-summary">{selectedMemory.summary}</p>

          <div className="memory-detail-section">
            <h4>Related Entities</h4>
            <div className="entity-group">
              {selectedMemory.entities.map(e => <span key={e} className="entity-pill">{e}</span>)}
            </div>
          </div>

          <div className="memory-detail-section">
            <h4>Source</h4>
            <div className="source-group">
              <span className="source-pill">{selectedMemory.source.memories} Memories</span>
              <span className="source-pill">{selectedMemory.source.entities} Entities</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MemoryExplorer;
