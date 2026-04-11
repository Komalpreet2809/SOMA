import { useState, useEffect, useRef, useCallback } from 'react'
import ChatPanel from './components/ChatPanel'
import BrainProcess from './components/BrainProcess'
import KnowledgeGraph from './components/KnowledgeGraph'
import DreamSequence from './components/DreamSequence'
import Onboarding from './components/Onboarding'
import AuthScreen from './components/AuthScreen'
import { apiFetch } from './api'
import './App.css'

function App() {
  const [currentUser,     setCurrentUser]     = useState(() => localStorage.getItem('soma_username') || null)
  const [messages,        setMessages]        = useState([])
  const [brainState,      setBrainState]      = useState({
    sensoryDocuments: 0,
    graphRelations:   0,
    workingMemory:    0,
    statusMessage:    'Brain idle.',
    isLoading:        false,
    reflection:       '',
    highlightedNodes: [],
    sparks:           [],
    cognitiveState:   'IDLE',
    traces:           []
  })
  const [rightPanel,       setRightPanel]       = useState('graph')
  const [showOnboarding,   setShowOnboarding]   = useState(false)
  const [theme,            setTheme]            = useState(() => localStorage.getItem('soma_theme') || 'dark')
  const [graphRefreshTick, setGraphRefreshTick] = useState(0)
  const [sleepModal,       setSleepModal]       = useState(null)

  // ── Resizable columns ──
  const [colWidths, setColWidths] = useState([30, 32, 38])
  const dragRef    = useRef(null)
  const layoutRef  = useRef(null)

  const startDrag = useCallback((dividerIndex, e) => {
    e.preventDefault()
    dragRef.current = { divider: dividerIndex, startX: e.clientX, startWidths: [...colWidths] }

    const onMove = (ev) => {
      if (!dragRef.current || !layoutRef.current) return
      const totalW = layoutRef.current.getBoundingClientRect().width
      const dx     = ((ev.clientX - dragRef.current.startX) / totalW) * 100
      const { divider, startWidths } = dragRef.current
      const next = [...startWidths]
      next[divider]     = Math.max(18, startWidths[divider]     + dx)
      next[divider + 1] = Math.max(18, startWidths[divider + 1] - dx)
      const scale = 100 / next.reduce((a, b) => a + b, 0)
      setColWidths(next.map(w => w * scale))
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [colWidths])

  // ── Theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('soma_theme', theme)
  }, [theme])

  // ── First visit onboarding ──
  useEffect(() => {
    if (currentUser && !localStorage.getItem('soma_visited')) {
      setShowOnboarding(true)
      localStorage.setItem('soma_visited', 'true')
    }
  }, [currentUser])

  // ── Poll vitals & sparks (only when logged in) ──
  useEffect(() => {
    if (!currentUser) return

    const fetchVitals = async () => {
      try {
        const res  = await apiFetch(`/api/v1/brain/vitals`)
        if (!res.ok) return
        const data = await res.json()
        setBrainState(prev => ({
          ...prev,
          sensoryDocuments: data.sensory,
          graphRelations:   data.semantic.nodes + data.semantic.edges,
          workingMemory:    data.working,
          cognitiveState:   data.state || 'IDLE'
        }))
      } catch { /* backend offline */ }
    }

    const fetchSparks = async () => {
      try {
        const res  = await apiFetch(`/api/v1/brain/sparks`)
        if (!res.ok) return
        const data = await res.json()
        setBrainState(prev => ({ ...prev, sparks: data }))
      } catch { /* silent */ }
    }

    fetchVitals(); fetchSparks()
    const id = setInterval(() => { fetchVitals(); fetchSparks() }, 20000)
    return () => clearInterval(id)
  }, [currentUser])

  // ── Chat history on login ──
  useEffect(() => {
    if (!currentUser) return
    const load = async () => {
      try {
        const res  = await apiFetch(`/api/v1/history`)
        if (!res.ok) return
        const data = await res.json()
        setMessages(data.messages || [])
      } catch { /* silent */ }
    }
    load()
  }, [currentUser])

  // ── Sleep ──
  const handleSleep = async () => {
    setBrainState(prev => ({ ...prev, isLoading: true, cognitiveState: 'SLEEPING' }))
    try {
      const res  = await apiFetch('/api/v1/sleep', { method: 'POST' })
      const data = await res.json()
      setBrainState(prev => ({ ...prev, isLoading: false, cognitiveState: 'IDLE', statusMessage: 'Memory consolidated.' }))
      setSleepModal({ pruned: data.messages_pruned ?? 0, relations: data.graph_relations_extracted ?? 0 })
    } catch {
      setBrainState(prev => ({ ...prev, isLoading: false, cognitiveState: 'IDLE', statusMessage: 'Sleep failed.' }))
    }
  }

  // ── Graph refresh after chat ──
  const handleChatComplete = useCallback(() => {
    setGraphRefreshTick(t => t + 1)
  }, [])

  // ── Auth ──
  const handleAuth = (username) => {
    setCurrentUser(username)
    setMessages([])
  }

  const handleLogout = () => {
    localStorage.removeItem('soma_token')
    localStorage.removeItem('soma_username')
    setCurrentUser(null)
    setMessages([])
    setBrainState(prev => ({ ...prev, sensoryDocuments: 0, graphRelations: 0, workingMemory: 0, sparks: [] }))
  }

  // ── Show auth screen if not logged in ──
  if (!currentUser) {
    return (
      <div data-theme={theme}>
        <AuthScreen onAuth={handleAuth} />
      </div>
    )
  }

  return (
    <div className={`app-root state-${brainState.cognitiveState.toLowerCase()}`}>

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      {/* ── Sleep Modal ── */}
      {sleepModal && (
        <div className="sleep-modal-overlay" onClick={() => setSleepModal(null)}>
          <div className="sleep-modal" onClick={e => e.stopPropagation()}>
            <div className="sm-icon">💤</div>
            <h2 className="sm-title t-display">Memory Consolidated</h2>
            <div className="sm-stats">
              <div className="sm-stat">
                <span className="sm-num">{sleepModal.pruned}</span>
                <span className="sm-lbl t-label">Messages pruned</span>
              </div>
              <div className="sm-divider" />
              <div className="sm-stat">
                <span className="sm-num">{sleepModal.relations}</span>
                <span className="sm-lbl t-label">Relations extracted</span>
              </div>
            </div>
            <p className="sm-desc">
              Short-term memories were compressed and woven into the knowledge graph. The brain is leaner and smarter.
            </p>
            <button className="sm-close" onClick={() => setSleepModal(null)}>Got it</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-orb">
            <div className="orb-ring r1" /><div className="orb-ring r2" /><div className="orb-ring r3" />
            <div className="orb-core" />
          </div>
          <div className="logo-text">
            <span className="logo-name">SOMA</span>
            <span className="logo-sub t-label">Cognitive AI</span>
          </div>
        </div>

        <div className="header-center" />

        <div className="header-controls">
          <div className="view-tabs">
            <button className={`view-tab ${rightPanel === 'graph'  ? 'active' : ''}`} onClick={() => setRightPanel('graph')}>Mesh</button>
            <button className={`view-tab ${rightPanel === 'dreams' ? 'active' : ''}`} onClick={() => setRightPanel('dreams')}>Dreams</button>
          </div>

          <button className="sleep-btn" onClick={handleSleep} disabled={brainState.isLoading} title="Consolidate memories">
            Sleep
          </button>

          {/* Logged-in user + logout */}
          <div className="user-chip">
            <span className="user-chip-name t-label">{currentUser}</span>
            <button className="user-logout-btn t-label" onClick={handleLogout} title="Sign out">↩</button>
          </div>

          <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <button className="help-btn t-label" onClick={() => setShowOnboarding(true)}>?</button>
        </div>
      </header>

      {/* ── Three-Column Resizable Layout ── */}
      <div className="tri-layout" ref={layoutRef}>

        <div className="col-chat" style={{ width: `${colWidths[0]}%` }}>
          <ChatPanel
            messages={messages}
            setMessages={setMessages}
            brainState={brainState}
            setBrainState={setBrainState}
            isLoading={brainState.isLoading}
            currentUser={currentUser}
            onChatComplete={handleChatComplete}
          />
        </div>

        <div className="resize-handle" onMouseDown={e => startDrag(0, e)} />

        <div className="col-brain" style={{ width: `${colWidths[1]}%` }}>
          <BrainProcess
            brainState={brainState}
            messageCount={messages.length}
          />
        </div>

        <div className="resize-handle" onMouseDown={e => startDrag(1, e)} />

        <div className="col-graph" style={{ width: `${colWidths[2]}%` }}>
          {rightPanel === 'graph'
            ? <KnowledgeGraph
                highlightedNodes={brainState.highlightedNodes}
                currentUser={currentUser}
                refreshTick={graphRefreshTick}
              />
            : <DreamSequence sparks={brainState.sparks} />
          }
        </div>

      </div>
    </div>
  )
}

export default App
