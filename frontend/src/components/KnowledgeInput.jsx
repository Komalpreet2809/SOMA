import { useState } from 'react';
import './KnowledgeInput.css';

function KnowledgeInput({ onKnowledgeSubmit, isBusy, status }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || isBusy) return;
    onKnowledgeSubmit(text);
    setText('');
  };

  return (
    <div className="knowledge-layout fade-in">
      <div className="knowledge-icon-large">
        <span className="material-icons">note_add</span>
      </div>
      
      <h3>Add knowledge to Soma</h3>
      <p>Paste text or notes for Soma to remember and integrate into its memory.</p>

      <div className="knowledge-composer">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste anything here... (articles, notes, ideas, research)"
          maxLength={10000}
        />
        <div className="knowledge-composer-footer">
          <span className="char-count">{text.length} / 10000</span>
          <button 
            className="add-memory-btn" 
            onClick={handleSubmit}
            disabled={!text.trim() || isBusy}
          >
            Add to Memory
          </button>
        </div>
      </div>

      {status && <div className="knowledge-status-text">{status}</div>}
    </div>
  );
}

export default KnowledgeInput;
