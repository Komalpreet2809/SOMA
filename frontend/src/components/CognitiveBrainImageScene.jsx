import brainImg from '../assets/Brain_nobg.b64.js';
import './CognitiveBrainScene.css';

/**
 * PHASE TO REGION MAPPING
 */
const REGION_MAP = {
  perception: 'sensory',
  sensory: 'sensory',
  attention: 'thalamus',
  routing: 'thalamus',
  prediction: 'prefrontal',
  working_memory: 'prefrontal',
  recall: 'hippocampus',
  association: 'hippocampus',
  memory: 'hippocampus',
  emotion: 'amygdala',
  reasoning: 'prefrontal',
  reflection: 'prefrontal',
  language: 'prefrontal',
  inhibition: 'hippocampus', // Moved to Temporal for smoother memory filtering flow
  graph: 'hippocampus',
  listening: 'sensory',
  responding: 'prefrontal'
};

function CognitiveBrainImageScene({ state = 'idle' }) {
  const activeRegion = REGION_MAP[state] || null;
  const isState = (s) => state === s;

  return (
    <div className={`brain-viewport state-${state}`}>
      {/* Layer 1: Brain Core */}
      <div className="brain-core">
        {/* Layer 2: Cognitive Signals (Floating Ambient Labels) */}
        <div className="neural-signals">
          <div className={`signal-node prefrontal ${activeRegion === 'prefrontal' ? 'active' : ''} ${isState('reasoning') ? 'hot' : ''}`}>
            <div className="signal-dot"></div>
            <div className="signal-copy">
              <strong>Prefrontal</strong>
              <span>Reasoning & Reflection</span>
            </div>
          </div>

          <div className={`signal-node parietal ${activeRegion === 'sensory' ? 'active' : ''}`}>
            <div className="signal-dot"></div>
            <div className="signal-copy">
              <strong>Parietal</strong>
              <span>Perception & Sensory</span>
            </div>
          </div>

          <div className={`signal-node temporal ${activeRegion === 'hippocampus' ? 'active' : ''}`}>
            <div className="signal-dot"></div>
            <div className="signal-copy">
              <strong>Temporal</strong>
              <span>Memory & Association</span>
            </div>
          </div>

          <div className={`signal-node thalamus-label ${activeRegion === 'thalamus' || activeRegion === 'amygdala' ? 'active' : ''}`}>
            <div className="signal-dot"></div>
            <div className="signal-copy">
              <strong>Subcortical</strong>
              <span>Attention & Routing</span>
            </div>
          </div>
        </div>
        <img 
          src={brainImg} 
          className="brain-layer base active" 
          alt="Soma Brain" 
        />

        {/* State Glow Hubs (Subtle Ambient Backglow) */}
        <div className={`glow-hub prefrontal-glow ${activeRegion === 'prefrontal' ? 'visible' : ''}`} />
        <div className={`glow-hub parietal-glow ${activeRegion === 'sensory' ? 'visible' : ''}`} />
        <div className={`glow-hub temporal-glow ${activeRegion === 'hippocampus' ? 'visible' : ''}`} />
        <div className={`glow-hub thalamus-glow ${activeRegion === 'thalamus' || activeRegion === 'amygdala' ? 'visible' : ''}`} />
        
        {/* Interaction Particles */}
        <div className="ambient-breath" />
      </div>

      {/* Interaction Feedback (Particles) */}
      {(isState('listening') || isState('responding')) && <div className="listening-particles" />}
    </div>
  );
}

export default CognitiveBrainImageScene;
