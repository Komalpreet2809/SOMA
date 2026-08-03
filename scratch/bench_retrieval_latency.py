"""Benchmark memory retrieval latency — the source of the resume numbers.

Run from repo root:  python scratch/bench_retrieval_latency.py
Measures warm-cache latency; first call is excluded as warmup.
"""
import time
import statistics

from app.services.memory import retrieve_context, get_embeddings
from app.services.neocortex import retrieve_graph_context

QUERIES = [
    "what do I like",
    "tell me about cricket",
    "who is komal",
    "what did we discuss",
    "my favorite food",
]

get_embeddings()
retrieve_context("warmup", "default_user")
vector_times = []
for q in QUERIES:
    t0 = time.perf_counter()
    retrieve_context(q, "default_user")
    vector_times.append((time.perf_counter() - t0) * 1000)

retrieve_graph_context("warmup", "default_user")
graph_times = []
for q in QUERIES:
    t0 = time.perf_counter()
    retrieve_graph_context(q, "default_user")
    graph_times.append((time.perf_counter() - t0) * 1000)

print(f"Vector (ChromaDB, local): median {statistics.median(vector_times):.1f} ms "
      f"| runs: {[f'{t:.0f}' for t in vector_times]}")
print(f"Graph (Neo4j Aura, cloud round-trip): median {statistics.median(graph_times):.1f} ms "
      f"| runs: {[f'{t:.0f}' for t in graph_times]}")
