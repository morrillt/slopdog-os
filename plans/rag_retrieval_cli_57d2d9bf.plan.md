---
name: RAG Retrieval CLI
overview: Create a CLI tool `scripts/retrieve.ts` that takes a natural language query, generates an embedding, and retrieves the most relevant documents from the SQLite database using vector similarity search.
todos:
  - id: create-retrieve-script
    content: Create scripts/retrieve.ts with CLI scaffolding
    status: pending
  - id: implement-vector-search
    content: Implement vector search query logic using sqlite-vec
    status: pending
  - id: add-result-formatting
    content: Add result formatting and display (title, score, summary)
    status: pending
  - id: test-retrieval
    content: Test retrieval with sample queries against the existing index
    status: pending
isProject: false
---

I will create a new script `scripts/retrieve.ts` that implements the retrieval side of the RAG pipeline. It will accept a query string, embed it using the same model as the archive process, and query the `documents_vec` virtual table for nearest neighbors.

### Proposed Architecture

```mermaid
graph TD
    CLI[scripts/retrieve.ts] -->|Query| Embedder[src/lib/rag/embedder.ts]
    Embedder -->|Vector| DB[SQLite Database]
    DB -->|Vector Search| Results[Top K Documents]
    Results -->|Format| CLI
    CLI -->|Display| User
```

### Key Components

1.  **CLI Interface**: Use `commander` to accept a query argument and optional flags (e.g., `--limit`).
2.  **Embedding**: Reuse `src/lib/rag/embedder.ts` to convert the query into a vector.
3.  **Vector Search**: Execute a SQL query against the `documents_vec` table using `vec_distance_cosine` (or similar) to find matches.
4.  **Result Formatting**: Join with the `documents` table to retrieve metadata (title, path, summary) and display it nicely.

### Implementation Details

-   **Path**: `scripts/retrieve.ts`
-   **Dependencies**: `commander`, `better-sqlite3`, `sqlite-vec`
-   **SQL Logic**:
    ```sql
    SELECT
      rowid,
      distance
    FROM documents_vec
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
    ```
    *(Note: `sqlite-vec` syntax might vary slightly depending on the exact version/function used, e.g., `vec_distance_cosine` vs `MATCH`)*.

### SQL Query Strategy for `sqlite-vec`
Since `sqlite-vec` is relatively new, I will use the standard KNN search pattern:
```sql
SELECT
  rowid,
  distance
FROM documents_vec
WHERE embedding MATCH ?
ORDER BY distance
LIMIT k
```
Then join with `documents` table on `rowid` to get the details.
