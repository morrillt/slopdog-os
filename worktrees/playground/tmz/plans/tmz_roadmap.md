# TMZ RAG Pipeline Roadmap & "Knobs"

This document tracks the iterative development of the TMZ RAG pipeline, focusing on the "learning-first" transparency goals.

## Phase 1: Foundations (The "KISS" Stage)
- [ ] **ChatGPT Ingestion:** Parse official JSON export, basic recursive character splitting.
- [ ] **LanceDB Setup:** Initialize tables for `chunks` and `metadata`.
- [ ] **Basic Retrieval:** Simple semantic search via local Ollama embeddings.
- [ ] **Trace Log V1:** console-based tracing of the retrieval logic.

## Phase 2: Refinement & Transparency
- [ ] **Synthesis/Deduplication:** Implement similarity-based merging for ChatGPT notes (FR-6).
- [ ] **YouTube Hierarchical Chunking:** Chapter-based parent chunks + semantic child chunks (FR-2).
- [ ] **UI Trace Waterfall:** Next.js visualization of the pipeline stages (FR-3).
- [ ] **Source Grounding:** Clickable citations back to original files (FR-8).

## Phase 3: The "Knobs" (Exposing Parameters)
The following "Knobs" will be exposed in `.env`, config files, and the UI:
1. **Chunking Strategy:** `CHUNK_SIZE`, `CHUNK_OVERLAP`.
2. **Merging Logic:** `SIMILARITY_THRESHOLD` (for synthesis).
3. **Retrieval Params:** `TOP_K`, `SIMILARITY_SCORE_MIN`.
4. **Model Choice:** `EMBEDDING_MODEL` (Local vs OpenRouter), `GENERATION_MODEL`.

## Phase 4: Integration
- [ ] **MCP Server:** Expose the pipeline as a Cursor/Cline tool.
- [ ] **Comparison Mode:** Side-by-side evaluation of different models/strategies.

