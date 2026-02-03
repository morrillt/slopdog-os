---
name: Markdown Metadata CSV Exporter
overview: Create a new CLI script to recursively scan a directory for markdown files and export their front matter metadata (path, tags, facets, summaries) to a CSV file.
todos:
  - id: create-export-script
    content: Create scripts/export-metadata.ts with recursive scanning logic
    status: completed
  - id: implement-extraction
    content: Implement metadata extraction using existing parser utility
    status: completed
  - id: add-csv-export
    content: Add CSV formatting and file writing logic
    status: completed
  - id: add-cli-command
    content: Add CLI command using commander for target directory and output path
    status: completed
isProject: false
---

I will create a new script `scripts/export-metadata.ts` that uses `glob` to find all `.md` files in a target directory. For each file, it will use the existing `parseFrontMatterFromFile` utility to extract metadata and then write the results to a CSV file.

### Proposed Architecture

```mermaid
graph TD
    CLI[scripts/export-metadata.ts] -->|Recursive Scan| FS[File System]
    FS -->|Markdown Files| CLI
    CLI -->|Parse| Parser[src/lib/rag/parser.ts]
    Parser -->|Metadata| CLI
    CLI -->|Write| CSV[metadata.csv]
```

### Key Components

1.  **Scanner**: Use `glob` or recursive `fs.readdir` to find all `.md` files.
2.  **Parser**: Leverage `parseFrontMatterFromFile` from `src/lib/rag/parser.ts`.
3.  **Exporter**: Format the extracted data into CSV rows, handling special characters in summaries and tags.

### Implementation Details

-   **Path**: `scripts/export-metadata.ts`
-   **Dependencies**: `commander`, `glob`, `csv-stringify` (or simple manual CSV formatting if preferred).
-   **Columns**: `path`, `title`, `type`, `status`, `tags`, `human_summary`, `vector_summary`.