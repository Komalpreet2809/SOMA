# <p align="center"> SOMA: Cognitive Architecture for AI</p>

<p align="center">
  <img src="https://img.shields.io/badge/Aesthetics-Neural%20Gloss%20%26%20Pure%20Black-ff6b35?style=for-the-badge" alt="Neural Gloss Theme">
  <img src="https://img.shields.io/badge/Orchestrator-LangChain%20%2F%20LangGraph-009688?style=for-the-badge" alt="LangChain Orchestrator">
  <img src="https://img.shields.io/badge/Deploy-Docker%20%2F%20HuggingFace-blueviolet?style=for-the-badge" alt="Docker Deployment">
</p>

<p align="center">
  <img src="somasnap.png" alt="Soma Neural Console" width="850">
</p>

---

## Introduction

**Soma** is a state-of-the-art, brain-inspired cognitive system designed to simulate human-like mental processes through a multi-layered, interactive memory architecture. Engineered with a premium **Neural Gloss** aesthetic and a pure-black deep workspace layout, it maps conversation streams directly into physical concepts, associations, and permanent memory.

Unlike naive RAG systems, **Soma acts like a child's brain learning about the world from scratch**: it extracts clean, singular concept nodes and verb-style associations rather than plain raw chat text, assembling a growing semantic web of ideas that shapes how it responds to you.

---

## The 4 Cognitive Memory Layers

Soma's intelligence is organized into four distinct biological-style memory sectors:

```text
       ┌────────────────────────────────────────────────────────┐
       │                 HUMAN INPUT / SENSORY                  │
       └───────────────────────────┬────────────────────────────┘
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │  1. SENSORY & EPISODIC LAYER (ChromaDB & SQLite)      │
        │  Stores raw logs, chat context, and temporal events  │
        └──────────────────────────┬───────────────────────────┘
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │  2. SEMANTIC CORTEX LAYER (Neo4j Graph Database)     │
        │  Child-like mind map of simple concept relationships │
        └──────────────────────────┬───────────────────────────┘
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │  3. CONSOLIDATION ENGINE (Sleep Cycle Processor)     │
        │  Refines patterns, prunes facts, strengthens links   │
        └──────────────────────────────────────────────────────┘
```

1. **Sensory & Working Memory (Vector RAG):** Utilizing **ChromaDB**, this layer indexes conversational streams to perform instant, high-dimensional semantic search.
2. **Semantic Memory (Graph RAG):** Powered by **Neo4j** and structured **Groq LLM (Llama 3.1 8B)** extraction, this acts as the "concept map." It ignores conversational padding and stores simple, clean node-to-node links (e.g., `KOMAL --LIKES--> CRICKET`).
3. **Episodic Memory (Relational):** Maintains the timeline and context order of recent user exchanges inside a local **SQLite** (or scalable Supabase Postgres) database.
4. **Active working context:** Feeds real-time vital stats to the UI and tracks the system's active reasoning state.

---

## The Sleep Cycle (Cognitive Consolidation)

To maintain an organized mind, Soma features an automated **Sleep Engine**. When triggered:
* **Pattern Consolidation:** Recent episodic experiences are summarized into long-term memories.
* **Semantic Reinforcement:** High-importance concepts and relationship connections are merged into the Neo4j knowledge graph.
* **Episodic Pruning:** Obsolete logs and redundant facts are cleaned, ensuring high processing speed.

---

## Features

- **Sci-Fi Neural Console:** Premium pure-black visual design featuring neon-accented borders, micro-animations, glowing diagnostic widgets, and customizable dark/light theme options.
- **Child-like Association Engine:** Sturdy 3-layer extraction guard ensuring zero chat-log clutter. Validates concepts for short lengths (1-3 words), blocks meta-talk, and filters punctuation.
- **Interactive 3D Neocortex Visualizer:** Real-time rendering of your active cognitive state, memory graph, and system trace levels.
- **Robust SSE (Server-Sent Events) Stream:** Live system telemetries sent from backend to frontend for transparent reasoning.
- **Seamless Dockerized Environment:** Completely containerized Node.js frontend and Python FastAPI backend for rapid environment deployment.

---

## Technology Stack

### Backend
* **Core Framework:** FastAPI (Python 3.10+)
* **AI & Graph Orchestration:** LangChain, LangGraph
* **LLM Engine:** Groq (Llama 3.1 8B) & OpenAI API
* **Dependencies:** `pydantic-settings`, `uvicorn`, `langchain-groq`

### Frontend
* **Core Framework:** React (Vite, JS)
* **Design & Styling:** Pure CSS (Neural Gloss Theme)
* **Visualization:** Custom interactive Network Graph views and CSS 3D elements

### Databases
* **Vector Store:** ChromaDB (Vector RAG)
* **Knowledge Graph:** Neo4j Cloud / Local
* **Episodic Sessions:** SQLite / PostgreSQL

---

## Quick Start

### 1. Environment Set Up
Create a `.env` file in the root directory (see `.env.example` for the full template):
```env
GROQ_API_KEY=gsk_your_groq_key_here
NEO4J_PASSWORD=choose_a_password_for_the_local_neo4j
```

> **Using Neo4j Aura (cloud) instead?** Set `NEO4J_URI=neo4j+ssc://<instance-id>.databases.neo4j.io` plus `NEO4J_USER` / `NEO4J_DATABASE`. Note: on newer Aura instances the database **username is the instance ID** (e.g. `d65ff6c7`), not `neo4j` — check your downloaded credentials file.

### 2. Run Local Environment (Docker Compose)
To compile and launch the entire cognitive stack (frontend, backend, and a local Neo4j graph database):
```bash
docker-compose up --build
```
* **Frontend console:** `http://localhost:80`
* **FastAPI documentation:** `http://localhost:8000/docs`
* **Neo4j browser:** `http://localhost:7474` (user `neo4j`, password from your `.env`)

The compose file provisions its own `neo4j` container and points the backend at it (`bolt://neo4j:7687`) — no external database needed for local development.

### 3. Run Manually (Local Development)

#### Backend
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Project Anatomy

```text
.
├── app/                      # FastAPI Backend Core
│   ├── api/                  # API Routers & Communication endpoints
│   ├── core/                 # Configurations, Keys & Environmental Variables
│   ├── db/                   # Neo4j connections & Session drivers
│   └── services/             # Cognitive engine (Neocortex, Memory, Sleep processors)
├── frontend/                 # React Frontend Client (Vite)
│   ├── src/                  
│   │   ├── components/       # UI elements (ChatPanel, KnowledgeGraph, Welcome pages)
│   │   └── App.jsx           # Main client state & proxy router controller
├── scratch/                  # Diagnostic scripts & model testing grounds
├── .github/workflows/        # CI — daily Neo4j Aura keepalive ping
├── Dockerfile                # Root multi-stage Docker build config
├── docker-compose.yml        # Multi-container local orchestrator (incl. local Neo4j)
└── requirements.txt          # Python environments manifest
```

---

## Cloud Deployment Notes

* The live deployment runs on **HuggingFace Spaces** (Docker SDK) using the root `Dockerfile`; database credentials are provided via Space secrets (`GROQ_API_KEY`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`).
* The knowledge graph lives on **Neo4j AuraDB Free**, which pauses instances after 3 idle days. The GitHub Actions workflow `.github/workflows/neo4j-keepalive.yml` runs a trivial query once a day to keep it awake (requires the same `NEO4J_*` values as repository Action secrets).

---

## Testing System
Run the system pipeline suite to verify semantic cortex extraction, database connections, and sleep cycle algorithms:
```bash
$env:PYTHONPATH="."; pytest tests/
```

*Designed at the intersection of biological mind mechanics and clean digital intelligence.*
