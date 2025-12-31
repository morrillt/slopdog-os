---
name: ""
overview: ""
todos: []
---

# EPIC-4: Parallel Backtester with SQLite & Realtime Monitoring

This epic implements a robust, parallelized backtesting runner that processes strategy permutations using a worker pool. Results are written immediately to a SQLite database (`results.db`), enabling real-time monitoring and analysis without file locking issues.

## User Experience

1.  **Configure**: Edit `scripts/analyzer/analyzer.config.json` to set `WORKER_COUNT`.
2.  **Run Analysis**: `node scripts/analyzer/parallel-db.js`
3.  **Watch Progress**: 

    -   **CLI**: A built-in progress bar shows overall status.
    -   **GUI**: Open `sqlite-web` (or VS Code SQLite) to see rows populate in real-time, sort by profit, or filter by strategy.

## Architecture

### 1. Database (`results.db`)

-   **Technology**: `better-sqlite3` (synchronous, fast, process-local DB).
-   **Mode**: WAL (Write-Ahead Logging) enabled.
-   **Schema**: `results` table containing:
    -   `id`: Primary key.
    -   `ordering_index`: The original index from the permutation list (preserves "first entered" order).
    -   `strategy_id`, `tp`, `sl`, etc.: Strategy parameters.
    -   `net_profit`, `trades`, `win_rate`, etc.: Performance metrics.
    -   `timestamp`: Completion time.

### 2. Parallel Runner (`scripts/analyzer/parallel-db.js`)

-   **Configuration**: Reads worker count from `scripts/analyzer/analyzer.config.json` (defaults to auto-detect if missing).
-   **Main Process**: 
    -   Initializes SQLite DB (Single Writer).
    -   Generates full permutation list (preserving config order).
    -   Manages Worker Pool.
    -   Dispatches tasks **strictly in order** (Permutation 0, then 1...) to ensure early permutations appear first in the GUI.
-   **Worker Threads**:
    -   Receive task (permutation + day files).
    -   Load candle data (cached per worker).
    -   Run backtest.
    -   Return aggregated metrics to Main.

## Tickets

### TICKET 4.1: Dependencies & Configuration Setup

-   **Goal**: Prepare the environment and configuration system.
-   **Tasks**:
    -   Install `better-sqlite3`.
    -   Create `scripts/analyzer/analyzer.config.json` (schema: `{ "WORKER_COUNT": 4 }`).
    -   Add `.gitignore` entry for `results.db` and `results.db-wal`.

### TICKET 4.2: Parallel Runner Core (Main Process)

-   **Goal**: Orchestrate the backtest run and database writes.
-   **Tasks**:
    -   Create `scripts/analyzer/parallel-db.js`.
    -   Implement `loadConfig` to read `analyzer.config.json` and permutation env vars.
    -   Implement SQLite setup (table creation, WAL mode).
    -   Implement "Single Writer" logic (Main process inserts results).
    -   Implement ordered dispatch logic (send Perm #0, #1... to available workers).

### TICKET 4.3: Worker Thread Implementation

-   **Goal**: Perform the actual backtest computation.
-   **Tasks**:
    -   Implement worker logic in `scripts/analyzer/parallel-db.js` (or separate file).
    -   Implement "Load Once" caching for candle data to minimize IO.
    -   Connect `runBacktestForDayWithStrategy` loop.
    -   Return structured results to parent.

### TICKET 4.4: Monitoring & Documentation

-   **Goal**: Make the system observable and easy to use.
-   **Tasks**:
    -   Add CLI progress bar to Main process.
    -   Add documentation for using `sqlite-web` or similar tools to watch `results.db`.
    -   Verify "First In, First Out" ordering in the DB.

## Verification

-   Verify `WORKER_COUNT` config is respected.
-   Verify `results.db` can be queried while script is running.
-   Verify `ordering_index` 0 appears in DB before index 100.