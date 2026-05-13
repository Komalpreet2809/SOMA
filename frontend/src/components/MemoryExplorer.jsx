import KnowledgeGraph from './KnowledgeGraph';
import './MemoryExplorer.css';

const MEMORIES = [
  { id: '1', title: 'Neural architecture trade-offs in transformer models', type: 'conversation', date: 'Today, 10:41 AM', active: true },
  { id: '2', title: 'Attention mechanisms and long-range dependencies', type: 'concept', date: 'Today, 10:32 AM' },
  { id: '3', title: 'Sparse attention patterns for efficient inference', type: 'note', date: 'Yesterday, 08:15 PM' },
  { id: '4', title: 'Depth vs width scaling laws in neural networks', type: 'note', date: 'Yesterday, 07:42 PM' },
  { id: '5', title: 'Positional encoding variants and their impacts', type: 'concept', date: 'Yesterday, 06:11 PM' },
  { id: '6', title: 'Discussion on attention mechanisms and long-range...', type: 'conversation', date: 'May 12, 11:08 AM' }
];

function MemoryExplorer() {
  return (
    <div className="memory-dashboard">
      <div className="memory-main-grid">
        {/* Left: Memory View */}
        <div className="memory-card list-column">
          <div className="card-header-row">
            <span className="t-label">Memory View</span>
          </div>
          <div className="search-wrap">
            <div className="search-input">
              <span className="material-icons">search</span>
              <input type="text" placeholder="Search memories..." />
            </div>
            <div className="filter-pill">
              <span>All Types</span>
              <span className="material-icons">expand_more</span>
            </div>
          </div>
          <div className="memory-list">
            {MEMORIES.map(m => (
              <div key={m.id} className={`memory-item ${m.active ? 'active' : ''}`}>
                <div className="item-dot" style={{ backgroundColor: m.type === 'conversation' ? '#8B5CF6' : m.type === 'concept' ? '#6366F1' : '#EC4899' }}></div>
                <div className="item-body">
                  <div className="item-title-row">
                    <span className="item-title">{m.title}</span>
                    <span className="item-type">{m.type}</span>
                  </div>
                  <div className="item-date">{m.date}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-button">View All Memories</button>
        </div>

        {/* Center: Memory Detail */}
        <div className="memory-card detail-column">
          <div className="card-header-row">
            <span className="t-label">Memory Detail</span>
            <span className="type-badge">conversation</span>
          </div>
          <div className="detail-scroll">
            <h1 className="detail-title">Neural architecture trade-offs in transformer models</h1>
            <div className="detail-date">Today, 10:41 AM</div>

            <div className="detail-section">
              <span className="section-label">Summary</span>
              <p>We discussed how attention mechanisms enable long-range dependencies but come with quadratic complexity. Sparse patterns, recurrence, and hybrid approaches help balance efficiency and expressivity.</p>
            </div>

            <div className="detail-section">
              <span className="section-label">Entities</span>
              <div className="pill-group">
                {['Attention Mechanism', 'Long-range Dependencies', 'Transformer Models', 'Efficiency', 'Expressivity'].map(e => (
                  <span key={e} className="pill">{e}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <span className="section-label">Key Points</span>
              <ul className="points-list">
                <li>Attention provides flexibility and parallelism</li>
                <li>Quadratic complexity with sequence length</li>
                <li>Sparse patterns improve efficiency</li>
                <li>Recurrence handles long-range dependencies</li>
                <li>Trade-off between efficiency and expressivity</li>
              </ul>
            </div>

            <div className="detail-section">
              <span className="section-label">Source</span>
              <div className="source-row">
                <span className="source-chip">5 Memories</span>
                <span className="source-chip">2 Entities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Graph View */}
        <div className="memory-card graph-column">
          <div className="card-header-row">
            <span className="t-label">Graph View</span>
            <div className="graph-controls">
              <div className="graph-select">
                <span>Concept Map</span>
                <span className="material-icons">expand_more</span>
              </div>
              <span className="material-icons" style={{ color: '#94a3b8' }}>open_in_full</span>
            </div>
          </div>
          <div className="memory-graph-wrap">
            <KnowledgeGraph minimal={true} />
          </div>
        </div>
      </div>

      <div className="memory-footer-grid">
        {/* Knowledge Input */}
        <div className="memory-card input-card">
          <span className="t-label">Knowledge Input</span>
          <p className="input-hint">Paste text or notes for Soma to remember.</p>
          <textarea placeholder="Paste anything here... (articles, notes, ideas, research)"></textarea>
          <div className="input-footer">
            <span className="count">0 / 10000</span>
            <button className="add-button">Add to Memory</button>
          </div>
        </div>

        {/* Sleep Cycle */}
        <div className="memory-card sleep-card">
          <div className="sleep-header">
            <span className="material-icons moon">brightness_2</span>
            <div className="sleep-title">
              <h3>Sleep Cycle Complete</h3>
              <p>Memory consolidation finished</p>
            </div>
            <span className="material-icons close">close</span>
          </div>
          <div className="sleep-stats">
            <div className="stat-item">
              <div className="stat-icon linked"><span className="material-icons">gesture</span></div>
              <div className="stat-text">
                <strong>Linked Together</strong>
                <span>12 new connections</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon consolidated"><span className="material-icons">cloud_done</span></div>
              <div className="stat-text">
                <strong>Consolidated</strong>
                <span>28 memories merged</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon pruned"><span className="material-icons">person_remove</span></div>
              <div className="stat-text">
                <strong>Pruned</strong>
                <span>17 redundant items</span>
              </div>
            </div>
          </div>
          <button className="summary-button">View Summary</button>
        </div>
      </div>
    </div>
  );
}

export default MemoryExplorer;
