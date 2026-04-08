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
  const [currentOverlay, setCurrentOverlay] = useState('chat') // 'chat', 'dreams', or 'none'
  const [currentPersona, setCurrentPersona] = useState('User_Alpha')
  const [hudCollapsed, setHudCollapsed] = useState(false)

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
  }, [currentPersona]);

  return (
    <div className={`app-container state-${brainState.cognitiveState.toLowerCase()}`}>

      {/* ═══ LAYER 0: The 3D Neural Mesh — Always Present ═══ */}
      <div className="neural-mesh-bg">
        <KnowledgeGraph 
          highlightedNodes={brainState.highlightedNodes} 
          currentPersona={currentPersona}
          isBackground={true}
        />
      </div>

      {/* ═══ LAYER 1: Floating HUD Shell ═══ */}
      <header className="app-header">
        <div className="logo-section">
          <div className="brain-pulse-icon" />
          <h1>SOMA</h1>
          <span className="label-mono header-subtitle">Cognitive Neural Interface</span>
        </div>
        
        <div className="status-indicator">
          <span className={`dot ${brainState.isLoading ? 'thinking' : 'idle'}`}></span>
          <span className="label-mono">{brainState.cognitiveState}</span>
          
          {/* Persona Switcher — compact in header */}
          <select 
            className="persona-select label-mono"
            value={currentPersona}
            onChange={(e) => setCurrentPersona(e.target.value)}
          >
            <option value="User_Alpha">Alpha</option>
            <option value="User_Beta">Beta</option>
            <option value="System_Admin">Admin</option>
          </select>
        </div>
      </header>

      {/* ═══ LAYER 2: Left Floating Toolbar ═══ */}
      <div className="floating-toolbar">
        <button 
          className={`toolbar-btn ${currentOverlay === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentOverlay(currentOverlay === 'chat' ? 'none' : 'chat')}
          title="Neural Interface"
        >
          <span className="toolbar-icon">⚡</span>
          <span className="toolbar-label">Interface</span>
        </button>
        <button 
          className={`toolbar-btn ${currentOverlay === 'dreams' ? 'active' : ''}`}
          onClick={() => setCurrentOverlay(currentOverlay === 'dreams' ? 'none' : 'dreams')}
          title="Dream Sequence"
        >
          <span className="toolbar-icon">◎</span>
          <span className="toolbar-label">Dreams</span>
        </button>
        <button 
          className={`toolbar-btn ${hudCollapsed ? '' : 'active'}`}
          onClick={() => setHudCollapsed(!hudCollapsed)}
          title="Toggle Diagnostics"
        >
          <span className="toolbar-icon">◈</span>
          <span className="toolbar-label">Vitals</span>
        </button>

        {/* Brain vitals mini readout */}
        <div className="toolbar-vitals">
          <div className="mini-vital">
            <span className="mini-label">SEN</span>
            <span className="mini-value">{brainState.sensoryDocuments}</span>
          </div>
          <div className="mini-vital">
            <span className="mini-label">SYN</span>
            <span className="mini-value purple">{brainState.graphRelations}</span>
          </div>
          <div className="mini-vital">
            <span className="mini-label">WRK</span>
            <span className="mini-value">{brainState.workingMemory}</span>
          </div>
        </div>
      </div>

      {/* ═══ LAYER 3: Central Overlay (Chat or Dreams) ═══ */}
      <div className={`center-overlay ${currentOverlay !== 'none' ? 'visible' : ''}`}>
        {currentOverlay === 'chat' && (
          <ChatPanel 
            messages={messages} 
            setMessages={setMessages} 
            brainState={brainState}
            setBrainState={setBrainState} 
            isLoading={brainState.isLoading}
            currentPersona={currentPersona}
          />
        )}
        {currentOverlay === 'dreams' && (
          <DreamSequence sparks={brainState.sparks} />
        )}
      </div>

      {/* ═══ LAYER 4: Right Diagnostic HUD (collapsible) ═══ */}
      <aside className={`diagnostic-hud ${hudCollapsed ? 'collapsed' : ''}`}>
        <CognitiveDashboard 
          brainState={brainState} 
          setBrainState={setBrainState} 
        />
      </aside>

    </div>
  )
}

export default App
