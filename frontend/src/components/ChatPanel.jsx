import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

/**
 * ChatPanel
 * 
 * Layer 3: Interaction (Utility Layer)
 * Handles live conversation and input.
 */
function ChatPanel({ messages, onSendMessage, onNewChat, userAvatar, isTyping, onInputStateChange }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (onInputStateChange) {
      onInputStateChange(val.length > 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
    if (onInputStateChange) onInputStateChange(false);
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcome-state">
            <div className="welcome-icon">
              <span className="material-icons">lens_blur</span>
            </div>
            <h3>Neural Core Initialized.</h3>
            <p>Feed me a thought to begin building your neural pathways.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-group ${msg.role}`}>
            <div className="chat-avatar">
              {msg.role === 'user' ? (
                <img src={userAvatar} alt="User" />
              ) : (
                <span className="material-icons">lens_blur</span>
              )}
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
        {isTyping && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="chat-bubble-group soma typing">
             <div className="chat-avatar">
                <span className="material-icons">lens_blur</span>
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
        <button 
          className="new-chat-btn" 
          type="button" 
          onClick={onNewChat}
          title="New Chat"
          disabled={isTyping}
        >
          <span className="material-icons">add</span>
        </button>
        <div className="input-field-wrap">
          <input 
            type="text" 
            placeholder="Message Soma..." 
            value={input}
            onChange={handleInputChange}
            disabled={isTyping}
          />
        </div>
        <button className="send-btn" type="submit" disabled={!input.trim() || isTyping}>
          <span className="material-icons">north</span>
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
