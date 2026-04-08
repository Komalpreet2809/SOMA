import { useState, useEffect } from 'react'
import ChatPanel from './components/ChatPanel'
import CognitiveDashboard from './components/CognitiveDashboard'
import KnowledgeGraph from './components/KnowledgeGraph'
import DreamSequence from './components/DreamSequence'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [brainState, setBrainState] = useState({
    sensoryDocuments: 0,
    graphRelations: 0,
    workingMemory: 0,
    statusMessage: "Brain idle.",
    isLoading: false,
    reflection: "",
    highlightedNodes: [],
    sparks: [],
    cognitiveState: "IDLE",
    traces: []
  })
  const [currentView, setCurrentView] = useState('chat') // 'chat' or 'graph'
  const [currentPersona, setCurrentPersona] = useState('User_Alpha')

  // Fetch Brain Vitals
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch(`/api/v1/brain/vitals?user_id=${currentPersona}`);
        const data = await res.json();
        setBrainState(prev => ({
          ...prev,
          sensoryDocuments: data.sensory,
          graphRelations: data.semantic.nodes + data.semantic.edges,
          workingMemory: data.working,
          cognitiveState: data.state || 'IDLE'
        }));
      } catch (err) {
        console.error("Failed to fetch brain vitals:", err);
      }
    };

    const fetchSparks = async () => {
      try {
        const res = await fetch(`/api/v1/brain/sparks?user_id=${currentPersona}`);
        const data = await res.json();
        setBrainState(prev => ({
          ...prev,
          sparks: data
        }));
      } catch (err) {
        console.error("Failed to fetch neural sparks:", err);
      }
    };

    fetchVitals();
    fetchSparks();
    const interval = setInterval(() => {
      fetchVitals();
      fetchSparks();
    }, 20000);
    return () => clearInterval(interval);
  }, [currentPersona]);

  // Fetch SQLite Chat History on Persona Change
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/history?user_id=${currentPersona}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchHistory();
    // Also trigger graph refresh if possible by passing persona down
  }, [currentPersona]);

  return (
    <div className={`app-container state-${brainState.cognitiveState.toLowerCase()}`}>
      <header className="app-header">
        <div className="logo-section">
          <h1 style={{ fontSize: '1.2rem' }}>SOMA AI CORE</h1>
        </div>
        
        <div className="status-indicator">
          <span className={`dot ${brainState.isLoading ? 'thinking' : 'idle'}`}></span>
          <span className="label-mono">System {brainState.cognitiveState}</span>
          <span className="label-mono ephemeral-pill">Ephemeral Mode</span>
        </div>
      </header>
      
      <aside className="sidebar">
        <div className="nav-section">
          <div className="nav-header">Workspace</div>
          <div 
            className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentView('chat')}
          >
            Active Node
          </div>
          <div 
            className={`nav-item ${currentView === 'graph' ? 'active' : ''}`}
            onClick={() => setCurrentView('graph')}
          >
            Neural Mesh
          </div>
          <div 
            className={`nav-item ${currentView === 'dreams' ? 'active' : ''}`}
            onClick={() => setCurrentView('dreams')}
          >
            Subconscious Dreams
          </div>

        </div>

        <div className="nav-section" style={{ marginTop: '30px' }}>
          <div className="nav-header">Persona / Context</div>
          <div style={{ padding: '0 15px' }}>
            <select 
              className="label-mono"
              value={currentPersona}
              onChange={(e) => setCurrentPersona(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(8, 11, 9, 0.8)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 10px',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              <option value="User_Alpha">User Alpha</option>
              <option value="User_Beta">User Beta</option>
              <option value="System_Admin">System Admin</option>
            </select>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {currentView === 'chat' && (
          <ChatPanel 
            messages={messages} 
            setMessages={setMessages} 
            brainState={brainState}
            setBrainState={setBrainState} 
            isLoading={brainState.isLoading}
            currentPersona={currentPersona}
          />
        )}
        {currentView === 'graph' && (
          <KnowledgeGraph 
            highlightedNodes={brainState.highlightedNodes} 
            currentPersona={currentPersona}
          />
        )}
        {currentView === 'dreams' && (
          <DreamSequence sparks={brainState.sparks} />
        )}
      </main>

      <aside className="diagnostic-panel">
        <CognitiveDashboard 
          brainState={brainState} 
          setBrainState={setBrainState} 
        />
      </aside>


    </div>
  )
}

export default App
