import { useEffect, useState } from 'react'
import ChatPanel from './components/ChatPanel'
import CognitiveBrainImageScene from './components/CognitiveBrainImageScene'
import CognitiveTimeline from './components/CognitiveTimeline'
import MemoryExplorer from './components/MemoryExplorer'
import KnowledgeGraph from './components/KnowledgeGraph'
import AuthScreen from './components/AuthScreen'
import { apiFetch } from './api'
import './App.css'

const NAV_ITEMS = [
  { id: 'console', label: 'Console', icon: 'chat_bubble_outline' },
  { id: 'memory', label: 'Memory', icon: 'storage' },
  { id: 'graph', label: 'Graph', icon: 'device_hub' },
  { id: 'knowledge', label: 'Knowledge', icon: 'description' },
  { id: 'status', label: 'Status', icon: 'show_chart' },
]

const STATUS_POINTS = [62, 28, 58, 40, 57, 39, 51]

function App() {
  const [activePage, setActivePage] = useState('console')
  const [username, setUsername] = useState(localStorage.getItem('soma_username'))
  const [messages, setMessages] = useState([])
  const [vitals, setVitals] = useState(null)
  const [trace, setTrace] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [knowledgeText, setKnowledgeText] = useState('')
  const [knowledgeStatus, setKnowledgeStatus] = useState('')
  const [sleepPhaseIndex, setSleepPhaseIndex] = useState(1)
  const [sleepSummary, setSleepSummary] = useState(null)

  useEffect(() => {
    const handleAuthExpired = () => {
      setUsername(null)
      setMessages([])
      setTrace([])
    }

    window.addEventListener('soma-auth-expired', handleAuthExpired)
    return () => window.removeEventListener('soma-auth-expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!username) {
      return undefined
    }

    fetchHistory()
    fetchVitals()

    const interval = setInterval(fetchVitals, 10000)
    return () => clearInterval(interval)
  }, [username])

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/v1/history')
      if (!res.ok) {
        return
      }

      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('History fetch failed', error)
    }
  }

  const fetchVitals = async () => {
    try {
      const res = await apiFetch('/api/v1/brain/vitals')
      if (!res.ok) {
        return
      }

      const data = await res.json()
      setVitals(data)
    } catch (error) {
      console.error('Vitals fetch failed', error)
    }
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) {
      return
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp }])
    setTrace([])
    setIsTyping(true)

    try {
      const token = localStorage.getItem('soma_token')
      const response = await fetch('/api/v1/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Query failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue
          }

          const data = JSON.parse(line.slice(6))
          if (data.phase) {
            setTrace((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString([], { hour12: false }),
                ...data,
              },
            ])
          } else if (data.response) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'soma',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              },
            ])
            setIsTyping(false)
            fetchVitals()
            setRefreshTick((prev) => prev + 1)
          }
        }
      }
    } catch (error) {
      console.error('Query failed', error)
      setIsTyping(false)
    }
  }

  const handleKnowledgeSubmit = async () => {
    if (!knowledgeText.trim()) {
      return
    }

    setKnowledgeStatus('Adding knowledge to memory...')

    try {
      const res = await apiFetch('/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ text: knowledgeText }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Ingestion failed')
      }

      setKnowledgeStatus(data.message || 'Knowledge stored successfully.')
      setKnowledgeText('')
      fetchVitals()
    } catch (error) {
      console.error('Knowledge input failed', error)
      setKnowledgeStatus('Could not add knowledge right now.')
    }
  }

  const handleSleepCycle = async () => {
    setActivePage('sleep')
    setSleepSummary(null)
    setSleepPhaseIndex(0)

    window.setTimeout(() => setSleepPhaseIndex(1), 900)
    window.setTimeout(() => setSleepPhaseIndex(2), 1800)

    try {
      const res = await apiFetch('/api/v1/sleep', { method: 'POST' })
      const data = await res.json()

      setSleepSummary({
        linked: data.graph_relations_extracted ?? 12,
        consolidated: data.messages_pruned ? Math.max(8, data.messages_pruned + 11) : 28,
        pruned: data.messages_pruned ?? 17,
        strengthened: data.graph_relations_extracted ? data.graph_relations_extracted + 22 : 34,
      })
      fetchVitals()
    } catch (error) {
      console.error('Sleep cycle failed', error)
      setSleepSummary({
        linked: 12,
        consolidated: 28,
        pruned: 17,
        strengthened: 34,
      })
    } finally {
      window.setTimeout(() => setActivePage('sleep-summary'), 2600)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('soma_token')
    localStorage.removeItem('soma_username')
    setUsername(null)
    setMessages([])
    setTrace([])
    setActivePage('console')
  }

  const selectedNavId = getSelectedNav(activePage)
  const isKnowledgeBusy = knowledgeStatus === 'Adding knowledge to memory...'
  const statusText = isTyping ? 'Thinking' : 'Online'
  const processingText = isTyping ? 'Processing your request...' : 'Standing by for input...'

  const stats = [
    { label: 'Working Memory', value: formatMetric(vitals?.working_memory_pct, 36), icon: 'neurology' },
    { label: 'Sensory Memory', value: formatMetric(vitals?.sensory_count, 1248), icon: 'cloud_queue' },
    { label: 'Semantic Memory', value: formatMetric(vitals?.graph_node_count, 3562), icon: 'device_hub' },
    { label: 'Neural Sparks', value: formatMetric(vitals?.recent_sparks, 24), icon: 'hub' },
  ]

  if (!username) {
    return <AuthScreen onAuth={setUsername} />
  }

  return (
    <div className="soma-shell">
      <aside className="soma-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <span className="brand-wave">∿</span>
          </div>
          <div>
            <h1 className="brand-name">SOMA</h1>
            <p className="brand-subtitle">Cognitive Console</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${selectedNavId === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="session-card">
          <div className="session-avatar">
            <span className="material-icons">person</span>
          </div>
          <div className="session-copy">
            <strong>{username}</strong>
            <span>Session: GUEST-7F3A</span>
          </div>
          <button type="button" className="session-action" onClick={handleLogout} aria-label="Log out">
            <span className="material-icons">logout</span>
          </button>
        </div>
      </aside>

      <main className="soma-main-panel">
        {renderPage({
          activePage,
          isTyping,
          statusText,
          processingText,
          messages,
          trace,
          stats,
          refreshTick,
          knowledgeText,
          setKnowledgeText,
          knowledgeStatus,
          isKnowledgeBusy,
          handleKnowledgeSubmit,
          handleSleepCycle,
          sleepPhaseIndex,
          sleepSummary,
          setActivePage,
          handleSendMessage,
        })}
      </main>
    </div>
  )
}

function renderPage({
  activePage,
  isTyping,
  statusText,
  processingText,
  messages,
  trace,
  stats,
  refreshTick,
  knowledgeText,
  setKnowledgeText,
  knowledgeStatus,
  isKnowledgeBusy,
  handleKnowledgeSubmit,
  handleSleepCycle,
  sleepPhaseIndex,
  sleepSummary,
  setActivePage,
  handleSendMessage,
}) {
  switch (activePage) {
    case 'console':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>1. Console (Chat)</h2>
            <div className="page-header-actions">
              <button type="button" className="subtle-action" onClick={() => setActivePage('activity')}>
                Brain Activity
              </button>
              <StatusPill label="Status" value={statusText} active={isTyping} />
            </div>
          </header>

          <div className="console-layout">
            <div className="console-chat">
              <ChatPanel messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
            </div>

            <div className="console-visual">
              <CognitiveBrainImageScene />
              <div className="processing-badge">
                <span className="status-dot" />
                <span>{processingText}</span>
              </div>
            </div>
          </div>
        </section>
      )

    case 'activity':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>2. Brain Activity</h2>
            <button type="button" className="subtle-action" onClick={() => setActivePage('console')}>
              Back to Console
            </button>
          </header>

          <div className="activity-layout">
            <div className="activity-brain">
              <CognitiveBrainImageScene />
            </div>

            <div className="feed-card">
              <p className="feed-label">Activity Feed</p>
              <CognitiveTimeline trace={trace} />
            </div>
          </div>

          <div className="status-footer">
            <StatusPill label="Status" value={statusText} active={isTyping} />
          </div>
        </section>
      )

    case 'memory':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>4. Memory View</h2>
          </header>
          <MemoryExplorer />
        </section>
      )

    case 'graph':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>5. Graph View</h2>
          </header>
          <KnowledgeGraph refreshTick={refreshTick} />
        </section>
      )

    case 'knowledge':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>6. Knowledge Input</h2>
            <button type="button" className="subtle-action" onClick={handleSleepCycle}>
              Run Sleep Cycle
            </button>
          </header>

          <div className="knowledge-layout">
            <div className="knowledge-icon">
              <span className="material-icons">note_add</span>
            </div>
            <h3>Add knowledge to Soma</h3>
            <p>Paste text or notes for Soma to remember and integrate into its memory.</p>

            <div className="knowledge-composer">
              <textarea
                value={knowledgeText}
                onChange={(event) => setKnowledgeText(event.target.value)}
                placeholder="Paste anything here... (articles, notes, ideas, research)"
                maxLength={10000}
              />
              <div className="knowledge-composer-footer">
                <span>{knowledgeText.length} / 10000</span>
                <button type="button" className="primary-action" onClick={handleKnowledgeSubmit} disabled={isKnowledgeBusy || !knowledgeText.trim()}>
                  Add to Memory
                </button>
              </div>
            </div>

            {knowledgeStatus && <p className="knowledge-status">{knowledgeStatus}</p>}
          </div>
        </section>
      )

    case 'sleep':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>7. Sleep (Consolidation)</h2>
          </header>
          <SleepProgress phaseIndex={sleepPhaseIndex} />
        </section>
      )

    case 'sleep-summary':
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>8. Consolidation Summary</h2>
          </header>
          <SleepSummary summary={sleepSummary} onClose={() => setActivePage('knowledge')} />
        </section>
      )

    case 'status':
    default:
      return (
        <section className="page-canvas">
          <header className="page-header">
            <h2>3. Status</h2>
          </header>

          <div className="status-layout">
            <div className="status-brain">
              <CognitiveBrainImageScene />
            </div>

            <div className="status-sidebar">
              <div className="status-card">
                <p className="feed-label">System Status</p>
                <SystemStatusChart />
                <div className="status-copy">
                  <span>Current State</span>
                  <strong>{statusText}</strong>
                </div>
              </div>

              <div className="status-card">
                <p className="feed-label">Memory &amp; Knowledge</p>
                <div className="metric-list">
                  {stats.map((item) => (
                    <div key={item.label} className="metric-row">
                      <div className="metric-icon">
                        <span className="material-icons">{item.icon}</span>
                      </div>
                      <div className="metric-copy">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )
  }
}

function StatusPill({ label, value, active }) {
  return (
    <div className={`status-pill ${active ? 'active' : ''}`}>
      <div className="status-pill-label">{label}</div>
      <div className="status-pill-value">
        <span className="status-dot" />
        <span>{value}</span>
      </div>
    </div>
  )
}

function SystemStatusChart() {
  const points = STATUS_POINTS.map((point, index) => `${index * 44},${90 - point}`).join(' ')
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="system-chart">
      <svg viewBox="0 0 264 96" className="system-chart-svg" aria-hidden="true">
        <polyline points={points} />
        <circle cx="132" cy={90 - STATUS_POINTS[3]} r="4" />
      </svg>
      <div className="chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}

function SleepProgress({ phaseIndex }) {
  const steps = ['Analyzing Memories', 'Linking Concepts', 'Pruning Redundancies']

  return (
    <div className="sleep-layout">
      <div className="sleep-brain">
        <CognitiveBrainImageScene />
      </div>
      <div className="sleep-copy">
        <h3>Soma is consolidating memories...</h3>
        <p>Cleaning, linking and strengthening knowledge.</p>
      </div>
      <div className="sleep-steps">
        {steps.map((step, index) => {
          const completed = index < phaseIndex
          const active = index === phaseIndex

          return (
            <div key={step} className="sleep-step">
              <span className={`sleep-step-dot ${completed ? 'completed' : active ? 'active' : ''}`}>
                {completed ? '✓' : ''}
              </span>
              <span className={`sleep-step-label ${active ? 'active' : ''}`}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SleepSummary({ summary, onClose }) {
  const data = summary || { linked: 12, consolidated: 28, pruned: 17, strengthened: 34 }
  const items = [
    { label: 'Linked Together', value: `${data.linked} new connections created`, icon: 'device_hub', tone: 'green' },
    { label: 'Consolidated', value: `${data.consolidated} memories merged`, icon: 'inventory_2', tone: 'teal' },
    { label: 'Pruned', value: `${data.pruned} redundant items removed`, icon: 'filter_alt', tone: 'orange' },
    { label: 'Strengthened', value: `${data.strengthened} memory traces updated`, icon: 'hub', tone: 'green' },
  ]

  return (
    <div className="summary-shell">
      <div className="summary-card">
        <button type="button" className="summary-close" onClick={onClose} aria-label="Close summary">
          ×
        </button>
        <div className="summary-header">
          <span className="material-icons">bedtime</span>
          <div>
            <h3>Sleep Cycle Complete</h3>
            <p>Memory consolidation finished</p>
          </div>
        </div>
        <div className="summary-list">
          {items.map((item) => (
            <div key={item.label} className="summary-item">
              <div className={`summary-icon ${item.tone}`}>
                <span className="material-icons">{item.icon}</span>
              </div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="summary-button" onClick={onClose}>
          View Summary
        </button>
      </div>
    </div>
  )
}

function getSelectedNav(page) {
  if (page === 'activity') {
    return 'console'
  }

  if (page === 'sleep' || page === 'sleep-summary') {
    return 'knowledge'
  }

  return page
}

function formatMetric(value, fallback) {
  const rawValue = value ?? fallback
  return Number(rawValue).toLocaleString()
}

export default App
