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

    const query = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);

    setBrainState(prev => ({
      ...prev,
      isLoading: true,
      statusMessage: 'Initiating neural handshake...',
      reflection: '',
      highlightedNodes: [],
      traces: [],
    }));

    try {
      const res = await fetch('/api/v1/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, user_id: currentPersona }),
      });

      const reader = res.body.getReader();
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
          const m = part.match(/event: (.*)\ndata: (.*)/);
          if (!m) continue;
          const [, evType, raw] = m;
          const data = JSON.parse(raw);

          if (evType === 'trace') {
            setBrainState(prev => ({
              ...prev,
              statusMessage: data.message,
              traces: [...prev.traces, data],
              highlightedNodes: data.touched || prev.highlightedNodes,
            }));
          } else if (evType === 'reflection') {
            setBrainState(prev => ({ ...prev, reflection: data.message }));
          } else if (evType === 'final_result') {
            setMessages(prev => [...prev, { role: 'soma', content: data.response }]);
          } else if (evType === 'error') {
            throw new Error(data.detail);
          }
        }
      }

      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Cognitive cycle complete.' }));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'soma', content: `Neural Error: ${err.message}` }]);
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Process interrupted.' }));
    }
  };

  return (
    <div className="chat-panel">

      <div className="chat-header">
        <span className="chat-header-title">Neural Feedback</span>
        <span className="chat-header-session">{currentPersona}</span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p className="chat-empty-text">
              Send a message — watch Soma reflect, retrieve memory, and synthesize a response in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className="msg-role">
                {msg.role === 'user' ? currentPersona : 'SOMA'}
              </div>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-wrap">
        <form className="chat-form" onSubmit={handleSend}>
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
        <div className="chat-status">{brainState.statusMessage}</div>
      </div>

    </div>
  );
}

export default ChatPanel;
