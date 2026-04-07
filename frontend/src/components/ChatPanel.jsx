import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

function ChatPanel({ messages, setMessages, setBrainState, isLoading }) {
  const [inputTimer, setInputTimer] = useState('');
  const [inputText, setInputText] = useState('');
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    
    // Reset traces for new query
    setBrainState(prev => ({ 
      ...prev, 
      isLoading: true, 
      statusMessage: 'Initiating neural handshake...', 
      reflection: '',
      highlightedNodes: [],
      traces: [] 
    }));

    try {
      const response = await fetch('/api/v1/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentInput, user_id: 'ui_user' })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // Keep last incomplete part

        for (const part of parts) {
          if (!part.trim()) continue;
          
          const eventMatch = part.match(/event: (.*)\ndata: (.*)/);
          if (eventMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(eventMatch[2]);

            if (eventType === 'trace') {
              setBrainState(prev => ({
                ...prev,
                statusMessage: data.message,
                traces: [...prev.traces, data],
                highlightedNodes: data.touched || prev.highlightedNodes
              }));
            } else if (eventType === 'reflection') {
              setBrainState(prev => ({
                ...prev,
                reflection: data.message
              }));
            } else if (eventType === 'final_result') {
              setMessages(prev => [...prev, { role: 'soma', content: data.response }]);
            } else if (eventType === 'error') {
              throw new Error(data.detail);
            }
          }
        }
      }

      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Cognitive cycle complete.' }));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'soma', content: `Neural Error: ${error.message}` }]);
      setBrainState(prev => ({ ...prev, isLoading: false, statusMessage: 'Process interrupted.' }));
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header-scifi">
         <h2 style={{ fontSize: '0.8rem' }}>Neural Feedback Interface</h2>
         <span className="label-mono">Live Session: active_node_01</span>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state label-mono" style={{ opacity: 0.3, textAlign: 'center', marginTop: '100px' }}>
            Initiating neural handshake... Waiting for input...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className="label-mono" style={{ fontSize: '0.6rem', marginBottom: '4px' }}>
                {msg.role === 'user' ? 'Local_User' : 'CORTEX_RESPONSE'} // {new Date().toLocaleTimeString()}
              </div>
              <div className="message-bubble">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div style={{ marginTop: 'auto', padding: '10px 0' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
           <button className="label-mono" style={{ background: '#111', color: '#666', border: '1px solid #222', padding: '4px 8px', fontSize: '0.6rem' }}>Initiate Heuristic Scan</button>
           <button className="label-mono" style={{ background: '#111', color: '#666', border: '1px solid #222', padding: '4px 8px', fontSize: '0.6rem' }}>Dump Memory Buffers</button>
        </div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '15px', color: 'var(--accent-primary)' }}>
             <span className="label-mono" style={{ fontWeight: 'bold' }}>⚡</span>
          </div>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ISSUE SYSTEM COMMAND..."
            disabled={isLoading}
            className="chat-input"
          />
          <button type="submit" disabled={isLoading || !inputText.trim()}>Execute</button>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
