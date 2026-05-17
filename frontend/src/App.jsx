import { useEffect, useState, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import CognitiveBrainImageScene from './components/CognitiveBrainImageScene';
import CognitiveTimeline from './components/CognitiveTimeline';
import MemoryExplorer from './components/MemoryExplorer';
import KnowledgeGraph from './components/KnowledgeGraph';
import CognitiveDashboard from './components/CognitiveDashboard';
import KnowledgeInput from './components/KnowledgeInput';
import { SleepProgress } from './components/DreamSequence';
import AuthScreen from './components/AuthScreen';
import { apiFetch } from './api';
import './App.css';

const NAV_ITEMS = [
  { id: 'console', label: 'Console', icon: 'chat_bubble_outline' },
  { id: 'memory', label: 'Memory', icon: 'layers' },
  { id: 'graph', label: 'Graph', icon: 'share' },
  { id: 'knowledge', label: 'Inscription', icon: 'auto_awesome' },
  { id: 'sleep', label: 'Sleep', icon: 'bedtime' },
];

const COGNITIVE_PHASES = {
  PERCEPTION: 'perception',
  ATTENTION: 'attention',
  RECALL: 'recall',
  REASONING: 'reasoning',
  RESPONDING: 'responding',
  IDLE: 'idle',
  LISTENING: 'listening'
};

function App() {
  const [activePage, setActivePage] = useState('console');
  const [username, setUsername] = useState(localStorage.getItem('soma_username'));
  const [messages, setMessages] = useState([]);
  const [vitals, setVitals] = useState(null);
  const [trace, setTrace] = useState([]);
  const [cognitiveState, setCognitiveState] = useState(COGNITIVE_PHASES.IDLE);
  const [refreshTick, setRefreshTick] = useState(0);
  const [knowledgeStatus, setKnowledgeStatus] = useState('');
  const [sleepPhaseIndex, setSleepPhaseIndex] = useState(0);
  const [sleepSummary, setSleepSummary] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('soma_dark') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('soma_dark', 'true');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('soma_dark', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!username) return;
    fetchHistory();
    fetchVitals();
    const interval = setInterval(fetchVitals, 10000);
    return () => clearInterval(interval);
  }, [username]);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/v1/history');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) { console.error('History fetch failed', error); }
  };

  const fetchVitals = async () => {
    try {
      const res = await apiFetch('/api/v1/brain/vitals');
      if (res.ok) {
        const data = await res.json();
        setVitals(data);
      }
    } catch (error) { console.error('Vitals fetch failed', error); }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp }]);
    setTrace([]);

    // Remove artificial frontend phases since backend now streams them.

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const token = localStorage.getItem('soma_token');
      const response = await fetch('/api/v1/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) throw new Error('Query failed');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.phase) {
              // Live trace and state updates from backend
              setCognitiveState(data.phase);
              if (data.message) {
                setTrace(prev => [{ time: new Date().toLocaleTimeString([], { hour12: false }), ...data }, ...prev]);
              }
            } else if (data.response) {
              // Phase E: Response Generation
              setCognitiveState(COGNITIVE_PHASES.RESPONDING);
              setMessages(prev => [...prev, { 
                role: 'soma', 
                content: data.response, 
                timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
              }]);
              
              fetchVitals();
              setRefreshTick(prev => prev + 1);
            }
          } catch (e) {
            console.error('JSON parse error', e);
          }
        }
      }
    } catch (error) {
      console.error('Query failed', error);
      setTrace(prev => [{ phase: 'Error', content: 'Neural connection interrupted.', time: 'ERROR' }, ...prev]);
    } finally {
      // Ensure we always return to idle
      setCognitiveState(COGNITIVE_PHASES.IDLE);
    }
  };

  const handleKnowledgeSubmit = async (text) => {
    setKnowledgeStatus('Integrating knowledge into neural layers...');
    try {
      const res = await apiFetch('/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Ingestion failed');
      setKnowledgeStatus(data.message || 'Knowledge stored successfully.');
      setTimeout(() => setKnowledgeStatus(''), 10000);
      fetchVitals();
    } catch (error) {
      setKnowledgeStatus('Neural integration failed: ' + error.message);
    }
  };

  const handleSleepCycle = async () => {
    setCognitiveState('consolidating');
    setActivePage('sleep');
    setSleepPhaseIndex(0);
    setSleepSummary(null);

    // Animate checklist steps gracefully during the pending API request
    const stepInterval = setInterval(() => {
      setSleepPhaseIndex(prev => {
        if (prev < 2) return prev + 1;
        return prev;
      });
    }, 1000);

    try {
      const res = await apiFetch('/api/v1/sleep', { method: 'POST' });
      const data = await res.json();
      
      clearInterval(stepInterval);
      setSleepPhaseIndex(2); // Mark all checklists as complete

      setSleepSummary({
        linked: data.graph_relations_extracted || 0,
        consolidated: data.summaries_created || 0,
        pruned: data.messages_pruned || 0
      });
    } catch (error) {
      clearInterval(stepInterval);
      console.error("Sleep cycle failed:", error);
      setSleepSummary({ linked: 0, consolidated: 0, pruned: 0 });
    } finally {
      setCognitiveState(COGNITIVE_PHASES.IDLE);
      fetchVitals(); // Instantly update vitals to reflect pruned/cleared working queue
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUsername(null);
    setMessages([]);
    setActivePage('console');
  };

  if (!username) return <AuthScreen onAuth={setUsername} />;

  const stats = [
    { label: 'Working Memory', value: vitals?.working || '0', icon: 'psychology' },
    { label: 'Sensory Memory', value: vitals?.sensory || '0', icon: 'cloud' },
    { label: 'Semantic Memory', value: vitals?.semantic?.nodes || '0', icon: 'account_tree' },
    { label: 'Neural Sparks', value: vitals?.semantic?.edges || '0', icon: 'auto_awesome' },
  ];

  return (
    <div className="soma-shell">
      <aside className="soma-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <span className="material-icons">lens_blur</span>
          </div>
          <div className="brand-copy">
            <h1>SOMA</h1>
            <p>Cognitive Console</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id}
              className={`sidebar-link ${activePage === item.id || (activePage === 'activity' && item.id === 'console') ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <button 
            className="sidebar-link theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            style={{marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '16px'}}
            title="Toggle Dark/Light Mode"
          >
            <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            <span>{darkMode ? 'Light UI' : 'Dark UI'}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="session-card">
            <div className="session-avatar">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar" />
            </div>
            <div className="session-copy">
              <strong>{username}</strong>
              <span>GUEST-7F3A</span>
            </div>
            <button style={{marginLeft: 'auto', color: '#999', background: 'transparent'}} onClick={handleLogout}>
              <span className="material-icons" style={{fontSize: '18px'}}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="soma-main-panel">
        {activePage === 'console' && (
          <section className="page-canvas fade-in">
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Cognitive Console</h2>
              <button 
                className={`telemetry-trigger ${showStatus ? 'active' : ''}`}
                onClick={() => setShowStatus(!showStatus)}
                title="Toggle System Telemetry"
              >
                <span className="material-icons">analytics</span>
              </button>
            </div>
            
            <div className="canvas-body" style={{display: 'flex', flex: 1, gap: '40px', minHeight: 0}}>
              {/* Interaction Layer (The Chat) */}
              <div className="chat-container" style={{flex: 0.7, display: 'flex', flexDirection: 'column'}}>
                <ChatPanel 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  onNewChat={() => {
                    setMessages([]);
                    setTrace([]);
                  }}
                  userAvatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                  isTyping={cognitiveState !== COGNITIVE_PHASES.IDLE && cognitiveState !== COGNITIVE_PHASES.LISTENING}
                  onInputStateChange={(isTyping) => {
                    if (cognitiveState === COGNITIVE_PHASES.IDLE && isTyping) setCognitiveState(COGNITIVE_PHASES.LISTENING);
                    if (cognitiveState === COGNITIVE_PHASES.LISTENING && !isTyping) setCognitiveState(COGNITIVE_PHASES.IDLE);
                  }}
                />
              </div>

              {/* Cognitive Layer (The Brain) */}
              <div className="cognitive-container" style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                <CognitiveBrainImageScene state={cognitiveState} />
                <div className="status-pill" style={{marginTop: '32px'}}>
                  <span className="label">Status</span>
                  <div className="value">
                    <div className={`status-dot ${cognitiveState !== COGNITIVE_PHASES.IDLE ? 'pulse' : ''}`} />
                    <span style={{textTransform: 'capitalize'}}>{cognitiveState}</span>
                  </div>
                </div>
              </div>

              {/* Activity Layer (The Timeline) */}
              <div className="activity-feed-wrapper" style={{flex: 0.6, maxWidth: '280px', display: 'flex', flexDirection: 'column', padding: '0', margin: '-50px 0 0 0', height: 'calc(100% + 50px)'}}>
                 <h3 style={{fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', marginTop: 0, marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 700}}>Activity Feed</h3>
                 <div style={{flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px'}}>
                   <CognitiveTimeline trace={trace} />
                 </div>
              </div>
            </div>
          </section>
        )}

        {activePage === 'activity' && (
          <section className="page-canvas fade-in">
            <div className="page-header">
              <h2>Neural Activity</h2>
              <button className="sidebar-link" style={{background: 'white'}} onClick={() => setActivePage('console')}>
                Back to Console
              </button>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', height: '100%'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <CognitiveBrainImageScene state={cognitiveState} />
              </div>
              <div className="status-card" style={{display: 'flex', flexDirection: 'column', height: '90%', padding: '0'}}>
                 <h3 style={{fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', marginBottom: '32px', letterSpacing: '0.1em', fontWeight: 700}}>Full Activity Log</h3>
                 <div style={{flex: 1, overflowY: 'auto'}}><CognitiveTimeline trace={trace} /></div>
              </div>
            </div>
          </section>
        )}

        {showStatus && (
          <div className="telemetry-overlay" onClick={() => setShowStatus(false)}>
            <div className="telemetry-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>System Telemetry</h3>
                <button className="modal-close" onClick={() => setShowStatus(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-scroll-area">
                <CognitiveDashboard statusText={cognitiveState} stats={stats} />
              </div>
            </div>
          </div>
        )}

        {activePage === 'memory' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>Neural Memory</h2></div>
            <MemoryExplorer />
          </section>
        )}

        {activePage === 'graph' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>Knowledge Graph</h2></div>
            <KnowledgeGraph refreshTick={refreshTick} />
          </section>
        )}

        {activePage === 'knowledge' && (
          <section className="page-canvas fade-in">
            <div className="page-header">
              <h2>Neural Inscription</h2>
            </div>
            <KnowledgeInput onKnowledgeSubmit={handleKnowledgeSubmit} isBusy={knowledgeStatus.includes('Adding')} status={knowledgeStatus} />
          </section>
        )}

        {activePage === 'sleep' && (
          <SleepProgress 
            phaseIndex={sleepPhaseIndex} 
            isConsolidating={cognitiveState === 'consolidating'} 
            onStart={handleSleepCycle} 
            summary={sleepSummary}
            vitals={vitals}
            onClose={() => {
              setCognitiveState(COGNITIVE_PHASES.IDLE);
              setSleepPhaseIndex(0);
              setSleepSummary(null);
              setActivePage('console');
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
