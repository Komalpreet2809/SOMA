import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

function ChatPanel({ messages, setMessages, setBrainState, brainState, isLoading, currentPersona }) {
  const [inputText, setInputText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    const query = inputText;
    setInputText('');

    setBrainState(prev => ({
      ...prev,
      isLoading: true,
      statusMessage: 'Initiating neural handshake...',
      reflection: '',
      highlightedNodes: [],
      traces: [],
    }));

    try {
      const response = await fetch('/api/v1/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, user_id: currentPersona }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          const match = part.match(/event: (.*)\ndata: (.*)/);
          if (!match) continue;
          const [, eventType, rawData] = match;
          const data = JSON.parse(rawData);

          if (eventType === 'trace') {
            setBrainState(prev => ({
              ...prev,
              statusMessage: data.message,
              traces: [...prev.traces, data],
              highlightedNodes: data.touched || prev.highlightedNodes,
            }));
          } else if (eventType === 'reflection') {
            setBrainState(prev => ({ ...prev, reflection: data.message }));
          } else if (eventType === 'final_result') {
            setMessages(prev => [...prev, { role: 'soma', content: data.response }]);
          } else if (eventType === 'error') {
            throw new Error(data.detail);
          }
        }
      }

      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Cognitive cycle complete.' }));
    } catch (error) {
      console.error('Stream error:', error);
      setMessages(prev => [...prev, { role: 'soma', content: `Neural Error: ${error.message}` }]);
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Process interrupted.' }));
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header-scifi">
        <h2>Neural Feedback Interface</h2>
        <span className="label-mono" style={{ fontSize: '0.52rem', color: 'var(--text-dim)' }}>
          {currentPersona}
        </span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <div className="empty-state-text">
              Awaiting neural input.<br />
              Ask anything — watch the brain think.
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className="label-mono" style={{ fontSize: '0.5rem', marginBottom: '5px' }}>
                {msg.role === 'user' ? currentPersona : 'SOMA'}
              </div>
              <div className="message-bubble">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSend}>
          <span className="chat-input-prefix">⚡</span>
          <input
            type="text"
            className="chat-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask something..."
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" disabled={isLoading || !inputText.trim()}>
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
        <div className="chat-status-line">
          {brainState.statusMessage}
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
