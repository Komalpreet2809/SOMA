import { useState } from 'react'
import ChatPanel from './components/ChatPanel'
import CognitiveBrainImageScene from './components/CognitiveBrainImageScene'
import CognitiveTimeline from './components/CognitiveTimeline'
import MemoryExplorer from './components/MemoryExplorer'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('console');
  
  return (
    <div className="soma-app-container">
      {/* ── Left Sidebar ── */}
      <aside className="soma-sidebar">
        <div className="soma-logo-area">
          <div className="soma-logo-gradient">
             <span className="material-icons">psychology</span>
          </div>
          <div className="soma-brand-info">
            <h1 className="soma-name">SOMA</h1>
            <span className="soma-sub">Cognitive Console</span>
          </div>
        </div>

        <nav className="soma-nav">
          {[
            { id: 'console', label: 'Console', icon: 'chat_bubble' },
            { id: 'memory', label: 'Memory', icon: 'inventory_2' },
            { id: 'graph', label: 'Graph', icon: 'hub' },
            { id: 'knowledge', label: 'Knowledge', icon: 'description' },
            { id: 'status', label: 'Status', icon: 'timeline' }
          ].map(item => (
            <div 
              key={item.id} 
              className={`soma-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="soma-nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="soma-sidebar-footer">
          <div className="soma-guest-card">
            <div className="soma-avatar-wrap">
              <div className="soma-avatar-circle">
                <span className="material-icons">person</span>
                <div className="soma-online-status"></div>
              </div>
              <div className="soma-avatar-text">
                <span className="name">Guest Session</span>
                <span className="id">Session ID: GUEST-7F3A</span>
              </div>
              <span className="material-icons soma-more">more_vert</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard ── */}
      <main className="soma-main">
        {activePage === 'console' && (
          <div className="soma-dashboard">
            <div className="soma-top-row">
              {/* Chat Panel */}
              <section className="soma-card chat-section">
                 <div className="soma-card-header">
                    <span className="t-label">Live Chat</span>
                 </div>
                 <ChatPanel messages={[
                   { role: 'user', content: 'What are the key trade-offs between attention mechanisms and long-range dependencies in transformer models?', timestamp: '10:42 AM' },
                   { role: 'soma', content: 'Great question. Attention mechanisms provide flexibility and parallelism, but have quadratic complexity with sequence length. Long-range dependencies are better handled by sparse patterns or recurrence, trading off some expressivity for efficiency...', timestamp: '10:42 AM' }
                 ]} />
              </section>

              {/* Brain Activity Panel */}
              <section className="soma-card brain-section">
                 <div className="soma-card-header">
                    <span className="t-label">Brain Activity</span>
                 </div>
                 <CognitiveBrainImageScene />
              </section>

              {/* Activity Feed Panel */}
              <section className="soma-card feed-section">
                 <div className="soma-card-header">
                    <span className="t-label">Activity Feed</span>
                 </div>
                 <CognitiveTimeline />
              </section>
            </div>

            {/* Bottom Vitals Row */}
            <footer className="soma-vitals-row">
              <div className="soma-vital-card status">
                 <div className="vital-inner">
                    <span className="t-label">STATUS</span>
                    <div className="status-val-wrap">
                       <div className="status-dot-green"></div>
                       <span className="status-text">Busy</span>
                    </div>
                    <span className="status-sub">Thinking & generating response</span>
                 </div>
              </div>

              {[
                { label: 'Working Memory', val: '36', limit: '/ 100', icon: 'psychology', color: '#8b5cf6' },
                { label: 'Sensory Memory', val: '1,248', icon: 'cloud_queue', color: '#6366f1' },
                { label: 'Semantic Memory', val: '3,562', icon: 'hub', color: '#ec4899' },
                { label: 'Neural Sparks', val: '24', icon: 'auto_awesome', color: '#f59e0b' }
              ].map(v => (
                <div key={v.label} className="soma-vital-card">
                   <div className="vital-icon-circle" style={{ color: v.color }}>
                      <span className="material-icons">{v.icon}</span>
                   </div>
                   <div className="vital-info">
                      <span className="t-label">{v.label}</span>
                      <div className="vital-value">
                         <strong>{v.val}</strong>
                         {v.limit && <span className="limit">{v.limit}</span>}
                      </div>
                   </div>
                </div>
              ))}
            </footer>
          </div>
        )}

        {activePage === 'memory' && <MemoryExplorer />}
      </main>
    </div>
  )
}

export default App;
