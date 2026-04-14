import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../api';
import './ChatPanel.css';

const DEMO_QUERY = "What is the hippocampus and how does the brain form long-term memories?";

function ChatPanel({ messages, setMessages, setBrainState, brainState, isLoading, currentUser, onChatComplete }) {
  const [inputText,   setInputText]   = useState('');
  const [showIngest,  setShowIngest]  = useState(false);
  const [ingestText,  setIngestText]  = useState('');
  const [ingestStatus, setIngestStatus] = useState('');
  const endRef     = useRef(null);
  const abortRef   = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cancel any in-flight stream when the component unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setBrainState(prev => ({
      ...prev,
      isLoading: true,
      statusMessage: 'Initiating neural handshake...',
      reflection: '',
      highlightedNodes: [],
      traces: [],
    }));

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await apiFetch('/api/v1/query/stream', {
        method: 'POST',
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          const m = part.match(/event: (.*)\ndata: ([\s\S]*)/);
          if (!m) continue;
          const [, evType, raw] = m;
          let data;
          try { data = JSON.parse(raw.trim()); } catch { continue; }

          if (evType === 'trace') {
            setBrainState(prev => ({
              ...prev,
              statusMessage:    data.message,
              traces:           [...prev.traces, data],
              highlightedNodes: data.touched || prev.highlightedNodes,
            }));
          } else if (evType === 'reflection') {
            setBrainState(prev => ({ ...prev, reflection: data.message }));
          } else if (evType === 'final_result') {
            setMessages(prev => [...prev, { role: 'soma', content: data.response }]);
          } else if (evType === 'graph_updated') {
            onChatComplete?.();
          } else if (evType === 'error') {
            throw new Error(data.detail);
          }
        }
      }

      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Cognitive cycle complete.' }));
    } catch (err) {
      // AbortError or BodyStreamBuffer abort = intentional cancel, don't surface it
      if (
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('abort')
      ) {
        setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Brain idle.' }));
        return;
      }
      setMessages(prev => [...prev, { role: 'soma', content: `Neural Error: ${err.message}` }]);
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Process interrupted.' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
    setInputText('');
  };

  const handleDemo = () => sendMessage(DEMO_QUERY);

  const handleIngest = async () => {
    if (!ingestText.trim()) return;
    setIngestStatus('Ingesting…');
    try {
      const res  = await apiFetch('/api/v1/ingest', {
        method: 'POST',
        body:   JSON.stringify({ text: ingestText }),
      });
      const data = await res.json();
      setIngestStatus(`✓ ${data.chunks ?? 1} chunk${(data.chunks ?? 1) !== 1 ? 's' : ''} stored`);
      setIngestText('');
      setTimeout(() => setIngestStatus(''), 3000);
    } catch {
      setIngestStatus('✗ Ingest failed');
      setTimeout(() => setIngestStatus(''), 3000);
    }
  };

  return (
    <div className="chat-panel">

      <div className="chat-header">
        <span className="chat-header-title">Neural Feedback</span>
        <span className="chat-header-session">{currentUser}</span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p className="chat-empty-text">
              Send a message — watch Soma reflect, retrieve memory, and synthesize a response in real-time.
            </p>
            <button className="demo-btn" onClick={handleDemo} disabled={isLoading}>
              Try a demo question
            </button>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className="msg-role">{msg.role === 'user' ? currentUser : 'SOMA'}</div>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-wrap">
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask anything…"
            disabled={isLoading}
            autoFocus
          />
          <button className="chat-submit" type="submit" disabled={isLoading || !inputText.trim()}>
            {isLoading ? '…' : 'Send'}
          </button>
        </form>

        <div className="chat-footer-row">
          <div className="chat-status">{brainState.statusMessage}</div>
          <button
            className={`ingest-toggle-btn ${showIngest ? 'open' : ''}`}
            onClick={() => setShowIngest(p => !p)}
            title="Feed knowledge to Soma"
          >
            {showIngest ? '↓ Close' : '+ Feed Knowledge'}
          </button>
        </div>

        {/* ── Ingest drawer ── */}
        {showIngest && (
          <div className="ingest-drawer">
            <p className="ingest-hint t-label">Paste any text — articles, notes, facts — and Soma will ingest it into sensory memory.</p>
            <textarea
              className="ingest-textarea"
              value={ingestText}
              onChange={e => setIngestText(e.target.value)}
              placeholder="Paste knowledge here…"
              rows={4}
            />
            <div className="ingest-footer">
              {ingestStatus && <span className="ingest-status">{ingestStatus}</span>}
              <button
                className="ingest-submit"
                onClick={handleIngest}
                disabled={!ingestText.trim()}
              >
                Ingest
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default ChatPanel;
