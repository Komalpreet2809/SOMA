from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import Iterable


REGION_LABELS = {
    "sensory_cortex": "Sensory Cortex",
    "thalamus": "Thalamus",
    "amygdala": "Amygdala",
    "working_memory": "Working Memory",
    "hippocampus": "Hippocampus",
    "neocortex": "Neocortex",
    "prefrontal_cortex": "Prefrontal Cortex",
    "language_cortex": "Language Cortex",
    "memory_consolidation": "Memory Consolidation",
    "default_mode_network": "Default Mode Network",
}

PHASE_REGIONS = {
    "perception": "sensory_cortex",
    "attention": "thalamus",
    "routing": "thalamus",
    "emotion": "amygdala",
    "prediction": "prefrontal_cortex",
    "working_memory": "working_memory",
    "recall": "hippocampus",
    "association": "neocortex",
    "inhibition": "thalamus",
    "reflection": "prefrontal_cortex",
    "reasoning": "prefrontal_cortex",
    "language": "language_cortex",
    "memory": "memory_consolidation",
    "graph": "neocortex",
    "dreaming": "default_mode_network", 
    "sleep": "memory_consolidation",
}

EMOTION_KEYWORDS = {
    "fear": ("fear", {"scared", "afraid", "fear", "anxious", "anxiety", "worried", "panic"}),
    "sadness": ("sadness", {"sad", "hurt", "lonely", "depressed", "down"}),
    "anger": ("anger", {"angry", "mad", "furious", "annoyed", "frustrated"}),
    "joy": ("joy", {"happy", "excited", "grateful", "love", "thrilled"}),
}

URGENT_KEYWORDS = {"urgent", "immediately", "asap", "tomorrow", "today", "now", "deadline"}
MEMORY_KEYWORDS = {"remember", "recall", "last time", "before", "told you", "previous", "history"}
TECHNICAL_KEYWORDS = {
    "code", "bug", "api", "python", "react", "backend", "frontend", "design",
    "system", "architecture", "database", "build", "debug"
}
CREATIVE_KEYWORDS = {"idea", "creative", "story", "brainstorm", "imagine", "weird"}


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _contains_any(text: str, candidates: Iterable[str]) -> bool:
    return any(candidate in text for candidate in candidates)


def _clamp(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, round(value)))


def build_brain_event(
    phase: str,
    activation: int,
    reason: str,
    *,
    next_regions: list[str] | None = None,
    inputs_used: list[str] | None = None,
    data: dict | None = None,
) -> dict:
    region = PHASE_REGIONS.get(phase, "prefrontal_cortex")
    return {
        "phase": phase,
        "region": region,
        "region_label": REGION_LABELS.get(region, region.replace("_", " ").title()),
        "activation": _clamp(activation),
        "reason": reason,
        "next_regions": next_regions or [],
        "inputs_used": inputs_used or [],
        "timestamp": _timestamp(),
        "data": data or {},
    }


def score_attention(text: str, history_count: int = 0) -> dict:
    normalized = _normalize_text(text)
    emotional_intensity = 20
    emotion_label = "neutral"

    for _, (label, keywords) in EMOTION_KEYWORDS.items():
        if _contains_any(normalized, keywords):
            emotion_label = label
            emotional_intensity = 78
            break

    urgency = 70 if _contains_any(normalized, URGENT_KEYWORDS) else 35
    memory_relevance = 80 if _contains_any(normalized, MEMORY_KEYWORDS) else 35
    complexity = 72 if len(normalized.split()) > 18 or _contains_any(normalized, TECHNICAL_KEYWORDS) else 42
    creativity = 74 if _contains_any(normalized, CREATIVE_KEYWORDS) else 28
    novelty = 60 if history_count == 0 else 45
    goal_relevance = 85 if normalized.endswith("?") or normalized else 55

    salience = _clamp(
        emotional_intensity * 0.22
        + urgency * 0.18
        + memory_relevance * 0.18
        + complexity * 0.16
        + novelty * 0.12
        + goal_relevance * 0.14
    )

    return {
        "emotional_intensity": emotional_intensity,
        "emotion_label": emotion_label,
        "urgency": urgency,
        "memory_relevance": memory_relevance,
        "complexity": complexity,
        "creativity": creativity,
        "novelty": novelty,
        "goal_relevance": goal_relevance,
        "salience": salience,
    }


def route_signal(text: str, scores: dict) -> dict:
    normalized = _normalize_text(text)
    regions = ["sensory_cortex", "thalamus"]
    reasons = ["General language input detected."]

    if scores["emotional_intensity"] >= 70:
        regions.append("amygdala")
        reasons.append("Emotional salience is high.")
    if scores["memory_relevance"] >= 70:
        regions.append("hippocampus")
        reasons.append("Input requests memory retrieval.")
    if scores["complexity"] >= 65 or _contains_any(normalized, TECHNICAL_KEYWORDS):
        regions.extend(["prefrontal_cortex", "neocortex"])
        reasons.append("Input requires multi-step reasoning.")
    if scores["creativity"] >= 70:
        regions.append("default_mode_network")
        reasons.append("Creative ideation pathway engaged.")

    deduped = list(dict.fromkeys(regions))
    return {"regions": deduped, "reason": " ".join(reasons)}


def predict_intent(text: str, scores: dict) -> dict:
    normalized = _normalize_text(text)

    if scores["memory_relevance"] >= 70:
        intent = "Memory retrieval and reconstruction."
    elif scores["emotional_intensity"] >= 70:
        intent = "Emotion-aware support with structured guidance."
    elif _contains_any(normalized, CREATIVE_KEYWORDS):
        intent = "Creative ideation and exploration."
    elif _contains_any(normalized, TECHNICAL_KEYWORDS):
        intent = "Technical reasoning and explanation."
    else:
        intent = "General question answering."

    confidence = 84 if scores["goal_relevance"] >= 80 else 66
    return {"intent": intent, "confidence": confidence}


def filter_recalled_items(context: list[str], graph_context: list[str], limit: int = 3) -> dict:
    kept_context = context[:limit]
    kept_graph = graph_context[:limit]
    suppressed_context = max(0, len(context) - len(kept_context))
    suppressed_graph = max(0, len(graph_context) - len(kept_graph))

    return {
        "context": kept_context,
        "graph_context": kept_graph,
        "suppressed_context": suppressed_context,
        "suppressed_graph": suppressed_graph,
    }
