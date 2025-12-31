---
name: perm-report-cutoff-dimension
overview: Add trade count/points-per-trade reporting and include cutoff time as an additional permutation dimension for analyze-permutations
todos:
  - id: read-aggregation
    content: Review aggregation and output sections
    status: pending
  - id: config-cutoff
    content: Add cutoff list parsing and defaults
    status: pending
  - id: perm-loop
    content: Include cutoff in permutation grid and backtest calls
    status: pending
  - id: metrics-compute
    content: Aggregate trades and points-per-trade
    status: pending
  - id: output-update
    content: Add columns/fields to CSV and console tables
    status: pending
  - id: sanity-run
    content: Run minimal scenario to verify new metrics
    status: pending
---

# Reporting + Cutoff Dimension Plan

## Goals

- Add total trades (round trips) and points-per-trade (netProfitTotal ÷ acclose rows) to CSV and console output.
- Introduce cutoff time as an extra permutation dimension, sourced from config/env, passed through to backtest calls.

## Steps

1) Review current aggregation & output

- Inspect `scripts/analyzer/analyze-permutations.js` aggregation logic and CSV/console formatting to locate where to inject new metrics and extra dimension.

2) Extend configuration for cutoff times

- Add default cutoff list (e.g., single `09:45`) with env override (e.g., `BT_CUTOFF_TIMES` comma list).
- Validate/parse HH:MM values and surface in logging.

3) Expand permutation grid with cutoff time

- Incorporate cutoff times into the nested permutation generation and pass the selected cutoff time into backtest calls.

4) Compute trades and points-per-trade

- Augment per-day aggregation to capture round-trip count (close rows) and roll up totals per permutation.
- Derive `trades` (sum of round trips) and `pts_per_trade` (netProfitTotal ÷ trades, guarded for zero) for reporting.

5) Update outputs

- CSV: add columns for cutoff time, trades, points per trade.
- Console tables: include trades and points-per-trade columns for top/bottom summaries.
- Ensure logging remains silenced when requested.

6) Quick sanity run

- Execute a small run with a single cutoff/timeframe to confirm no crashes and that new columns appear.

7) Brief doc touch-up

- Update header JSDoc to mention cutoff dimension and new metrics.