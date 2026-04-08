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
  const [rightPanel, setRightPanel] = useState('graph') // 'graph' or 'dreams'
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
  }, [currentPersona]);

  return (
    <div className={`app-container state-${brainState.cognitiveState.toLowerCase()}`}>
      
      {/* ── Header ── */}
      <header className="app-header">
        <div className="logo-section">
          <div className="brain-pulse-icon" />
          <h1>SOMA</h1>
        </div>
        
        <div className="header-center">
          <button 
            className={`tab-btn ${rightPanel === 'graph' ? 'active' : ''}`}
            onClick={() => setRightPanel('graph')}
          >Neural Mesh</button>
          <button 
            className={`tab-btn ${rightPanel === 'dreams' ? 'active' : ''}`}
            onClick={() => setRightPanel('dreams')}
          >Dreams</button>
        </div>

        <div className="status-indicator">
          <span className={`dot ${brainState.isLoading ? 'thinking' : 'idle'}`}></span>
          <span className="label-mono">{brainState.cognitiveState}</span>
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

      {/* ── Main Split Layout ── */}
      <div className="split-layout">

        {/* LEFT: Chat + Mini Vitals */}
        <div className="left-pane">
          <ChatPanel 
            messages={messages} 
            setMessages={setMessages} 
            brainState={brainState}
            setBrainState={setBrainState} 
            isLoading={brainState.isLoading}
            currentPersona={currentPersona}
          />

          {/* Compact vitals bar under chat */}
          <div className="vitals-bar">
            <div className="vb-item">
              <span className="vb-label">Sensory</span>
              <span className="vb-value">{brainState.sensoryDocuments}</span>
            </div>
            <div className="vb-item">
              <span className="vb-label">Synaptic</span>
              <span className="vb-value purple">{brainState.graphRelations}</span>
            </div>
            <div className="vb-item">
              <span className="vb-label">Working</span>
              <span className="vb-value">{brainState.workingMemory}</span>
            </div>
            <button 
              className="sleep-btn-compact"
              onClick={async () => {
                setBrainState(prev => ({ ...prev, isLoading: true, statusMessage: 'Sleeping...' }));
                try {
                  const res = await fetch('/api/v1/sleep', { method: 'POST' });
                  const data = await res.json();
                  setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: `Sleep done. ${data.graph_relations_extracted} relations.` }));
                } catch (e) {
                  setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Sleep failed.' }));
                }
              }}
              disabled={brainState.isLoading}
            >
              💤 Sleep
            </button>
          </div>
        </div>

        {/* RIGHT: Neural Mesh or Dreams */}
        <div className="right-pane">
          {rightPanel === 'graph' ? (
            <KnowledgeGraph 
              highlightedNodes={brainState.highlightedNodes} 
              currentPersona={currentPersona}
            />
          ) : (
            <DreamSequence sparks={brainState.sparks} />
          )}
        </div>

      </div>
    </div>
  )
}

export default App
