import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

function ChatPanel({ messages, onSendMessage, isTyping }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-group ${msg.role}`}>
            <div className="avatar-wrap">
              <div className="chat-avatar">
                <span className="material-icons">
                  {msg.role === 'user' ? 'person' : 'psychology'}
                </span>
              </div>
            </div>
            <div className="bubble-body">
              <div className="bubble-meta">
                <strong>{msg.role === 'user' ? 'You' : 'Soma'}</strong>
              </div>
              <div className="bubble-text">{msg.content}</div>
              <div className="bubble-time">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble-group soma typing">
             <div className="chat-avatar">
                <span className="material-icons">psychology</span>
             </div>
             <div className="bubble-body">
                <div className="typing-dots">
                   <span></span><span></span><span></span>
                </div>
             </div>
          </div>
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <div className="input-field-wrap">
          <input 
            type="text" 
            placeholder="Message Soma..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <div className="send-btn-wrap">
            <button className="send-btn" type="submit" disabled={!input.trim() || isTyping}>
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatPanel;
