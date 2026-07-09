import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../api';
import './MemoryExplorer.css';

function MemoryExplorer() {
  const [search, setSearch] = useState('');
  const [memories, setMemories] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [insightEntity, setInsightEntity] = useState(null);

  const fetchData = useCallback(async (query = '') => {
    const isSearch = query.trim().length > 0;
    if (isSearch) setIsSearching(true);
    else setIsLoading(true);

    try {
      const memoryUrl = isSearch 
        ? `/api/v1/memory/search?q=${encodeURIComponent(query)}` 
        : '/api/v1/memory/sensory';
      
      const [memRes, graphRes] = await Promise.all([
        apiFetch(memoryUrl),
        apiFetch('/api/v1/graph')
      ]);

      if (memRes.ok) {
        const data = await memRes.json();
        const results = data.memories || [];
        setMemories(results);
        
        if (results.length > 0) {
          if (!selectedId || !results.find(m => m.id === selectedId)) {
            setSelectedId(results[0].id);
          }
        } else {
          setSelectedId(null);
        }
      }

      if (graphRes.ok) {
        const gData = await graphRes.json();
        setGraphData(gData);
      }
    } catch (error) {
      console.error('Neural synchronization failure', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [selectedId]);

  const handlePurge = async (id) => {
    if (!window.confirm("Are you sure you want to purge this memory chunk from the neural cortex? This action is irreversible.")) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
        setSelectedId(null);
        fetchData(search);
      }
    } catch (error) {
      console.error('Purge failed', error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredMemories = useMemo(() => {
    if (activeFilter === 'all') return memories;
    return memories.filter(m => {
      const type = m.metadata?.type;
      if (activeFilter === 'episodic') return type === 'conversation' || type === 'chat_exchange';
      if (activeFilter === 'semantic') return type === 'concept' || type === 'note';
      if (activeFilter === 'sleep') return type === 'sleep_summary';
      return true;
    });
  }, [memories, activeFilter]);

  const selectedMemory = useMemo(() => 
    memories.find(m => m.id === selectedId) || memories[0],
    [memories, selectedId]
  );

  const linkedEntities = useMemo(() => {
    if (!selectedMemory || !graphData.nodes) return [];
    const content = selectedMemory.content.toLowerCase();
    return graphData.nodes.filter(node => 
      content.includes(node.id.toLowerCase()) || 
      (node.label && content.includes(node.label.toLowerCase()))
    );
  }, [selectedMemory, graphData]);

  const getTitle = (content) => {
    if (!content) return 'Untitled Memory Chunks';
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    if (firstLine.length > 40) return firstLine.substring(0, 37) + '...';
    return firstLine || 'Untitled Memory Chunks';
  };

  const getMemoryTheme = (type) => {
    switch (type) {
      case 'conversation': return { color: '#3b82f6', label: 'Episodic' };
      case 'chat_exchange': return { color: '#8b5cf6', label: 'Social' };
      case 'concept': return { color: '#ff6b35', label: 'Semantic' };
      case 'note': return { color: '#10b981', label: 'Explicit' };
      case 'sleep_summary': return { color: '#f59e0b', label: 'Consolidated' };
      default: return { color: '#94a3b8', label: 'Raw Sensory' };
    }
  };

  return (
    <div className="memory-view-grid fade-in">
      {/* ── SIDEBAR: Memory Feed ── */}
      <section className="memory-surface list-surface">
        <div className="memory-toolbar">
          <div className="memory-search-wrap">
            <span className="material-icons">{isSearching ? 'sync' : 'search'}</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query sensory cortex..." 
            />
          </div>
          <div className="filter-tabs">
            {['all', 'episodic', 'semantic', 'sleep'].map(f => (
              <button 
                key={f} 
                className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="density-stats">
            <span className="material-icons" style={{fontSize: '14px'}}>dns</span>
            <span>{filteredMemories.length} Active Nodes</span>
          </div>
        </div>

        <div className="memory-list">
          {isLoading ? (
            <div className="empty-detail">
              <span className="material-icons pulse">settings_input_component</span>
              <p style={{fontSize: '0.7rem'}}>Calibrating neural paths...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="empty-detail" style={{ height: '100%', gap: '8px' }}>
              <span className="material-icons" style={{ fontSize: '32px', opacity: 0.5 }}>folder_open</span>
              <p style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600 }}>No memories found</p>
              <p style={{ fontSize: '0.7rem', color: '#bbb', textAlign: 'center' }}>Query the sensory cortex or select another layer above.</p>
            </div>
          ) : (
            filteredMemories.map((memory) => {
              const theme = getMemoryTheme(memory.metadata?.type);
              return (
                <button 
                  key={memory.id}
                  className={`memory-row ${memory.id === selectedId ? 'active' : ''}`}
                  onClick={() => setSelectedId(memory.id)}
                >
                  <div 
                    className="memory-dot" 
                    style={{ backgroundColor: theme.color }} 
                  />
                  <div className="memory-row-copy">
                    <strong>{getTitle(memory.content)}</strong>
                    <div className="memory-row-meta">
                      <span style={{ color: theme.color }}>{theme.label}</span>
                      <span>•</span>
                      <span>{memory.id.substring(0, 8)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ── MAIN: Diagnostic Detail ── */}
      <section className="memory-surface detail-surface" style={{position: 'relative'}}>
        {selectedMemory ? (
          <div className="fade-in">
            <div className="memory-header-meta">
              <div className="memory-type-pill" style={{ 
                color: getMemoryTheme(selectedMemory.metadata?.type).color,
                background: `${getMemoryTheme(selectedMemory.metadata?.type).color}15`
              }}>
                Layer: {getMemoryTheme(selectedMemory.metadata?.type).label}
              </div>
              <div className="memory-id-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>UUID: {selectedMemory.id}</span>
                <button 
                  className="purge-btn" 
                  onClick={() => handlePurge(selectedMemory.id)}
                  disabled={isDeleting}
                >
                  <span className="material-icons" style={{fontSize: '14px'}}>{isDeleting ? 'sync' : 'delete_forever'}</span>
                  Purge
                </button>
              </div>
            </div>
            
            <h1 className="memory-detail-title">{getTitle(selectedMemory.content)}</h1>
            <p className="memory-detail-date">
              <span className="material-icons" style={{fontSize: '14px'}}>event</span>
              Encoded: {selectedMemory.metadata?.timestamp ? new Date(selectedMemory.metadata.timestamp).toLocaleString() : 'System Boot Sequence'}
            </p>

            <div className="memory-content-box">
              {selectedMemory.content}
            </div>

            {/* Instrument Metrics */}
            <div className="instrument-grid">
              <div className="instrument-card">
                <h4>Retrieval Salience</h4>
                <div className="meter-track">
                  <div className="meter-fill" style={{ 
                    width: `${Math.round((selectedMemory.similarity || 0.85) * 100)}%`,
                    backgroundColor: getMemoryTheme(selectedMemory.metadata?.type).color
                  }} />
                </div>
                <div className="metric-value">{(selectedMemory.similarity || 0.85).toFixed(4)}</div>
              </div>
              
              <div className="instrument-card">
                <h4>Graph Associations</h4>
                <div className="meter-track">
                  <div className="meter-fill" style={{ 
                    width: `${Math.min(linkedEntities.length * 20, 100)}%`,
                    backgroundColor: '#ff6b35'
                  }} />
                </div>
                <div className="metric-value">{linkedEntities.length} Links</div>
              </div>

            </div>

            {/* Knowledge Links */}
            <div className="neighborhood-section">
              <div className="section-label">
                <span className="material-icons" style={{fontSize: '16px'}}>account_tree</span>
                Knowledge Graph Intersections (Click for Insights)
              </div>
              <div className="neighborhood-grid">
                {linkedEntities.map(node => (
                  <button 
                    key={node.id} 
                    className="neighbor-card"
                    onClick={() => setInsightEntity(node)}
                  >
                    <strong>{node.id}</strong>
                    <span>Connections: {node.connections || 0}</span>
                  </button>
                ))}
                {linkedEntities.length === 0 && (
                  <p style={{fontSize: '0.75rem', color: '#999', fontStyle: 'italic'}}>No direct semantic associations detected in current graph state.</p>
                )}
              </div>
            </div>

            {/* Raw Metadata */}
            <div className="neighborhood-section">
              <div className="section-label">
                <span className="material-icons" style={{fontSize: '16px'}}>terminal</span>
                Raw Metadata Explorer
              </div>
              <div className="metadata-grid">
                {Object.entries(selectedMemory.metadata || {}).map(([key, val]) => (
                  <div key={key} className="metadata-tag">
                    <span>{key}</span>
                    <span>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neural Insight Overlay */}
            {insightEntity && (
              <div className="neural-insight-overlay fade-in">
                <div className="neural-insight-modal">
                  <div className="insight-header">
                    <span className="material-icons">psychology</span>
                    <h3>Neural Insight: {insightEntity.id}</h3>
                    <button className="insight-close" onClick={() => setInsightEntity(null)}>
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="insight-body">
                    <div className="insight-stat">
                      <label>Semantic Weight</label>
                      <strong>{insightEntity.connections * 12.5} nm</strong>
                    </div>
                    <div className="insight-stat">
                      <label>Active Connections</label>
                      <strong>{insightEntity.connections} Nodes</strong>
                    </div>
                    <p>This entity is a core semantic node within your current knowledge base. It facilitates retrieval of related episodic contexts and strengthens the reasoning cortex.</p>
                  </div>
                  <button className="insight-btn" onClick={() => setInsightEntity(null)}>Close Diagnostic</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-detail">
            <span className="material-icons pulse">sensors</span>
            <h3>No Active Focus</h3>
            <p style={{maxWidth: '280px', margin: '0 auto', fontSize: '0.85rem'}}>Select a sensory chunk from the feed to begin deep-layer diagnostic analysis.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MemoryExplorer;
