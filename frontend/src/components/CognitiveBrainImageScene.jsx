import brainBase from '../assets/brain/brain_base.png';
import './CognitiveBrainScene.css';

function CognitiveBrainImageScene() {
  return (
    <div className="brain-viewport">
      {/* Delicate Dotted Neural Paths */}
      <svg className="neural-connections" viewBox="0 0 500 500">
        <path d="M 60 120 Q 150 140 210 190" className="path-line" />
        <path d="M 440 150 Q 360 180 310 220" className="path-line" />
        <path d="M 80 380 Q 180 360 230 300" className="path-line" />
        <path d="M 420 420 Q 340 380 290 320" className="path-line" />
      </svg>

      <div className="neural-labels">
        <div className="node prefrontal">
          <div className="node-dot purple"></div>
          <div className="node-text">
            <strong>Prefrontal Cortex</strong>
            <span>Reasoning</span>
          </div>
        </div>
        <div className="node parietal">
          <div className="node-dot blue"></div>
          <div className="node-text">
            <strong>Parietal Lobe</strong>
            <span>Attention</span>
          </div>
        </div>
        <div className="node temporal">
          <div className="node-dot teal"></div>
          <div className="node-text">
            <strong>Temporal Lobe</strong>
            <span>Memory Recall</span>
          </div>
        </div>
        <div className="node hippocampus">
          <div className="node-dot pink"></div>
          <div className="node-text">
            <strong>Hippocampus</strong>
            <span>Memory Encoding</span>
          </div>
        </div>
      </div>

      <div className="brain-core">
        <img src={brainBase} className="brain-visual" alt="Neural Engine" />
        <div className="brain-glow-hub"></div>
      </div>
    </div>
  );
}

export default CognitiveBrainImageScene;
