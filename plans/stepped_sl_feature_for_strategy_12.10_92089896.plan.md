---
name: Stepped SL Feature for Strategy 12.10
overview: Fork strategy 12.10 to add stepped stop loss functionality that locks in profits at different price thresholds. When an adjusted SL is hit, display enhanced metadata in notes and console logs.
todos:
  - id: create-strategy-file
    content: Create strategy12dot10dot1.ts by forking strategy12dot10.ts and adding stepped SL parameter
    status: completed
  - id: add-stepped-sl-logic
    content: Add stepped SL logic to scanForExit function (track currentSlPrice, check profit thresholds, update SL)
    status: completed
  - id: enhance-note-metadata
    content: When adjusted SL is hit, set note to 'hit adjusted sl of X based on profit of Y' format
    status: completed
  - id: add-console-logging
    content: Add console log with 'hit adjusted sl' tag when adjusted SL is hit
    status: completed
  - id: update-exit-result
    content: Add profitLocked and maxProfitReached fields to ExitResult interface
    status: completed
  - id: update-build-trade-rows
    content: Update buildTradeRows to use enhanced note format when profitLocked is present
    status: completed
  - id: register-strategy
    content: Register new strategy in strategies/index.ts
    status: completed
  - id: create-playwright-test
    content: Create Playwright test that verifies 'hit adjusted sl' console logs for 2025-12-03 URL
    status: completed
---

# Stepped SL Feature for Strategy 12.10

## Overview

Create a new strategy `strategy12.10.1` (or `strategy12.10-stepped-sl`) by forking strategy 12.10 and adding stepped stop loss functionality. The stepped SL will move up (for longs) or down (for shorts) to lock in profits as price moves favorably, and when an adjusted SL is hit, we'll show enhanced metadata.

## Implementation Steps

### 1. Create New Strategy File

- **File**: `src/lib/backtest/strategies/strategy12dot10dot1.ts`
- Fork `strategy12dot10.ts` as the base
- Add `stopLossByProfitThreshold` parameter to function signature (similar to strategy12.8.2)
- Add stepped SL logger: `logSteppedSL = logger.helper("steppedSL")`

### 2. Add Stepped SL Logic to `scanForExit`

- Track `currentSlPrice` (starts as `initialSlPrice`)
- Track `highestProfitPts` (for longs) or `lowestProfitPts` (for shorts)
- Parse and sort thresholds from `stopLossByProfitThreshold` config
- In the exit scan loop, check unrealized profit each candle
- When profit threshold is crossed, update `currentSlPrice` to lock in profit
- Track SL changes in `slChanges` array for UI visualization

### 3. Enhanced Note Metadata for Adjusted SL Hits

- When SL is hit, check if `currentSlPrice !== initialSlPrice` (SL was adjusted)
- If adjusted, calculate:
  - `profitLocked`: The profit that was locked in (e.g., `currentSlPrice - entryPrice` for longs)
  - `maxProfitReached`: The maximum unrealized profit reached before SL was hit
- Set note to: `"hit adjusted sl of ${currentSlPrice.toFixed(2)} based on profit of ${profitLocked.toFixed(2)}"`
- If not adjusted, keep note as `"SL Hit"`

### 4. Enhanced Console Logging

- When adjusted SL is hit, add console log with tag `"hit adjusted sl"`
- Log should include: adjusted SL price, profit locked, max profit reached, entry price
- Use structured logging: `state.logSteppedSL.info("hit adjusted sl", {...}, undefined, "12dot10dot1-adj-sl-hit", ["hit adjusted sl"])`

### 5. Update ExitResult Interface

- Add optional `profitLocked` and `maxProfitReached` fields to `ExitResult` interface
- Pass these values through to `buildTradeRows` so they can be included in the note

### 6. Update buildTradeRows

- Check if exit result has `profitLocked` (indicating adjusted SL)
- If yes, use the enhanced note format
- Otherwise, use standard "SL Hit" note

### 7. Register New Strategy

- **File**: `src/lib/backtest/strategies/index.ts`
- Import the new strategy
- Add to `strategies` array
- Set `production: true` if ready, or `false` for testing

### 8. Update Type Definitions

- **File**: `src/lib/backtest.ts` (AlgoTradeRow type)
- Update `note` type to allow string values (not just union of specific strings)
- Or add a new optional field for enhanced note metadata

### 8b. Add URL Parameter Support for Stepped SL

- **File**: `src/app/backtest/backtest-ui.tsx`
- Parse `steppedSL` query parameter (JSON string format)
- Example: `?steppedSL={"20":2,"25":10,"30":10,"40":20,"60":30,"80":50}`
- Parse JSON and call `setStopLossByProfitThreshold()` if valid
- Handle URL encoding/decoding for JSON in query string

### 8c. Add UI Control for Strategy 12.10.1

- **File**: `src/app/backtest/backtest-ui.tsx`
- Add stepped SL input control (similar to strategy12.8.2, lines 1666-1698)
- Show when `selectedStrategyId === "strategy12.10.1"`
- Basic functional input field (no fancy UI, just works)
- Placeholder/default: `{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}`

### 8d. Set Default Stepped SL Config

- **File**: `src/stores/backtest.ts` or initialization code
- Set default `stopLossByProfitThreshold` to: `{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}`
- Only set default if no value exists in localStorage or URL params

### 9. Create/Update Playwright Test

- **File**: `tests/e2e/stepped-sl-12dot10.e2e.spec.ts` (new file)
- Test URL: `http://localhost:3000/backtest/2025-12-03?strategy=strategy12.10.1&pt=36&sl=7&trg=10&candleType=1s&cutoffTime=09%3A45&maxRT=6`
- Set stepped SL config: `{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}`
- Verify at least one console log with tag "hit adjusted sl"
- Verify algorithmic trade table shows enhanced note format for adjusted SL hits

### 10. Update Existing E2E Test (REQUIRED)

- **File**: `tests/e2e/stepped-sl.e2e.spec.ts`
- Verify it still works with strategy12.8.2
- May need updates if test structure changes

### 11. Run E2E Tests

- Run the new Playwright test: `npm test -- stepped-sl-12dot10.e2e.spec.ts`
- Verify all tests pass, especially the "hit adjusted sl" console log verification

## Key Files to Modify

1. `src/lib/backtest/strategies/strategy12dot10.ts` - Base to fork from
2. `src/lib/backtest/strategies/strategy12dot10dot1.ts` - New strategy file (create)
3. `src/lib/backtest/strategies/index.ts` - Register new strategy
4. `src/lib/backtest.ts` - Update AlgoTradeRow type if needed
5. `tests/e2e/stepped-sl-12dot10.e2e.spec.ts` - New Playwright test (create)

## Reference Implementation

- Strategy 12.8.2 (`strategy12dot8dot2.ts`) already has stepped SL logic - use as reference for the stepped SL implementation pattern
- Key differences: 12.10 has different alternating logic (requires direction change after both SL and TP, not just SL)

## Stepped SL Configuration

Default stepped SL ladder:

- Unrealized P&L tiers (points): `+20, +25, +30, +40, +60, +80`
- SL minimum profit (locked-in P&L floor, points): `+2, +10, +10, +20, +30, +50`

This maps to:

- At 20pts profit → lock in 2pts
- At 25pts profit → lock in 10pts
- At 30pts profit → lock in 10pts
- At 40pts profit → lock in 20pts
- At 60pts profit → lock in 30pts
- At 80pts profit → lock in 50pts

Config object format:

```json
{
  "20": 2,
  "25": 10,
  "30": 10,
  "40": 20,
  "60": 30,
  "80": 50
}
```

## Testing Strategy

- Use 2025-12-03 with parameters: trg=10, pt=36, sl=7, maxRT=6
- Use the stepped SL config above (should trigger on trades that reach 20+ points profit)
- Verify console logs show "hit adjusted sl" tag
- Verify notes show enhanced format: "hit adjusted sl of X based on profit of Y"