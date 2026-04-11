import { useState, useEffect } from 'react'
import ChatPanel from './components/ChatPanel'
import BrainProcess from './components/BrainProcess'
import KnowledgeGraph from './components/KnowledgeGraph'
import DreamSequence from './components/DreamSequence'
import Onboarding from './components/Onboarding'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [brainState, setBrainState] = useState({
    sensoryDocuments: 0,
    graphRelations: 0,
    workingMemory: 0,
    statusMessage: 'Brain idle.',
    isLoading: false,
    reflection: '',
    highlightedNodes: [],
    sparks: [],
    cognitiveState: 'IDLE',
    traces: []
  })
  const [rightPanel, setRightPanel] = useState('graph')
  const [currentPersona, setCurrentPersona] = useState('User_Alpha')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem('soma_visited')
    if (!hasVisited) {
      setShowOnboarding(true)
      localStorage.setItem('soma_visited', 'true')
    }
  }, [])

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch(`/api/v1/brain/vitals?user_id=${currentPersona}`)
        const data = await res.json()
        setBrainState(prev => ({
          ...prev,
          sensoryDocuments: data.sensory,
          graphRelations: data.semantic.nodes + data.semantic.edges,
          workingMemory: data.working,
          cognitiveState: data.state || 'IDLE'
        }))
      } catch (err) {
        console.error('Failed to fetch brain vitals:', err)
      }
    }

    const fetchSparks = async () => {
      try {
        const res = await fetch(`/api/v1/brain/sparks?user_id=${currentPersona}`)
        const data = await res.json()
        setBrainState(prev => ({ ...prev, sparks: data }))
      } catch (err) {
        console.error('Failed to fetch neural sparks:', err)
      }
    }

    fetchVitals()
    fetchSparks()
    const interval = setInterval(() => { fetchVitals(); fetchSparks() }, 20000)
    return () => clearInterval(interval)
  }, [currentPersona])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/history?user_id=${currentPersona}`)
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error('Failed to fetch chat history:', err)
      }
    }
    fetchHistory()
  }, [currentPersona])

  return (
    <div className={`app-container state-${brainState.cognitiveState.toLowerCase()}`}>

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      {/* ── Header ── */}
      <header className="app-header">
        <div className="logo-section">
          <div className="brain-pulse-icon" />
          <h1>SOMA</h1>
          <span className="logo-tagline">Cognitive AI</span>
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
          <button
            className="help-btn"
            onClick={() => setShowOnboarding(true)}
            title="System Overview"
          >?</button>

          <div className={`state-pill ${brainState.isLoading ? 'thinking' : 'idle'}`}>
            <span className="state-dot" />
            <span>{brainState.cognitiveState}</span>
          </div>

          <button
            className="sleep-btn-header"
            onClick={async () => {
              setBrainState(prev => ({ ...prev, isLoading: true, statusMessage: 'Sleeping...', cognitiveState: 'SLEEPING' }))
              try {
                const res = await fetch('/api/v1/sleep', { method: 'POST' })
                const data = await res.json()
                setBrainState(prev => ({
                  ...prev,
                  isLoading: false,
                  statusMessage: `Sleep done. ${data.graph_relations_extracted} relations extracted.`,
                  cognitiveState: 'IDLE'
                }))
              } catch {
                setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Sleep failed.', cognitiveState: 'IDLE' }))
              }
            }}
            disabled={brainState.isLoading}
          >
            💤 Sleep
          </button>

          <select
            className="persona-select label-mono"
            value={currentPersona}
            onChange={e => setCurrentPersona(e.target.value)}
          >
            <option value="User_Alpha">Alpha</option>
            <option value="User_Beta">Beta</option>
            <option value="System_Admin">Admin</option>
          </select>
        </div>
      </header>

      {/* ── Three-Column Layout ── */}
      <div className="tri-layout">

        {/* LEFT — Chat */}
        <div className="col-chat">
          <ChatPanel
            messages={messages}
            setMessages={setMessages}
            brainState={brainState}
            setBrainState={setBrainState}
            isLoading={brainState.isLoading}
            currentPersona={currentPersona}
          />
        </div>

        {/* CENTER — Cognitive Architecture */}
        <div className="col-brain">
          <BrainProcess
            brainState={brainState}
            setBrainState={setBrainState}
            currentPersona={currentPersona}
          />
        </div>

        {/* RIGHT — Knowledge Mesh or Dreams */}
        <div className="col-graph">
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
