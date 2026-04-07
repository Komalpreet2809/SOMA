---
title: Soma
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Soma: Cognitive Architecture for AI 🧠

Soma is a state-of-the-art, brain-inspired AI system designed to simulate human-like cognitive processes through a multi-layered memory architecture. It integrates vector search, graph relationships, and episodic context to create a persistent and evolving intelligence.

![Soma UI](https://img.shields.io/badge/UI-Cyber--SciFi-blueviolet?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## 🏗️ Architecture: The Cognitive Layers

Soma's intelligence is built on four distinct memory layers, orchestrated by a central hub:

1.  **Sensory Memory (Vector RAG)**: Powered by **ChromaDB**, this layer stores raw data and facts, allowing for high-dimensional semantic retrieval.
2.  **Semantic Memory (Graph RAG)**: Utilizing **Neo4j**, Soma extracts entities and maps complex relationships, enabling deep reasoning and knowledge traversal.
3.  **Episodic Memory (SQLite)**: Maintains a detailed log of interactions and events, providing temporal context to the system's "life."
4.  **Working Memory (Active Context)**: A specialized layer for immediate task processing and short-term reasoning (Episodic context management).

### The Sleep Cycle 💤
Soma features an automated "Sleep Cycle" that simulates cognitive consolidation. During this phase, the system:
- Summarizes recent episodic experiences.
- Prunes redundant data.
- Strengthens important semantic links.

---

## ✨ Features

- **Cyber-SciFi UI**: A premium, high-tech interface with glassmorphism elements, monospace typography, and real-time cognitive metrics.
- **LangChain/LangGraph Orchestration**: Robust AI logic management using industry-standard frameworks.
- **Multi-DB Integration**: Seamless synchronization between ChromaDB (Vector), Neo4j (Graph), and SQLite (Relational).
- **Extensible API**: Fully documented FastAPI backend with high-performance endpoints.
- **Dockerized**: Easy deployment with pre-configured container environments.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **AI Orchestration**: LangGraph, LangChain
- **LLM Support**: Groq (Llama-3), OpenAI
- **Dependencies**: `pydantic`, `uvicorn`, `langchain-groq`

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Custom Cyber-SciFi Design)
- **State Management**: React Hooks

### Databases
- **Vector**: ChromaDB
- **Graph**: Neo4j
- **Relational**: SQLite (via `aiosqlite`)

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend dev)
- Python 3.10+ (for local backend dev)

### Local Deployment (Docker)
The easiest way to run Soma is using Docker Compose:

```bash
docker-compose up --build
```

- Backend will be available at: `http://localhost:8000`
- Frontend will be available at: `http://localhost:80`

### Cloud Deployment (Hugging Face)
For instructions on how to deploy Soma to the cloud with permanent memory, see the **[Hugging Face Deployment Guide](file:///d:/PROJECTS/Soma/HF_DEPLOY_GUIDE.md)**.

### Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:

```env
GROQ_API_KEY=your_key_here
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

---

## 📂 Project Structure

```text
.
├── app/                # FastAPI Backend
│   ├── api/            # API Endpoints
│   ├── core/           # Configuration & Settings
│   ├── db/             # Database Drivers (Neo4j, Session)
│   └── services/       # AI Orchestrator & Memory Logic
├── frontend/           # React Frontend (Vite)
│   ├── src/            # Source Code
│   └── public/         # Static Assets
├── tests/              # Test Suite (Phase tests, Debugging)
├── Dockerfile          # Root Dockerfile
├── docker-compose.yml  # Multi-container Setup
└── requirements.txt    # Python Dependencies
```

---

## 🧪 Testing

Run systems tests to ensure cognitive layers are healthy:

```bash
python -m pytest tests/test_phase2.py
```

---

## 📜 License
MIT License. See `LICENSE` for details (if applicable).

---
*Inspired by the synergy of biological cognition and digital intelligence.*
