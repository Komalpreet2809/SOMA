import './ChatPanel.css';

function ChatPanel({ messages, setMessages, isLoading }) {
  return (
    <div className="chat-interface">
      <div className="chat-messages">
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
      </div>

      <div className="chat-input-row">
        <div className="input-field-wrap">
          <input type="text" placeholder="Message Soma..." readOnly />
          <div className="send-btn-wrap">
            <button className="send-btn">
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
