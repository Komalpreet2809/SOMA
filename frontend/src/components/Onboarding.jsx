import React, { useState } from 'react';
import './Onboarding.css';

const STEPS = [
  {
    title: "Welcome to Soma",
    content: "Soma is a brain-inspired cognitive architecture. Unlike traditional LLMs, Soma possesses multiple layers of memory that evolve through your interactions.",
    icon: "🧠"
  },
  {
    title: "Sensory Memory",
    content: "Your raw data and facts are stored as vector embeddings. This allows Soma to recall specific details with high precision when you ask questions.",
    icon: "📡"
  },
  {
    title: "Semantic Memory",
    content: "Soma builds a Knowledge Graph of entities and relationships. It doesn't just remember words; it understands how concepts connect in a vast synaptic network.",
    icon: "🕸️"
  },
  {
    title: "Episodic & Sleep",
    content: "Recent conversations are held in Working Memory. During a 'Sleep Cycle', Soma consolidates these experiences, pruning noise and strengthening important knowledge.",
    icon: "💤"
  }
];

function Onboarding({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal glass-panel">
        <div className="onboarding-header">
          <div className="step-indicator label-mono">
            Step {currentStep + 1} / {STEPS.length}
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="onboarding-body">
          <div className="step-icon">{step.icon}</div>
          <h2>{step.title}</h2>
          <p>{step.content}</p>
        </div>

        <div className="onboarding-footer">
          <button 
            className="onboarding-btn secondary" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Back
          </button>
          <div className="step-dots">
            {STEPS.map((_, i) => (
              <div key={i} className={`dot ${i === currentStep ? 'active' : ''}`} />
            ))}
          </div>
          <button className="onboarding-btn primary" onClick={nextStep}>
            {currentStep === STEPS.length - 1 ? "Initialize" : "Next"}
          </button>
        </div>

        <div className="neural-scan-line" />
      </div>
    </div>
  );
}

export default Onboarding;
