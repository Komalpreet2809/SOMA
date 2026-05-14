import brainBase from '../assets/brain/brain_base.png';
import prefrontalImg from '../assets/brain/Prefrontal_Cortex.png';
import hippocampusImg from '../assets/brain/Hippocampus.png';
import sensoryImg from '../assets/brain/sensory_cortex.png';
import thalamusImg from '../assets/brain/thalamus.png';
import amygdalaImg from '../assets/brain/brain_amygdala.png';
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
  language: 'prefrontal', // Fallback to prefrontal for language for now
  inhibition: 'thalamus',
  graph: 'hippocampus'
};

function CognitiveBrainImageScene({ state = 'idle' }) {
  const activeRegion = REGION_MAP[state] || null;
  const isState = (s) => state === s;

  return (
    <div className={`brain-viewport state-${state}`}>
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
      </div>

      {/* Layer 1: Brain Core (Layered Overlays) */}
      <div className="brain-core">
        {/* Base Layer */}
        <img src={brainBase} className="brain-layer base" alt="Neural Base" />
        
        {/* Region Overlays */}
        <img src={prefrontalImg} className={`brain-layer region ${activeRegion === 'prefrontal' ? 'active' : ''}`} alt="Prefrontal Cortex" />
        <img src={sensoryImg} className={`brain-layer region ${activeRegion === 'sensory' ? 'active' : ''}`} alt="Sensory Cortex" />
        <img src={hippocampusImg} className={`brain-layer region ${activeRegion === 'hippocampus' ? 'active' : ''}`} alt="Hippocampus" />
        <img src={thalamusImg} className={`brain-layer region ${activeRegion === 'thalamus' ? 'active' : ''}`} alt="Thalamus" />
        <img src={amygdalaImg} className={`brain-layer region ${activeRegion === 'amygdala' ? 'active' : ''}`} alt="Amygdala" />

        {/* State-specific Glow Hubs (Subtle Ambient Glow behind regions) */}
        <div className={`glow-hub prefrontal-glow ${activeRegion === 'prefrontal' ? 'visible' : ''}`} />
        <div className={`glow-hub parietal-glow ${activeRegion === 'sensory' ? 'visible' : ''}`} />
        <div className={`glow-hub temporal-glow ${activeRegion === 'hippocampus' ? 'visible' : ''}`} />
        <div className={`glow-hub thalamus-glow ${activeRegion === 'thalamus' || activeRegion === 'amygdala' ? 'visible' : ''}`} />
        
        {/* Ambient Breathing (Idle) */}
        <div className="ambient-breath" />
      </div>

      {/* Interaction Feedback (Particles) */}
      {(isState('listening') || isState('responding')) && <div className="listening-particles" />}
    </div>
  );
}

export default CognitiveBrainImageScene;
