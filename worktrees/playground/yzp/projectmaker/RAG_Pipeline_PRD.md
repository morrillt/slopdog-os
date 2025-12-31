# RagBrain: Personal Knowledge RAG Pipeline

> **A learning-focused, transparency-first RAG pipeline for personal knowledge management.**

| Field | Value |
|-------|-------|
| **Owner** | broz |
| **Status** | Draft |
| **Last Updated** | 2025-12-27 |
| **Base Project** | flashbuild-llmcomparer (to be forked) |

---

## 1. High-Level Description

RagBrain is a personal RAG (Retrieval-Augmented Generation) pipeline designed for learning and daily use. It ingests three primary data sources—**ChatGPT conversation history**, **YouTube transcripts** from followed creators, and **personal markdown notes**—normalizes them into searchable chunks, and exposes every stage of the pipeline for inspection and tuning.

### The Core Innovation

**Summarization-first approach**: Verbose conversations are condensed into compact, deduplicated knowledge chunks while maintaining citations back to original sources. You can always trace any summary back to the source material.

### Key Principles

- 🎓 **Learning by building** — See all the knobs, understand every stage
- 🔍 **Transparency** — Know why something was retrieved
- 🔬 **Experimentation** — Swap LLMs at any pipeline stage

### Scope Summary

| In Scope (MVP) | Out of Scope (MVP) |
|----------------|-------------------|
| ChatGPT ingestion + search | MCP integration |
| YouTube ingestion + search | Chat Q&A interface |
| Pipeline transparency | Interest ranking |
| Ground truth citations | Markdown ingestion |
| Local-first (Ollama) | CLI automation |

---

## 2. Goals and Non-Goals

### ✅ Goals

| ID | Goal |
|----|------|
| G1 | Ingest ChatGPT export into summarized chunks with source citations |
| G2 | Ingest YouTube transcripts with chapter-aware chunking |
| G3 | Full pipeline transparency: see how data flows, trace any chunk |
| G4 | Maintain ground truth: all summaries link back to originals |
| G5 | Learn by doing: understand every component |

### ❌ Non-Goals (MVP)

| ID | Non-Goal |
|----|----------|
| NG1 | MCP integration (backlog) |
| NG2 | Chat Q&A interface (backlog) |
| NG3 | Interest-based ranking (backlog) |
| NG4 | Production scalability |
| NG5 | Multi-user support |

---

## 3. Pipeline Stages

> High-level view of the RAG pipeline. Each stage is a "knob" you can inspect and tune.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INGESTION PIPELINE                              │
├─────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────────┤
│  LOAD   │  NORMALIZE  │  SUMMARIZE  │    CHUNK    │    EMBED    │   INDEX   │
│         │             │             │             │             │           │
│ Parse   │ Extract     │ LLM creates │ Split into  │ Generate    │ Store in  │
│ source  │ structure,  │ compact     │ semantic    │ vector      │ LanceDB   │
│ format  │ metadata    │ summaries   │ pieces      │ embeddings  │ + SQLite  │
└─────────┴─────────────┴─────────────┴─────────────┴─────────────┴───────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               QUERY PIPELINE                                 │
├─────────────┬─────────────┬─────────────┬───────────────────────────────────┤
│    EMBED    │   RETRIEVE  │    GROUP    │           DISPLAY                 │
│    QUERY    │             │             │                                   │
│             │             │             │                                   │
│ Vectorize   │ Find top-k  │ Dedupe      │ Show results + trace +            │
│ user query  │ similar     │ similar     │ ground truth citations            │
└─────────────┴─────────────┴─────────────┴───────────────────────────────────┘
```

### Stage Summary

| Stage | What Happens | Knobs |
|-------|--------------|-------|
| **Load** | Parse source format (JSON, transcript) | Source-specific parsers |
| **Normalize** | Extract structure, metadata | Field mapping |
| **Summarize** | LLM creates compact summaries | Model, prompt template |
| **Chunk** | Split into pieces (hierarchy for YouTube) | Size, overlap, strategy |
| **Embed** | Generate vector embeddings | Model, batch size |
| **Index** | Store vectors + metadata | — |
| **Retrieve** | Find top-k similar chunks | Top-k, threshold, filters |
| **Group** | Dedupe similar results | Similarity threshold |
| **Display** | Show with trace + citations | — |

---

## 4. Ground Truth & Citations

> **Critical:** Every summary must link back to its original source.

### Approach

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  ORIGINAL DATA   │ ───▶ │  SUMMARY CHUNK   │ ───▶ │    DISPLAYED     │
│                  │      │                  │      │                  │
│ Stored in        │      │ Contains:        │      │ Shows:           │
│ /data/sources/   │      │ • summary text   │      │ • summary        │
│                  │      │ • source_id      │      │ • "View Source"  │
│ Never modified   │      │ • source_range   │      │ • citation link  │
│ Never deleted    │      │ • created_at     │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Data Model

**SQLite: `sources` table**
```sql
CREATE TABLE sources (
  id TEXT PRIMARY KEY,           -- uuid
  source_type TEXT,              -- 'chatgpt' | 'youtube' | 'markdown'
  raw_content TEXT,              -- original full content (JSON string)
  metadata JSON,                 -- title, date, url, etc.
  file_path TEXT,                -- path in /data/sources/
  created_at TIMESTAMP
);
```

**SQLite: `chunks` table**
```sql
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES sources(id),
  source_range JSON,             -- { start_msg: 5, end_msg: 12 } or { start_sec: 120, end_sec: 180 }
  summary TEXT,
  tags JSON,
  parent_chunk_id TEXT,          -- for hierarchical (YouTube chapters)
  embedding_model TEXT,
  summarization_model TEXT,
  summarization_prompt TEXT,     -- actual prompt used (for debugging)
  created_at TIMESTAMP
);
```

**LanceDB: vectors**
- `chunk_id` → links to SQLite
- `embedding` → vector
- `metadata` → denormalized for filtering

### Citation Display

When showing a chunk:
```
┌─────────────────────────────────────────────────────────┐
│ Summary: "Implemented JWT auth with refresh tokens..."  │
│                                                         │
│ Source: ChatGPT conversation "Auth implementation"      │
│         Messages 5-12 • Dec 15, 2024                    │
│                                                         │
│ [View Original] [View Trace]                            │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Ingestion Templates

> Each source type has a template defining how to process it.

### Template Structure

```typescript
interface IngestionTemplate {
  source_type: 'chatgpt' | 'youtube' | 'markdown';
  
  // Prompts
  summarization_prompt: string;
  topic_extraction_prompt: string;
  
  // Chunking config
  chunk_strategy: 'message_pairs' | 'chapters' | 'headers';
  chunk_size_tokens: number;
  chunk_overlap_tokens: number;
  
  // Metadata extraction
  metadata_fields: string[];
}
```

### ChatGPT Template

```yaml
source_type: chatgpt
summarization_prompt: |
  Summarize this conversation excerpt concisely.
  Preserve: key decisions, code snippets, action items.
  Format: 2-3 sentences max.
  
  Conversation:
  {content}
  
topic_extraction_prompt: |
  Extract 3-5 topic tags from this conversation.
  Return as comma-separated lowercase tags.
  
chunk_strategy: message_pairs
chunk_size_tokens: 1000
chunk_overlap_tokens: 100
metadata_fields: [title, create_time, conversation_id]
```

### YouTube Template

```yaml
source_type: youtube
summarization_prompt: |
  Summarize this video transcript section.
  Focus on: main points, techniques, recommendations.
  Format: 1-2 sentences.
  
  Transcript:
  {content}
  
chunk_strategy: chapters  # fallback to semantic if no chapters
chunk_size_tokens: 500
chunk_overlap_tokens: 50
parent_child_enabled: true
chapter_subchunk_threshold_seconds: 120
metadata_fields: [title, channel, duration, upload_date, url]
```

---

## 6. Functional Requirements

---

### Category: Ingestion — ChatGPT

| ID | User Story | Acceptance Criteria | Pri |
|----|------------|---------------------|-----|
| **FR-1.1** | Upload ChatGPT JSON export | **Given** `conversations.json`, **when** uploaded, **then** parsed.<br><br>✓ Validates structure.<br><br>✓ Shows conversation count. | P0 |
| **FR-1.2** | Summarize using template | **Given** conversation, **when** processed, **then** uses ChatGPT template prompts.<br><br>✓ Stores prompt used for tracing. | P0 |
| **FR-1.3** | Preserve ground truth | **Given** summary created, **then** original stored in `/data/sources/`.<br><br>✓ `source_id` + `source_range` recorded. | P0 |
| **FR-1.4** | Embed and index | **Given** chunks, **when** embedded, **then** vectors in LanceDB, metadata in SQLite. | P0 |

---

### Category: Ingestion — YouTube

| ID | User Story | Acceptance Criteria | Pri |
|----|------------|---------------------|-----|
| **FR-2.1** | Fetch transcript | **Given** URL, **when** fetched, **then** transcript + chapters extracted.<br><br>✓ Metadata stored. | P0 |
| **FR-2.2** | Hierarchical chunking | **Given** chapters, **then** parent + child chunks.<br><br>✓ Children reference parent. | P0 |
| **FR-2.3** | Summarize using template | **Given** chunk, **when** processed, **then** uses YouTube template. | P0 |
| **FR-2.4** | Preserve ground truth | **Given** summary, **then** original transcript stored.<br><br>✓ Timestamps preserved. | P0 |

---

### Category: Query & Interface

| ID | User Story | Acceptance Criteria | Pri |
|----|------------|---------------------|-----|
| **FR-3.1** | Search | **Given** query, **then** top-k chunks returned with scores. | P0 |
| **FR-3.2** | View original source | **Given** chunk, **when** "View Source" clicked, **then** original shown.<br><br>✓ Highlights relevant range. | P0 |
| **FR-3.3** | View pipeline trace | **Given** chunk, **when** inspected, **then** shows: model, prompt, timing. | P0 |
| **FR-3.4** | Group similar results | **Given** similar chunks, **then** grouped with all sources shown. | P1 |
| **FR-3.5** | Web UI | Pages: Ingest (ChatGPT), Ingest (YouTube), Search, Settings. | P0 |
| **FR-3.6** | Pipeline visualization | Diagram showing stages + stats for each ingestion run. | P1 |

---

## 7. User Flows

---

### UF-1: ChatGPT Ingest & Search (MVP)

> **Goal:** Upload ChatGPT export, search it, view original sources.

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1 | Opens Ingest → ChatGPT | Upload form shown |
| 2 | Uploads `conversations.json` | Parses, shows "Found 847 conversations" |
| 3 | Reviews preview | Sample conversations listed |
| 4 | Selects summarization model | Ollama/OpenRouter options |
| 5 | Clicks "Start Ingestion" | Pipeline: Normalize → Summarize → Embed → Index |
| 6 | Watches progress | "Processing 124/847... Summarizing with llama3.2..." |
| 7 | Sees completion stats | "847 convos → 1,203 chunks. Originals stored." |
| 8 | Goes to Search | — |
| 9 | Types query | — |
| 10 | Sees results | Ranked list with summaries, scores, source badges |
| 11 | Clicks "View Source" | Original conversation shown, relevant messages highlighted |
| 12 | Clicks "View Trace" | Waterfall: prompt used, model, timing |

**FRs Touched:**

| FR | Title |
|----|-------|
| FR-1.1 | Upload ChatGPT export |
| FR-1.2 | Summarize using template |
| FR-1.3 | Preserve ground truth |
| FR-1.4 | Embed and index |
| FR-3.1 | Search |
| FR-3.2 | View original source |
| FR-3.3 | View pipeline trace |
| FR-3.5 | Web UI |

---

### UF-2: YouTube Ingest & Search (MVP)

> **Goal:** Add YouTube video, search across sources, view at timestamp.

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1 | Opens Ingest → YouTube | URL input shown |
| 2 | Pastes YouTube URL | — |
| 3 | Clicks "Fetch" | yt-dlp fetches transcript |
| 4 | Sees metadata | Title, channel, duration, chapter count |
| 5 | Reviews chapters | Chapter cards with timestamps |
| 6 | Clicks "Process" | Pipeline: Chunk → Summarize → Embed |
| 7 | Sees completion | "12 chapters → 28 chunks. Transcript stored." |
| 8 | Searches | — |
| 9 | Sees results from both sources | ChatGPT + YouTube badges |
| 10 | Clicks YouTube result | Summary + "Watch at 14:32" link |
| 11 | Clicks "View Source" | Original transcript shown with timestamp range |
| 12 | Clicks parent context | Parent chapter summary displayed |

**FRs Touched:**

| FR | Title |
|----|-------|
| FR-2.1 | Fetch transcript |
| FR-2.2 | Hierarchical chunking |
| FR-2.3 | Summarize using template |
| FR-2.4 | Preserve ground truth |
| FR-3.1 | Search |
| FR-3.2 | View original source |
| FR-3.5 | Web UI |

---

### UF-3: Enhanced Features

> **Goal:** Features that improve both flows above.

| Feature | Description | FRs |
|---------|-------------|-----|
| Result grouping | Similar chunks grouped, all sources shown | FR-3.4 |
| Pipeline viz | Visual diagram of ingestion stages | FR-3.6 |
| Template editor | Edit ingestion prompts in Settings | — |

---

## 8. Epics

> Vertical slices. Each delivers usable value.

| Epic | Name | Primary Flow | Duration | Success |
|------|------|--------------|----------|---------|
| **E1** | ChatGPT Search | UF-1 | 1-2 weeks | Upload, search, view source + trace |
| **E2** | YouTube Search | UF-2 | 1 week | Add videos, unified search |
| **E3** | Polish | UF-3 | 3-4 days | Grouping, pipeline viz |

**Total: ~3 weeks MVP** 🎯

---

### Epic 1: ChatGPT Search

| Flow | UF-1: ChatGPT Ingest & Search |
|------|------------------------------|

**FRs:**

| FR | Title |
|----|-------|
| FR-1.1 | Upload ChatGPT export |
| FR-1.2 | Summarize using template |
| FR-1.3 | Preserve ground truth |
| FR-1.4 | Embed and index |
| FR-3.1 | Search |
| FR-3.2 | View original source |
| FR-3.3 | View pipeline trace |
| FR-3.5 | Web UI |

**Deliverables:**
- [ ] Monorepo setup (fork flashbuild-llmcomparer)
- [ ] LanceDB + SQLite schema
- [ ] ChatGPT parser
- [ ] Ingestion template system
- [ ] Summarization pipeline
- [ ] Ground truth storage
- [ ] Search UI
- [ ] "View Source" with highlighting
- [ ] "View Trace" waterfall

---

### Epic 2: YouTube Search

| Flow | UF-2: YouTube Ingest & Search |
|------|------------------------------|

**FRs:**

| FR | Title |
|----|-------|
| FR-2.1 | Fetch transcript |
| FR-2.2 | Hierarchical chunking |
| FR-2.3 | Summarize using template |
| FR-2.4 | Preserve ground truth |

**Deliverables:**
- [ ] YouTube ingest page
- [ ] yt-dlp integration
- [ ] Chapter extraction
- [ ] Parent/child chunks
- [ ] Timestamp links
- [ ] Source type badges in search

---

### Epic 3: Polish

| Flow | UF-3: Enhanced Features |
|------|-------------------------|

**FRs:**

| FR | Title |
|----|-------|
| FR-3.4 | Group similar results |
| FR-3.6 | Pipeline visualization |

**Deliverables:**
- [ ] Result grouping UI
- [ ] Pipeline diagram page
- [ ] Ingestion stats display

---

## 9. Architecture

### Tech Stack

| Component | Choice |
|-----------|--------|
| **Frontend** | Next.js 15+ |
| **Vector DB** | LanceDB |
| **Metadata** | SQLite |
| **LLMs** | Ollama + OpenRouter |
| **Embeddings** | transformers.js |
| **YouTube** | yt-dlp |

### Project Structure

```
ragbrain/
├── apps/
│   └── web/              # Next.js frontend
├── packages/
│   ├── core/             # Pipeline logic
│   ├── db/               # LanceDB + SQLite
│   ├── llm/              # Model clients
│   └── templates/        # Ingestion templates
└── data/
    ├── lancedb/          # Vectors
    ├── sqlite/           # Metadata + chunks
    └── sources/          # Original files (ground truth)
```

---

## 10. Backlog

> Features for post-MVP.

| Priority | Feature | Notes |
|----------|---------|-------|
| 🔴 High | MCP integration | Query from Cursor/Cline |
| 🔴 High | Chat Q&A | Conversational interface |
| 🟡 Medium | Interest ranking | Positive/negative keywords |
| 🟡 Medium | Ingestion-time dedup | Synthesize similar chunks |
| 🟡 Medium | Markdown ingestion | Third source type |
| 🟢 Low | CLI | Scripting/automation |
| 🟢 Low | Reranking | Quality rescoring |

---

*Generated: 2025-12-27*
