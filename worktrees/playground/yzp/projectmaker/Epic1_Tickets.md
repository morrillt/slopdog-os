# Epic 1: ChatGPT Search — Tickets

> **Goal:** Upload ChatGPT export, search it, view original sources, understand pipeline.

---

## Ticket Table

| # | Title | Summary | Acceptance Criteria |
|---|-------|---------|---------------------|
| **T1.1** | Project Setup & Monorepo | Fork flashbuild-llmcomparer, set up monorepo structure with packages | ✓ Monorepo with `apps/web`, `packages/core`, `packages/db`, `packages/types`<br><br>✓ TypeScript configured across packages<br><br>✓ `npm install` works, `npm run dev` starts web app<br><br>✓ Catppuccin theme inherited |
| **T1.2** | Database Schema | Set up LanceDB for vectors and SQLite for metadata/sources | ✓ SQLite tables: `sources`, `chunks` created<br><br>✓ LanceDB initialized in `/data/lancedb/`<br><br>✓ TypeScript types for both schemas<br><br>✓ Basic CRUD functions for each table |
| **T1.3** | ChatGPT Parser | Parse ChatGPT `conversations.json` export format | ✓ Given valid JSON, extracts: title, create_time, messages array<br><br>✓ Returns typed `Conversation[]` array<br><br>✓ Handles edge cases: empty convos, missing fields<br><br>✓ Throws clear error on invalid JSON |
| **T1.4** | Ground Truth Storage | Store original conversations for citation linking | ✓ Original JSON stored in `/data/sources/` as files<br><br>✓ `sources` table entry with `id`, `source_type`, `file_path`, `metadata`<br><br>✓ Function: `getSource(id)` returns original content<br><br>✓ Originals never modified after storage |
| **T1.5** | Ingestion Template System | Externalized prompts and config for summarization | ✓ Template interface defined in TypeScript<br><br>✓ ChatGPT template in `/templates/chatgpt.yaml` (or .ts)<br><br>✓ Includes: `summarization_prompt`, `chunk_size`, `metadata_fields`<br><br>✓ Template loaded at runtime, not hardcoded |
| **T1.6** | Summarization Pipeline | LLM summarizes conversation chunks using template | ✓ Given conversation + template, calls LLM (Ollama or OpenRouter)<br><br>✓ Returns structured output: `{ summary, quotes, source_range }`<br><br>✓ Stores which model + prompt was used (for tracing)<br><br>✓ Configurable model selection via `.env` |
| **T1.7** | Embedding Pipeline | Generate vectors from summaries | ✓ Given summary text, generates embedding via transformers.js<br><br>✓ Stores vector in LanceDB with `chunk_id` reference<br><br>✓ Batch processing for multiple chunks<br><br>✓ Embedding model configurable |
| **T1.8** | Chunk Storage | Store processed chunks with full lineage | ✓ `chunks` table stores: summary, tags, `source_id`, `source_range`<br><br>✓ Stores: `embedding_model`, `summarization_model`, `prompt_used`<br><br>✓ Links to LanceDB vector via `chunk_id`<br><br>✓ Timestamps for created_at |
| **T1.9** | Search Endpoint | API to search chunks by natural language query | ✓ `POST /api/search` accepts `{ query, limit?, filters? }`<br><br>✓ Embeds query, searches LanceDB for top-k<br><br>✓ Returns chunks with scores, metadata, source info<br><br>✓ Supports filter by source_type |
| **T1.10** | Ingest UI — Upload | Web page to upload ChatGPT export | ✓ `/ingest/chatgpt` page with file upload<br><br>✓ Shows parsing progress: "Found X conversations"<br><br>✓ Model selector dropdown (Ollama models, OpenRouter)<br><br>✓ "Start Ingestion" button |
| **T1.11** | Ingest UI — Progress | Show pipeline progress during ingestion | ✓ Real-time progress: "Processing 24/847..."<br><br>✓ Shows current stage: Normalizing, Summarizing, Embedding<br><br>✓ Completion summary: "847 convos → 1,203 chunks" |
| **T1.12** | Search UI | Web page to search and view results | ✓ `/search` page with search input<br><br>✓ Results list: summary, score, source badge, tags<br><br>✓ Clickable results expand to show more detail |
| **T1.13** | View Original Source | Click through from chunk to original conversation | ✓ "View Source" button on each result<br><br>✓ Opens modal/panel showing original messages<br><br>✓ Highlights relevant message range (from `source_range`)<br><br>✓ Shows conversation title + date |
| **T1.14** | View Pipeline Trace | Show how a chunk was created | ✓ "View Trace" button on each result<br><br>✓ Shows waterfall: Load → Summarize → Embed → Index<br><br>✓ Each step shows: model used, prompt used, timing<br><br>✓ Can view raw summary before embedding |

---

## Suggested Order

```
T1.1 → T1.2 → T1.3 → T1.4 → T1.5 → T1.6 → T1.7 → T1.8 → T1.9 → T1.10 → T1.11 → T1.12 → T1.13 → T1.14
 │      │      │      │      │      │      │      │      │       │        │        │        │        │
 │      │      │      │      │      │      │      │      │       │        │        │        │        └── Polish
 │      │      │      │      │      │      │      │      │       │        │        │        └── View source
 │      │      │      │      │      │      │      │      │       │        │        └── Search UI
 │      │      │      │      │      │      │      │      │       │        └── Progress UI
 │      │      │      │      │      │      │      │      │       └── Upload UI
 │      │      │      │      │      │      │      │      └── Search API
 │      │      │      │      │      │      │      └── Store chunks
 │      │      │      │      │      │      └── Embed
 │      │      │      │      │      └── Summarize
 │      │      │      │      └── Templates
 │      │      │      └── Store originals
 │      │      └── Parse
 │      └── DB
 └── Setup
```

---

## FR Mapping

| Ticket | FRs Covered |
|--------|-------------|
| T1.1 | — (setup) |
| T1.2 | FR-1.3, FR-1.4 (partial) |
| T1.3 | FR-1.1 |
| T1.4 | FR-1.3 |
| T1.5 | FR-1.2 (partial) |
| T1.6 | FR-1.2 |
| T1.7 | FR-1.4 |
| T1.8 | FR-1.3, FR-1.4 |
| T1.9 | FR-3.1 |
| T1.10 | FR-1.1, FR-3.5 |
| T1.11 | FR-3.5 |
| T1.12 | FR-3.1, FR-3.5 |
| T1.13 | FR-3.2 |
| T1.14 | FR-3.3 |

---

*Ready for review — fill in estimates, assignees, etc. after approval.*

