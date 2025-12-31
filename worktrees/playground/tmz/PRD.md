# PRODUCT REQUIREMENTS DOCUMENT (PRD) — TMZ RAG Pipeline (v1.0)

## Meta: Ownership & Context
*   **Title:** TMZ (Transparent My Z-stream) RAG Pipeline
*   **Product Area:** Personal Knowledge Management / RAG Learning
*   **Owner:** Broz
*   **Status:** Draft
*   **Last Updated:** 2025-12-27

---

## 1. High-Level Description
### Intro Paragraph
A transparent, learning-focused RAG (Retrieval-Augmented Generation) pipeline designed for a "First Year CS Student" level of understanding. The system ingests ChatGPT history, YouTube transcripts, and personal markdown notes into a local vector database. It provides a "Traceable" UI where every stage of the pipeline (Ingestion -> Chunking -> Embedding -> Retrieval) is visible and configurable, allowing the user to optimize the retrieval logic through experimentation with local LLMs (Ollama) and hosted models (OpenRouter).

### Supporting Bullets
*   **Primary User Persona:** Self-taught developer/student learning RAG and LLM orchestration.
*   **Core User Journey Impacted:** Researching personal history, summarizing YouTube content, and surfacing "bugs/quirks" notes in a development environment.
*   **Business Value / KPI:** Reduced time-to-insight for personal archives; educational mastery of the RAG stack.
*   **Explicit Out-of-Scope:** Production-scale hosting (multi-user), complex real-time audio streaming ingestion.
*   **Constraints:** Must run primarily on a local desktop with Ollama; Node.js/TypeScript first.

---

## 2. Goals and Non-Goals
### Goals
*   **G-1: Transparency:** Every step of the pipeline must be "inspectable" via a Trace Log UI.
*   **G-2: Multi-Source Retrieval:** Successfully retrieve and synthesize information from ChatGPT JSON exports, YouTube Chapter-based transcripts, and Markdown notes.
*   **G-3: Local-First Mastery:** Leverage local LLMs (Q8B/Q114B) for sensitive/heavy processing while using OpenRouter for comparative analysis.
*   **G-4: "Knob" Control:** Expose configuration for chunk size, overlap, embedding models, and retrieval Top-K via `.env` and UI.

### Non-Goals
*   **NG-1:** Building a production-grade SaaS.
*   **NG-2:** Implementing complex real-time vector sync (KISS: Ingestion is triggered manually/via daemon).
*   **NG-3:** Advanced "Agentic" workflows (keep it as a retrieval pipeline for V1).

---

## 3. Functional Requirements
| ID | User Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **FR-1** | As a user, I want to ingest my ChatGPT JSON export so that I can search my previous conversations. | Given a JSON export path, the system parses conversations, splits them into logical chunks, and stores them in LanceDB. | P0 |
| **FR-2** | As a user, I want to ingest YouTube URLs with chapters so that I can see chapter-specific summaries. | System fetches transcripts via helper script, chunks by chapter (Parent) and semantic sub-chunks (Child). | P0 |
| **FR-3** | As a user, I want to "see the logic" of a retrieval so I can trust the output. | UI displays a "Trace Waterfall" showing query -> embedding -> vector search results -> LLM prompt. | P0 |
| **FR-4** | As a user, I want to call my knowledge base via MCP in Cursor so I can use it while coding. | An MCP server package provides tools to query the RAG pipeline. | P0 |
| **FR-5** | As a user, I want to compare OpenRouter vs Local LLM performance for the same query. | UI allows selecting two models and comparing their retrieval/generation outputs side-by-side. | P1 |
| **FR-6** | As a user, I want to synthesize similar chunks (80% overlap) into a single "Master Chunk" to reduce noise. | Ingestion logic uses a "Similarity Threshold" to identify and merge overlapping content while preserving unique details. | P1 |
| **FR-7** | As a user, I want to "drill in" to a chunk to see its raw metadata and vector. | Clicking a search result in the UI opens a modal showing the "Citation" and raw data. | P2 |
| **FR-8** | As a user, I want to see source citations and footnotes for all generated answers. | Generated responses include clickable links/references back to the original source (JSON/Markdown file). | P0 |

---

## 4. User Flows
### UF-1: The "Daily Digest" Flow
1.  User opens Next.js UI.
2.  User triggers "Scan YouTube History" (or clicks a URL).
3.  System processes the video, generating Chapter summaries.
4.  User sees a "News Page" style view of the latest transcripts, filtered by interest tags.

### UF-2: The "Traceable Search" Flow
1.  User types a natural language question (e.g., "How did I fix that React hydration bug?").
2.  UI shows the "Pipeline in Action" (Vector search progress).
3.  System returns a citation from a specific Markdown note and a ChatGPT snippet.
4.  User clicks "View Trace" to see why these specific chunks were chosen (score/relevance).

---

## 5. Architecture and Tech Options
### System Components
*   **Vector Database Options:**
    *   **LanceDB (Selected):** Best for this project because it stores data as **Parquet files** on disk. This allows the user to literally "see" the data files, aligns with Node.js/TypeScript-first approach, and is zero-config (serverless).
    *   **ChromaDB (Alternative):** Highly popular and explicit, but requires a separate process/container.
    *   **SQLite-VSS (Alternative):** Extremely lightweight and "local", but less powerful for complex vector operations.
*   **Metadata Storage:** **SQLite** (via Prisma or Drizzle) for handling tags, facets, and relationship mapping (Parent/Child chunks).
*   **Frontend:** **Next.js 15+** (extending `flashbuild-llmcomparer`).
*   **Processing Engine:** **Node.js** (TS) as the orchestrator; **Python** (via `child_process` or FastAPI) for heavy NLP tasks like YouTube transcript fetching or advanced chunking.
*   **LLM Orchestration:** **Ollama** (Local) and **OpenRouter** (Cloud).

---

## 6. Metrics and Instrumentation
| Metric | Definition | Success Threshold |
| :--- | :--- | :--- |
| **Retrieval Accuracy** | Manual "Thumbs up/down" on Trace Log results. | 80% Thumbs Up. |
| **Ingestion Latency** | Time to process 100 ChatGPT conversations. | < 30 seconds. |
| **Transparency Depth** | Number of pipeline stages visible in the UI Trace. | 100% (every stage must be logged). |

---

## 7. Risks, Dependencies, and Open Questions
*   **Risk:** YouTube transcript fetching APIs are often brittle/rate-limited.
*   **Dependency:** Local hardware must be able to run Ollama (Q8B) reliably alongside the Next.js app.
*   **Open Question:** What is the best "Interest Ranking" algorithm? (Decision: Start with simple positive/negative keyword scores and evolve to LLM-based scoring).

---

## Next Step: Ticket Generation
*   One ticket per FR row.
*   Sub-tasks from edge cases.
*   Tests from acceptance criteria.
*   Group by user flow.

