---
name: Bulletproof backtest epic
overview: "Create an integrated epic with three tickets: (1) fast, fixture-grounded unit tests for the first 15 minutes of real days, (2) correctness/realism refactors across the four strategies + parameter plumbing, and (3) an experiment runner (unified validation + grid search) that produces identifiable, readable runs."
todos:
  - id: ticket1-unit-tests-fixtures
    content: Add `npm run test:unit`, create first-15m real-data fixtures, and write invariant-based smoke tests for the 4 strategies.
    status: pending
  - id: ticket2-correctness-refactor
    content: Wire strategyParams end-to-end, register ORB/VWAP in registry, fix ORB minute handling + confirmation bug, fix VWAP performance/volume/entry realism, and choose/enforce a stop sequencing model (reduce lookahead).
    status: pending
  - id: ticket3-experiment-runner-unified
    content: Create `scripts/run-experiment.js` with dual modes (Validation vs Grid Search), interactive prompts, and consolidated permutation logic. Run Oct-Nov 2025 experiment.
    status: pending
---

# Bulletproof backtest epic (3 tickets)

## Context (what we learned)

- The “compare 4 strategies” setup currently has correctness + integration gaps:
- `orb-retest-breakout` and `vwap-deviation-fade` exist as files, but are not registered in the strategy registry (`src/lib/backtest/strategies/index.ts`) so they may not actually run.
- `strategyParams` is used by `scripts/analyzer/analyze-permutations.js`, but the backtest router (`src/lib/backtest.ts` → `generateAlgoTrades`) must pass it into strategy `run()` or else those permutations are not real.
- ORB-R currently treats “minutes” as “number of candles” which is wrong for 1-second data.
- VWAP-Fade is O(n²) per day due to recomputing VWAP from scratch and can produce `undefined` VWAP if volume is 0.
- ATR trailing and stepped SL logic are vulnerable to same-bar sequencing/lookahead effects if stop levels are updated using intrabar extremes and then tested in that same bar.

## Epic goal

Make the strategy system **trustworthy** and the experiment loop **repeatable and readable**:

- determinism + no silent fallbacks
- no obvious lookahead
- fixtures from real data (first 15 minutes only)
- a unified experiment runner that outputs timestamped run folders and rich metrics

---

## Ticket 1 — Unit tests + real-data fixtures (first 15 minutes)

**Outcome**: a fast “unit-test gate” that smoke-tests strategy behavior and guards against regressions.

### 1.1 Add a dedicated unit-test command

- Add a root script (recommended): `npm run test:unit` that runs Vitest against `src/**/*.test.ts`.
- Keep existing `npm test` unchanged (it already chains Node scripts + Playwright).

**Files**:

- `package.json` (root): add `test:unit` script.
- Optional: add `vitest.config.ts` at repo root if needed to control includes/paths.

### 1.2 Create fixtures from real data (trimmed to first 15 minutes)

- Create small JSON fixtures containing only:
- `date`, `startPrice`, `candles` (first 15 minutes of 1s candles)
- Keep fixtures tiny and reproducible.

**Files/paths** (proposed):

- New directory: `src/lib/backtest/__fixtures__/first-15m/`
- Each file named `YYYY-MM-DD.first15m.json`

### 1.3 Add strategy smoke tests on fixtures

Write tests that assert **invariants** (stable, non-brittle) rather than exact PnL.

We’ll intentionally include a small set of **“red tests”** that should fail today and only pass once Ticket 2 lands. This prevents us from “forgetting” the known correctness gaps.

- No throws; completes quickly.
- Output shape: rows are paired open/close; close rows have `net` defined.
- No trades after cutoff (if cutoff is within the 15m fixture).
- Strategy-specific invariants:
- ORB-R: no entry before ORB window ends; retest-required implies a retest occurred.
- VWAP-Fade: if volume is 0 in fixture, VWAP still behaves deterministically (either via a defined fallback or by explicitly skipping the strategy with a clear reason).
- ATR trailing / stepped SL: stop only tightens in favorable direction; stop is never “improved” and then hit in a way that violates the chosen sequencing model.

**Files** (examples):

- New: `src/lib/backtest/strategies/__tests__/orb-retest-breakout.smoke.test.ts`
- New: `src/lib/backtest/strategies/__tests__/vwap-deviation-fade.smoke.test.ts`
- New: `src/lib/backtest/strategies/__tests__/atr-trailing-sldrag.smoke.test.ts`
- New: `src/lib/backtest/strategies/__tests__/strategy12.10.1.smoke.test.ts`

### 1.3.1 Test structure: three layers (fast → realistic → strict)

In each strategy test file, use 3 describe-blocks so it’s easy to follow and debug:

- **Layer A — “shape + determinism”** (fastest): basic invariants only.
- **Layer B — “15m fixture behavior”**: asserts about when trades are allowed to occur in the first 15 minutes.
- **Layer C — “strict correctness contract” (red tests)**: tests that should fail until Ticket 2 fixes are merged.

### 1.3.2 Shared test helpers (keep tests readable)

Create a tiny set of helpers so every test reads the same way:

- `loadFixtureFirst15m(date): { startPrice, candles }`
- `runStrategy(strategyId, params): AlgoTradeRow[]`
- `assertRowsWellFormed(rows)` (open/close pairing, ids, timestamps monotonic, close rows have net)
- `summarize(rows)` (trade count, net sum, first/last trade timestamp) for easy debugging output

Proposed helper file:

- New: `src/lib/backtest/__tests__/testUtils.ts`

### 1.3.3 “Red tests” that should fail until Ticket 2 is done (explicitly marked)

Use Vitest’s “expected failure” mechanism (or an explicit skip with a TODO) so it’s obvious these are contracts we’re enforcing.

**Red test set A — Router/param plumbing (should fail until Ticket 2.1)**\n

- When `strategyParams` changes, strategy behavior must change:\n
- ORB-R: varying `orbWindowMinutes` changes “earliest possible entry time”.\n
- VWAP-Fade: varying `deviationAtr` changes trade frequency.\n
This should fail until `src/lib/backtest.ts` passes `strategyParams` through `generateAlgoTrades()` to `strategy.run(...)`.

**Red test set B — Registry integrity (should fail until Ticket 2.2)**\n

- `getStrategy("orb-retest-breakout")` and `getStrategy("vwap-deviation-fade")` must exist and have stable names/ids.\n
This should fail until `src/lib/backtest/strategies/index.ts` registers both strategies.

**Red test set C — ORB minutes correctness (should fail until Ticket 2.3)**\n

- With 1-second candles, `orbWindowMinutes: 5` means ~300 candles, not 5 candles.\n
Test expectation: ORB-R must not enter before `09:35:00` if ORB window is 5 minutes (depending on the fixture start timestamp).\n
This should fail until ORB-R uses timestamp-based time windows rather than treating minutes as candle counts.

**Red test set D — ORB confirmation leak (should fail until Ticket 2.3)**\n

- In `two_closes` mode, a failed second close must not “leak” a prior breakout direction into a later entry.\n
Test expectation: use a fixture crafted/selected to contain a one-bar breakout followed by immediate failure; ORB-R should not count it as a valid signal.

**Red test set E — VWAP determinism and volume handling (should fail until Ticket 2.4)**\n

- If volume is zero in the fixture, VWAP must still behave deterministically (explicit fallback) OR the strategy must clearly no-op in a documented way.\n
This should fail until VWAP-Fade’s volume handling policy is made explicit and covered.

**Red test set F — Stop sequencing / no same-bar lookahead (should fail until Ticket 2.5)**\n

- For ATR trailing and stepped SL, stop updates must follow the chosen sequencing model.\n
If we pick “stop updates apply next bar”, then:\n
- Stop level used to evaluate candle i must equal the stop computed at candle i-1.\n
This should fail until we refactor stop update timing consistently.

### 1.4 Fixture selection method (documented)

- Choose ~10 dates with variety: trend day, chop day, gap day, high-vol day.
- Document why each date was chosen in comments at the top of each test.

---

## Ticket 2 — Strategy + plumbing correctness refactor (make comparisons real)

**Outcome**: the four strategies execute with comparable semantics, correct time handling, and no silent “fake sweeps”.

### 2.0 Execution Strategy (Nuance added)

- **Test-Driven Refactor**: Work systematically by unskipping the "Red Tests" created in Ticket 1 one by one.
- **Red Test Mapping**:
- `RED TEST A` -> Plumbing (Ticket 2.1)
- `RED TEST B` -> Registry (Ticket 2.2 - already done, verify)
- `RED TEST C & D` -> ORB Logic (Ticket 2.3)
- `RED TEST E` -> VWAP Logic (Ticket 2.4)
- `RED TEST F` -> Stop Sequencing (Ticket 2.5)

### 2.1 Wire `strategyParams` end-to-end

- Ensure the router passes `strategyParams` into strategies.

**Files**:

- `src/lib/backtest.ts`:
- Extend `BacktestParams` to include `strategyParams?: Record<string, unknown>`
- Extend `buildBacktestParams(...)` to accept/pass `strategyParams`
- Update `generateAlgoTrades(...)` signature and pass to `strategy.run(...)`
- `src/lib/backtest/strategies/types.ts`:
- Ensure `StrategyRunFunction` includes `strategyParams?` as the last arg (it already does).

### 2.2 Register ORB-R + VWAP-Fade in the registry

**Files**:

- `src/lib/backtest/strategies/index.ts`:
- Import and add `strategyOrbRetest` and `strategyVwapFade` to the `strategies[]` list.

### 2.3 Fix ORB-R to be correct on 1-second data

Key fixes:

- **CRITICAL:** Interpret `orbWindowMinutes`, `avoidFirstMinutes`, `retestTimeoutMinutes` by **timestamp delta**, not “number of candles”.
- *Current Bug*: `orbWindowMinutes: 5` currently waits 5 candles (5 seconds). It must wait until `timestamp >= start_time + 5 mins`.
- Fix the `two_closes` confirmation bug so a failed confirmation does not leak stale `direction/breakoutCandleIndex`.
- Make entry semantics consistent with ORB intent:
- Enter based on ORB breakout + confirmation/retest, not by falling back to `startPrice ± triggerPts` unless explicitly intended.

**Files**:

- `src/lib/backtest/strategies/orb-retest-breakout.ts`
- (Optional new helpers) `src/lib/backtest/helpers/time.ts` for “minutes since open” parsing.

### 2.4 Fix VWAP-Fade realism + performance

Key fixes:

- Replace O(n²) VWAP calculation with O(n) running sums.
- **Volume Handling Policy:** Define clear behavior when volume is 0 (Red Test E):
- *Policy*: If volume is 0, log a warning and either skip the candle or treat volume as 1 (equal weight). Do NOT return `undefined` or `NaN`.
- Replace “phantom entry price” with an entry rule tied to observable levels (e.g., confirmation candle close ± slippage).
- Align TP model with mean-reversion intent (e.g., VWAP touch / partials) OR explicitly document “TP is startPrice-based” and why.

**Files**:

- `src/lib/backtest/strategies/vwap-deviation-fade.ts`

### 2.5 Reduce lookahead/sequencing risk in stop logic

Pick and enforce one consistent sequencing model:

- **Model A (recommended for simplicity)**: stop updates occur on candle close and apply starting next candle.
- **Model B**: intrabar resolver for every candle when stop/target changes (more complex).

Apply consistently to:

- `src/lib/backtest/strategies/atr-trailing-stop.ts`
- `src/lib/backtest/strategies/strategy12dot10dot1.ts`

---

## Ticket 3 — Experiment Runner (Unified)

**Goal:** Execute a 2-month backtest (Oct-Nov 2025) for the 4 corrected strategies. The runner must support two distinct modes, selectable at startup: **Validation** (default checks) and **Grid Search** (optimization).

### 3.1 Create `scripts/run-experiment.js`

This script will be the new entry point for backtesting.

**Features:**

1.  **Workflow:**

-   Starts by running **Validation Mode** (single run per strategy with default params).
-   Displays a summary "Report Card" of the validation run.
-   Prompts to proceed to **Grid Search Mode** (or exits if `--validation-only` flag is present).
-   If proceeding, prompts for grid confirmation (estimated runs/time) before executing.

2.  **Configuration (CLI & Interactive):**

-   `--strategies <list>`: Select specific strategies (default: all available).
-   `--validation-only`: Skip grid search step.
-   `--yes` / `-y`: Auto-confirm grid plan (skip interactive prompts).
-   `--start-date`, `--end-date`: Override default range (Oct-Nov 2025).

3.  **Permutation Engine (Grid Search):**

-   Extract and port the comprehensive permutation logic from `scripts/analyzer/analyze-permutations.js` and `analyzeradvanced.js`.
-   Ensure all dimensions are covered:
  -   **Universal:** TP, SL, Trigger, MaxRT, Cutoff, SteppedSL.
  -   **ATR Strategy:** ATR Period, ATR Multiplier.
  -   **ORB Strategy:** Window Minutes, Breakout Buffer, Confirmation Mode, Retest Logic.
  -   **VWAP Strategy:** Deviation ATR, Confirmation Mode, Stop Multiplier.

4.  **Rich Metrics (Insight Engine):**

-   **Profitability:** Net PnL, Profit Factor, Pts/Trade.
-   **Risk:** **Max Drawdown**, Win Rate, Consecutive Losses.
-   **Insight (Why it worked):**
  -   `win_rate_long` vs `win_rate_short` (Directional Bias).
  -   `avg_time_win` vs `avg_time_loss` (Duration Analysis).
  -   `max_consecutive_loss` (Psychological Risk).

**Implementation Details:**

-   **Dependencies:** `jiti` (TS support), `fs`, `path`, `readline`.
-   **Output:**
-   `backtest/experiments/YYYY-MM-DD_HH-MM-SS/`
  -   `manifest.json`: Run config.
  -   `validation_results.csv`: Results from the validation step.
  -   `grid_results.csv`: Results from the grid search step.
  -   `summary.md`: Human-readable report of both steps.

### 3.2 Verify & Execute

1.  Run the script with default arguments (Oct-Nov 2025).
2.  Verify the "Validation" phase passes for the 4 corrected strategies.
3.  Confirm the "Grid Search" phase generates meaningful permutations and results.
4.  Check that new metrics (`max_drawdown`, `win_rate_long`) are present in the output CSVs.

### 3.3 Refinement

-   Ensure console output is clean (progress bars, clear tables).
-   Check that `strategy12.10.1` is included and configurable.

---

## Acceptance criteria (what “bulletproof” means)

- Unit tests:
- `npm run test:unit` is fast and stable.
- Fixtures are only first 15 minutes and committed.
- Smoke tests cover the 4 strategies with clear invariants.
- Strategies:
- ORB window is truly minutes, not candle-count.
- VWAP computation is O(n) and deterministic on your data.
- Stop update sequencing rule is explicit and consistent.
- Analyzer permutations actually change behavior (no fake sweeps).
- Experiment Runner:
- `scripts/run-experiment.js` provides dual-mode execution (Validation -> Optimization).
- Handles 2-month data range (Oct-Nov 2025) robustly.
- Produces clear, readable reports in timestamped folders.