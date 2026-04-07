import { useState, useEffect } from 'react'
import ChatPanel from './components/ChatPanel'
import CognitiveDashboard from './components/CognitiveDashboard'
import KnowledgeGraph from './components/KnowledgeGraph'
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
    traces: []
  })
  const [currentView, setCurrentView] = useState('chat') // 'chat' or 'graph'

  // Fetch Brain Vitals
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch('/api/v1/brain/vitals');
        const data = await res.json();
        setBrainState(prev => ({
          ...prev,
          sensoryDocuments: data.sensory,
          graphRelations: data.semantic.nodes + data.semantic.edges,
          workingMemory: data.working,
        }));
      } catch (err) {
        console.error("Failed to fetch brain vitals:", err);
      }
    };

    const fetchSparks = async () => {
      try {
        const res = await fetch('/api/v1/brain/sparks');
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
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1 style={{ fontSize: '1.2rem' }}>SOMA AI CORE</h1>
        </div>
        


        <div className="status-indicator">
          <span className={`dot ${brainState.isLoading ? 'thinking' : 'idle'}`}></span>
          <span className="label-mono">System Optimal</span>
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

        </div>


      </aside>

      <main className="main-content">
        {currentView === 'chat' ? (
          <ChatPanel 
            messages={messages} 
            setMessages={setMessages} 
            brainState={brainState}
            setBrainState={setBrainState} 
            isLoading={brainState.isLoading}
          />
        ) : (
          <KnowledgeGraph highlightedNodes={brainState.highlightedNodes} />
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
