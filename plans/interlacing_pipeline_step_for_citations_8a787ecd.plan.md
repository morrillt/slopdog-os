---
name: Interlacing Pipeline Step for Citations
overview: Implement a new pipeline step that interlaces transcript text with H1/H2 headings derived from hierarchical summary bullets, enabling precise time-linked navigation.
todos:
  - id: create-prompt-template
    content: Create interlace-transcript.md prompt template
    status: pending
  - id: implement-interlace-fn
    content: Implement interlaceTranscript function in summarize.ts
    status: pending
  - id: implement-mapping-util
    content: Implement text-to-timestamp mapping utility in citations.ts
    status: pending
  - id: update-ingestion-route
    content: Update ingestion route to include interlacing and citation storage
    status: pending
isProject: false
---

### 1. Prompt Engineering

- Create a new prompt template `interlace-transcript.md` in `prompts/`.
- This prompt will take `transcript_text` and `summary_structure` (H1/H2 from bullets) as inputs.
- It will output a structured XML document where transcript text is wrapped in `<section>` or `<paragraph>` tags associated with specific headings.

### 2. Pipeline Integration

- Modify `src/lib/summarize.ts` to include a new function `interlaceTranscript(transcript, bullets)`.
- Update `src/app/api/ingest/route.ts` to call this function after `summarizeWholeVideo`.
- The flow will be: `Summarize` -> `Extract H1/H2` -> `Interlace` -> `Store`.

### 3. Time-Lookup & Citation Logic

- Implement a utility to map the interlaced text segments back to `transcript_segments` in the database.
- Since the LLM might slightly normalize text, use a fuzzy match or sequential alignment to find the `start_ms` for each heading/paragraph.
- Store these mappings in the `summary_citations` table.

### 4. UI/UX Enhancement (Future Step)

- Update the frontend to render the interlaced transcript.
- Convert headings and paragraphs into hyperlinks that call the video player's seek function using the stored `start_ms`.

### Essential Files

- [`prompts/interlace-transcript.md`](prompts/interlace-transcript.md) (New)
- [`src/lib/summarize.ts`](src/lib/summarize.ts) (Add interlacing logic)
- [`src/app/api/ingest/route.ts`](src/app/api/ingest/route.ts) (Update ingestion flow)
- [`src/lib/citations.ts`](src/lib/citations.ts) (New utility for text-to-time mapping)