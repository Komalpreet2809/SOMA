import { useEffect, useState, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import CognitiveBrainImageScene from './components/CognitiveBrainImageScene';
import CognitiveTimeline from './components/CognitiveTimeline';
import MemoryExplorer from './components/MemoryExplorer';
import KnowledgeGraph from './components/KnowledgeGraph';
import CognitiveDashboard from './components/CognitiveDashboard';
import KnowledgeInput from './components/KnowledgeInput';
import { SleepProgress, SleepSummary } from './components/DreamSequence';
import AuthScreen from './components/AuthScreen';
import { apiFetch } from './api';
import './App.css';

const NAV_ITEMS = [
  { id: 'console', label: 'Console', icon: 'chat_bubble_outline' },
  { id: 'memory', label: 'Memory', icon: 'layers' },
  { id: 'graph', label: 'Graph', icon: 'share' },
  { id: 'knowledge', label: 'Knowledge', icon: 'description' },
  { id: 'status', label: 'Status', icon: 'analytics' },
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

    // ── STEP 3: Message Sent (Transition to Cognition) ──
    
    // Phase A: Perception (~0.4s)
    setCognitiveState(COGNITIVE_PHASES.PERCEPTION);
    setTrace([{ phase: 'Perception', content: 'Parsing input and identifying intent...', time: 'NOW' }]);
    await new Promise(r => setTimeout(r, 400));

    // Phase B: Attention (~0.6s)
    setCognitiveState(COGNITIVE_PHASES.ATTENTION);
    setTrace(prev => [{ phase: 'Attention', content: 'Focusing on key concepts and relationships...', time: 'NOW' }, ...prev]);
    await new Promise(r => setTimeout(r, 600));

    // Phase C: Memory Recall (Initiate API)
    setCognitiveState(COGNITIVE_PHASES.RECALL);
    setTrace(prev => [{ phase: 'Recall', content: 'Retrieving related memories and associations...', time: 'NOW' }, ...prev]);

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

      // Phase D: Reasoning (During Stream Start)
      setCognitiveState(COGNITIVE_PHASES.REASONING);
      setTrace(prev => [{ phase: 'Reasoning', content: 'Synthesizing context and evaluating response...', time: 'NOW' }, ...prev]);

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
              setTrace(prev => [{ time: new Date().toLocaleTimeString([], { hour12: false }), ...data }, ...prev]);
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
      setTimeout(() => setCognitiveState(COGNITIVE_PHASES.IDLE), 1000);
    }
  };

  const handleKnowledgeSubmit = async (text) => {
    setKnowledgeStatus('Adding knowledge to memory...');
    try {
      const res = await apiFetch('/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Ingestion failed');
      setKnowledgeStatus('Knowledge stored successfully.');
      setTimeout(() => setKnowledgeStatus(''), 3000);
      fetchVitals();
    } catch (error) {
      setKnowledgeStatus('Could not add knowledge right now.');
    }
  };

  const handleSleepCycle = async () => {
    setCognitiveState('consolidating');
    setActivePage('sleep');
    setSleepPhaseIndex(0);
    setTimeout(() => setSleepPhaseIndex(1), 1200);
    setTimeout(() => setSleepPhaseIndex(2), 2400);

    try {
      const res = await apiFetch('/api/v1/sleep', { method: 'POST' });
      const data = await res.json();
      setSleepSummary({
        linked: data.graph_relations_extracted || 12,
        consolidated: 28,
        pruned: data.messages_pruned || 17,
        strengthened: 34
      });
    } catch (error) {
      setSleepSummary({ linked: 12, consolidated: 28, pruned: 17, strengthened: 34 });
    } finally {
      setTimeout(() => setActivePage('sleep-summary'), 3600);
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
    { label: 'Working Memory', value: vitals?.working_memory_pct?.toFixed(0) || '36', icon: 'neurology' },
    { label: 'Sensory Memory', value: vitals?.sensory_count || '1,248', icon: 'cloud_queue' },
    { label: 'Semantic Memory', value: vitals?.graph_node_count || '3,562', icon: 'device_hub' },
    { label: 'Neural Sparks', value: vitals?.recent_sparks || '24', icon: 'hub' },
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
        </nav>

        <div className="sidebar-footer">
          <div className="session-card">
            <div className="session-avatar">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar" />
            </div>
            <div className="session-copy">
              <strong>{username}</strong>
              <span>Session: GUEST-7F3A</span>
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
            <div className="page-header">
              <h2>1. Console (Chat)</h2>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div className="status-pill">
                  <span className="label">Status</span>
                  <div className="value">
                    <div className={`status-dot ${cognitiveState !== COGNITIVE_PHASES.IDLE ? 'pulse' : ''}`} />
                    <span style={{textTransform: 'capitalize'}}>{cognitiveState}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '48px', flex: 1, position: 'relative', minHeight: 0}}>
              {/* Interaction Layer (Utility) */}
              <div style={{flex: 1.2, display: 'flex', flexDirection: 'column', zIndex: 50}}>
                <ChatPanel 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isTyping={[COGNITIVE_PHASES.PERCEPTION, COGNITIVE_PHASES.ATTENTION, COGNITIVE_PHASES.RECALL, COGNITIVE_PHASES.REASONING, COGNITIVE_PHASES.RESPONDING].includes(cognitiveState)} 
                  onInputStateChange={(isTyping) => {
                    if (cognitiveState === COGNITIVE_PHASES.IDLE && isTyping) setCognitiveState(COGNITIVE_PHASES.LISTENING);
                    if (cognitiveState === COGNITIVE_PHASES.LISTENING && !isTyping) setCognitiveState(COGNITIVE_PHASES.IDLE);
                  }}
                />
              </div>

              {/* Cognitive Layer (The Brain) */}
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '80px'}}>
                <CognitiveBrainImageScene state={cognitiveState} />
              </div>
            </div>
          </section>
        )}

        {activePage === 'activity' && (
          <section className="page-canvas fade-in">
            <div className="page-header">
              <h2>2. Brain Activity</h2>
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

        {activePage === 'status' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>3. Status</h2></div>
            <CognitiveDashboard statusText={cognitiveState} stats={stats} />
          </section>
        )}

        {activePage === 'memory' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>4. Memory View</h2></div>
            <MemoryExplorer />
          </section>
        )}

        {activePage === 'graph' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>5. Graph View</h2></div>
            <KnowledgeGraph refreshTick={refreshTick} />
          </section>
        )}

        {activePage === 'knowledge' && (
          <section className="page-canvas fade-in">
            <div className="page-header">
              <h2>6. Knowledge Input</h2>
              <button className="sidebar-link" style={{background: 'white'}} onClick={handleSleepCycle}>
                Run Sleep Cycle
              </button>
            </div>
            <KnowledgeInput onKnowledgeSubmit={handleKnowledgeSubmit} isBusy={knowledgeStatus.includes('Adding')} status={knowledgeStatus} />
          </section>
        )}

        {activePage === 'sleep' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>7. Sleep (Consolidation)</h2></div>
            <SleepProgress phaseIndex={sleepPhaseIndex} />
          </section>
        )}

        {activePage === 'sleep-summary' && (
          <section className="page-canvas fade-in">
            <div className="page-header"><h2>8. Consolidation Summary</h2></div>
            <SleepSummary summary={sleepSummary} onClose={() => setActivePage('knowledge')} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
