---
title: "Research: Transcript Summarization with Citations Pipeline"
updated: "2026-01-28"
facets:
  type: research
  status: draft
  repo:
    path: docs/research/transcript-citation-pipeline.md
tags:
  - doc/research
  - tech/llm
  - tech/rag
---

## Problem Statement

How should we architect a transcript summarization pipeline that produces summaries with traceable citations back to specific source transcript segments, supporting both single-clip and multi-clip attribution patterns?

## Additional Context

- **Domain**: Video/audio transcript processing
- **Core Requirement**: Each summary point must link to source evidence
  - Citation includes: transcript text, timestamps
  - Must support navigation from summary → source
- **Complexity Tiers**:
  - **Tier 1 (v1.0)**: One summary point ← one contiguous transcript segment
  - **Tier 2 (v2.0)**: One summary point ← multiple non-contiguous segments
- **Scope Boundaries**:
  - ✅ In scope: Pipeline architecture, data model, citation linking
  - ❌ Out of scope (for now): UI/UX, rendering, playback
- **Deliverable**: Multiple architectural approaches with trade-offs

## Confirmed Keywords

1. `grounded summarization with citations LLM`
2. `LLM summarization with citations`
3. `citation-aware summarization LLM`

## Research Audit Log

### Cumulative Search Summary

| Step | Platform | Keywords | Sources Analyzed | Findings |
|------|----------|----------|------------------|----------|
| 3 | Reddit | 9 | 0 | 0 |
| 4 | YouTube | 3 | 15 (3 transcripts) | 5 |
| 5 | GitHub | 3 | 12 | 6 |
| 6 | Web (General) | 5 | 12 | 7 |
| **Total** | | **20** | **39** | **18** |

### Keyword Evolution

| Step | Keywords Added | Keywords Dropped | Rationale |
|------|----------------|------------------|-----------|
| 2.5 (Initial) | grounded summarization, LLM citations, citation-aware | - | User confirmed |
| 3 (Reddit) | - | - | No results found |
| 4 (YouTube) | LlamaExtract, BM25 verification, in-line citations | - | Tool names from tutorials |
| 5 (GitHub) | CitationQueryEngine, CaLF, MIRAGE, Generate-then-Ground, SCOPE | - | Academic projects discovered |
| 6 (Web) | LongCite, Citekit, Cited Text Spans, Attributed QA, LangExtract | - | Papers with formal frameworks |

### Key Pain Points Identified

| Pain Point | Resolution | Source |
|------------|------------|--------|
| "How to add citations during RAG?" | LlamaIndex CitationQueryEngine | GitHub, YouTube |
| "Citation accuracy is low (<60%)" | CaLF fine-tuning approach / verification | CaLF Paper |
| "Self-citation prompting is unreliable" | MIRAGE model internals / verification pipeline | MIRAGE Paper, Trelis Video |
| "Need fine-grained (span-level) citations" | LongCite, Cited Text Spans | Academic papers |
| "Need to verify citations post-generation" | BM25 + cosine similarity verification | Trelis Video |
| "Need guaranteed verbatim citations" | Google LangExtract | GitHub |

## Options Explored

### Option A: Google LangExtract

**What**: Python library (23.7k stars) for structured extraction with precise source grounding.

**How citations work**: Extractions must match source text exactly (verbatim). Built-in verification warns if text doesn't match.

```python
import langextract as lx

result = lx.extract(
    text_or_documents=transcript,
    prompt_description="Extract key points with citations",
    examples=[...],  # Few-shot examples required
    model_id="gemini-2.5-flash",
    extraction_passes=3  # Multi-pass for recall
)
```

**Pros**:
- ✅ Grounding is core feature - enforced verbatim citations
- ✅ Google backed, 23.7k stars, actively maintained
- ✅ Multi-pass extraction for long documents
- ✅ Built-in HTML visualization

**Cons**:
- ❌ Requires defining few-shot examples
- ❌ Needs Gemini API key (or Ollama)
- ❌ Text positions, not timestamps (needs adaptation)

---

### Option B: LlamaIndex CitationQueryEngine

**What**: Built-in query engine that adds citation labels during RAG retrieval.

**How citations work**: LLM generates `[1]`, `[2]` references pointing to source nodes.

```python
from llama_index.core.query_engine import CitationQueryEngine

engine = CitationQueryEngine.from_args(
    index,
    citation_chunk_size=512,
    similarity_top_k=3
)
response = engine.query("Summarize the key points")
# response.response = text with [1], [2] citations
# response.source_nodes = the actual source chunks
```

**Pros**:
- ✅ Simplest implementation (~20 lines)
- ✅ No examples required
- ✅ Works with any LLM
- ✅ Timestamps via chunk metadata

**Cons**:
- ❌ No verification - trusts LLM to cite correctly
- ❌ Citation numbering bug (non-sequential)
- ❌ Single-source citations only

---

### Option C: Generate-then-Verify (Custom)

**What**: Prompt LLM for JSON citations, verify each against source using fuzzy matching, retry if fails.

**How citations work**: Post-generation verification with BM25/cosine similarity (90% threshold).

**Pros**:
- ✅ Catches hallucinated citations
- ✅ Framework agnostic
- ✅ Confidence scores

**Cons**:
- ❌ Higher latency (verification + retries)
- ❌ More complex to implement
- ❌ 90% threshold is heuristic

---

## Recommendation

### For Simplicity (v1.0)

**LlamaIndex CitationQueryEngine** - fastest to implement, good enough for MVP.

### For Citation Accuracy

**Google LangExtract** - grounding is a first-class feature, worth the extra setup if citation reliability matters.

### Comparison Summary

| Priority | Recommendation |
|----------|----------------|
| **"I want it simple and fast"** | LlamaIndex CitationQueryEngine |
| **"I want citations I can trust"** | Google LangExtract |
| **"I need multi-pass for accuracy"** | Google LangExtract |

## Minimal Data Model (v1.0)

```typescript
interface TranscriptChunk {
  id: string;
  text: string;
  start_time_ms: number;
  end_time_ms: number;
}

interface CitedResponse {
  summary: string;        // Contains [1], [2] inline
  sources: TranscriptChunk[];  // Indexed by citation number
}
```

## Concerns / Risks / Assumptions

### Assumptions
- Transcript chunking at 512 tokens is reasonable granularity
- LLMs can reliably identify which spans support which claims
- Users will tolerate citation inaccuracies in v1.0

### Risks
- LlamaIndex may produce unverifiable citations in production
- LangExtract requires example definition upfront
- Timestamp accuracy depends on transcript source quality

### Concerns
- **Chunking is unsolved** - No consensus on optimal chunk size/overlap
- **LLM citation accuracy is <60%** - Per CaLF paper, baseline is poor without verification
- **Multi-source attribution is novel** - No proven implementations for v2.0 requirement

## Notes & Findings

| Summary of Finding | Source Link | Score | Justification |
|--------------------|-------------|-------|---------------|
| LlamaIndex `CitationQueryEngine` - built-in citation support, ~20 lines | [GitHub](https://github.com/run-llama/llama_index) | 90 | Official implementation |
| Google LangExtract - verbatim grounding, 23.7k stars | [GitHub](https://github.com/google/langextract) | 90 | Core grounding feature |
| CaLF: LLMs achieve <60% citation accuracy baseline, +34 F1 with fine-tuning | [arXiv](https://arxiv.org/abs/2406.13124) | 90 | Quantified the problem |
| MIRAGE: Self-citation prompting fails - models cite non-existent sources | [ACL](https://aclanthology.org/2024.emnlp-main.347/) | 90 | Identifies prompting limitation |
| RAG Verified Citations: BM25 + fuzzy match (90%) + retry loop | [YouTube](https://youtube.com/watch?v=-wGzSnhQKPM) | 95 | Practical verification approach |
| LlamaIndex workflows: retrieve → add citations → synthesize | [YouTube](https://youtube.com/watch?v=P4xHWojIB-M) | 90 | Implementation architecture |
| "Most difficult part is getting chunking correct" - no industry consensus | [YouTube](https://youtube.com/watch?v=RnCuOL-LBAw) | 90 | Key pain point |
| LongCite: Sentence-level citations for long-context QA | [arXiv](https://arxiv.org/html/2409.02897v2) | 85 | Fine-grained approach |
| Citekit: Modular toolkit for comparing citation methods | [arXiv](https://arxiv.org/html/2408.04662v2) | 80 | Evaluation framework |

## Sources and Footnotes

### YouTube Transcripts Analyzed
- [Building a RAG System with In-line Citations](https://youtube.com/watch?v=P4xHWojIB-M) - LlamaIndex workflow approach
- [RAG with Verified Citations](https://youtube.com/watch?v=-wGzSnhQKPM) - Trelis verification pipeline
- [Advanced RAG: Citations and Attributions](https://youtube.com/watch?v=RnCuOL-LBAw) - Milvus + LlamaIndex

### GitHub Repositories
- [LlamaIndex](https://github.com/run-llama/llama_index) - CitationQueryEngine
- [Google LangExtract](https://github.com/google/langextract) - Structured extraction with grounding
- [CaLF](https://github.com/amazon-science/learning-to-generate-answers-with-citations) - ACL 2024
- [MIRAGE](https://github.com/betswish/mirage) - EMNLP 2024

### Papers
- CaLF: Learning to Generate Answers with Citations (ACL 2024)
- MIRAGE: Model Internals-based Answer Attribution (EMNLP 2024)
- LongCite: Fine-grained Citations in Long-Context QA
- Citekit: Modular Toolkit for Citation Generation
