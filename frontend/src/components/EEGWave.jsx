import './EEGWave.css';

// Each wave pattern is a realistic EEG signal shape for that brain state
const WAVES = {
  idle:      'M0,20 L12,20 L14,19 L16,10 L18,30 L20,12 L22,20 L120,20',
  thinking:  'M0,20 L6,20 L7,19 L8,8  L9,32  L10,6 L11,34 L12,10 L13,20 L18,20 L19,18 L20,9 L21,31 L22,8 L23,32 L24,20 L120,20',
  sleeping:  'M0,20 L20,20 L40,18 L60,22 L80,16 L100,24 L120,20',
  default:   'M0,20 L12,20 L14,18 L16,12 L18,28 L20,14 L22,20 L120,20',
};

function getWaveKey(state) {
  if (!state) return 'default';
  const s = state.toLowerCase();
  if (s.includes('sleep')) return 'sleeping';
  if (s === 'idle') return 'idle';
  return 'thinking';
}

export default function EEGWave({ cognitiveState, isActive }) {
  const key = isActive ? 'thinking' : getWaveKey(cognitiveState);

  return (
    <div className={`eeg-container ${isActive ? 'active' : 'calm'}`} aria-hidden>
      <svg
        className={`eeg-svg wave-${key}`}
        viewBox="0 0 120 40"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow copy */}
        <path d={WAVES[key]} className="eeg-glow" />
        {/* Sharp trace */}
        <path d={WAVES[key]} className="eeg-trace" />
        {/* Animated leading dot */}
        <circle className="eeg-lead" r="2" cy="20">
          <animateMotion
            dur={isActive ? '1.2s' : '2.5s'}
            repeatCount="indefinite"
            path={WAVES[key]}
          />
        </circle>
      </svg>
    </div>
  );
}
