---
name: stepped-stop-loss-implementation
overview: Implement a stepped "dragging stop loss" feature that moves SL up in discrete steps as unrealized profit increases, working in both backtest execution and UI visualization with stepped lines.
todos: []
---

# Stepped Stop Loss Implementation Plan

## Overview

Implement a stepped stop loss system that moves the stop loss up (longs) or down (shorts) in discrete steps as unrealized profit increases, locking in profit at each threshold. This will work in both backtest execution and UI visualization. Strategy 12.8.2 extends strategy12.8 with stepped stop loss functionality.

## Architecture

### 1. Type Definitions & Config

**File: `src/lib/backtest.ts`**

- Extend `BacktestParams` type to include optional `stopLossByProfitThreshold`:
  ```typescript
  export type BacktestParams = {
    triggerPts: number;
    profitTargetPts: number;
    stopLossPts: number;
    maxRoundTrips?: number;
    stopLossByProfitThreshold?: Record<string, number>; // e.g., {"20": 2, "25": 10, ...}
  };
  ```


**File: `src/lib/backtest/strategies/types.ts`**

- Extend `StrategyRunFunction` signature to accept optional `stopLossByProfitThreshold` parameter
- Update `Strategy` type documentation

### 2. Strategy Implementation

**File: `src/lib/backtest/strategies/strategy12dot8dot2.ts`** (new file)

- Create new strategy `strategy12.8.2` based on `strategy12dot8.ts`
- Track position state during trade:
  - `entryPrice`: Filled entry price
  - `direction`: "long" | "short"
  - `currentSlPrice`: Current stop loss level (starts at initial SL)
  - `highestProfitPts`: Best unrealized profit achieved (for longs: highest high - entryPrice)
  - `lowestProfitPts`: Best unrealized profit achieved (for shorts: entryPrice - lowest low)
  - `slHistory`: Array of {timestamp, slPrice} for UI visualization

- During exit scan (after entry):
  - Calculate unrealized profit each candle:
    - Long: `unrealizedProfitPts = candle.high - entryPrice`
    - Short: `unrealizedProfitPts = entryPrice - candle.low`
  - Track best unrealized profit (`highestProfitPts` for longs, `lowestProfitPts` for shorts)
  - For each profit threshold in config (sorted ascending):
    - If unrealized profit >= threshold AND current locked profit < threshold's locked profit:
      - Update `currentSlPrice`:
        - Long: `entryPrice + lockedProfitPts`
        - Short: `entryPrice - lockedProfitPts`
      - Record SL change in `slHistory`
  - Check exit conditions:
    - TP hit: `candle.high >= tpPrice` (long) or `candle.low <= tpPrice` (short)
    - SL hit: `candle.low <= currentSlPrice` (long) or `candle.high >= currentSlPrice` (short)
    - EOD: Close at entry price if still open

- Return `AlgoTradeRow[]` with additional metadata for UI (store SL history in a way UI can access)

### 3. Strategy Registry

**File: `src/lib/backtest/strategies/index.ts`**

- Register new `strategy12.8.2` strategy with description: "Strategy 12.8 with stepped stop loss: stop loss moves up in discrete steps as unrealized profit increases, locking in profit at configured thresholds."
- Export it for UI dropdown

### 4. Entry Point Updates

**File: `src/lib/backtest.ts`**

- Update `generateAlgoTrades()` to accept and pass `stopLossByProfitThreshold` to strategies
- Update `runBacktestForDay()` to pass through the config
- Update documentation

### 5. State Management

**File: `src/stores/backtest.ts`**

- Add `stopLossByProfitThreshold?: Record<string, number>` to `BacktestState` type
- Initialize default value (or null if not set)
- Add persistence to LocalStorage (similar to other backtest params)

**File: `src/hooks/useBacktest.ts`**

- Add action `setStopLossByProfitThreshold(config: Record<string, number> | undefined)`
- Add action `loadStopLossByProfitThreshold()` to load from LocalStorage
- Update `generateAlgoTradesForDay()` to pass config to strategy
- Calculate stepped SL prices for UI visualization:
  - Extract SL history from strategy execution (may need to extend AlgoTradeRow or return additional data)
  - Or calculate SL levels from entry price, direction, and config during UI render

### 6. UI Configuration & Visualization

**File: `src/app/backtest/backtest-ui.tsx`**

- Add UI input for `stopLossByProfitThreshold` config:
  - Text input or JSON editor for threshold mapping
  - Format: JSON object like `{"20": 2, "25": 10, "30": 10, ...}`
  - Validation: Ensure keys are numbers, values are numbers
  - Place near other backtest parameters (PT, SL, Trigger)
  - Save to LocalStorage on change
- Detect when `stopLossByProfitThreshold` is configured and strategy supports it
- Calculate SL step changes from:
  - Entry price (from `algoOpenRow`)
  - Direction (from `algoOpenRow.type`)
  - Config (`state.stopLossByProfitThreshold`)
  - Candles (to determine when each threshold was crossed)
- Render stepped SL lines similar to `935startchange` strategy:
  - Use `steppedLinesRef` pattern
  - Create line segments for each SL level change
  - Each segment spans from threshold crossing timestamp to next threshold (or exit/EOD)
  - Color: Use `LINE_COLORS.sl` (#ff3b30)
  - Label: "SL [threshold]pts" or "SL Step N"
- Ensure compatibility with existing `lineToggles.sl` toggle

### 7. Helper Functions

**File: `src/lib/backtest/helpers/calculateSteppedSL.ts`** (new file, optional)

- Extract stepped SL calculation logic for reuse
- Function: `calculateSteppedSL(entryPrice, direction, unrealizedProfitPts, config) => currentSlPrice`
- Function: `getSLHistory(entryPrice, direction, candles, config) => Array<{timestamp, slPrice}>`

## Implementation Details

### Stepped SL Calculation Logic

```typescript
function calculateCurrentSL(
  entryPrice: number,
  direction: "long" | "short",
  unrealizedProfitPts: number,
  config: Record<string, number>
): number {
  // Sort thresholds ascending
  const thresholds = Object.keys(config).map(Number).sort((a, b) => a - b);
  
  // Find highest threshold that unrealized profit has reached
  let maxLockedProfit = 0;
  for (const threshold of thresholds) {
    if (unrealizedProfitPts >= threshold) {
      const lockedProfit = config[threshold.toString()];
      maxLockedProfit = Math.max(maxLockedProfit, lockedProfit);
    }
  }
  
  // Calculate SL price
  if (direction === "long") {
    return entryPrice + maxLockedProfit;
  } else {
    return entryPrice - maxLockedProfit;
  }
}
```

### SL History Tracking

During strategy execution, track when SL changes:

- When unrealized profit crosses a threshold AND locked profit increases
- Record: `{timestamp: candle.time, slPrice: newSlPrice, threshold: thresholdPts}`

### UI Rendering Pattern

Similar to `935startchange` stepped lines:

- For each SL level change, create a line segment
- Segment starts at threshold crossing timestamp
- Segment ends at next threshold crossing or exit/EOD
- Use `chartRef.current.addLineSeries()` for each segment

## Testing Considerations

1. **Unit Tests**: Test stepped SL calculation logic with various configs
2. **Strategy Tests**: Verify strategy correctly updates SL and exits at correct levels
3. **UI Tests**: Verify stepped lines render correctly and respect toggle
4. **Edge Cases**:

   - Config with overlapping thresholds
   - Unrealized profit never reaches any threshold
   - Multiple threshold crossings in same candle
   - SL moves but then price reverses

### 7. CLI Support

**File: `scripts/*.js`** (CLI scripts that use backtest)

- Update CLI scripts to accept `--stop-loss-thresholds` parameter
- Parse JSON config from CLI argument
- Pass config to `generateAlgoTrades()` or `runBacktestForDay()`
- Example: `node script.js --stop-loss-thresholds '{"20":2,"25":10}'`

### 8. Testing

**File: `scripts/algo-trades.test.js`** or new test file

- Unit tests for stepped SL calculation logic:
  - Test threshold crossing detection
  - Test SL price updates at each threshold
  - Test config with overlapping thresholds
  - Test config with gaps in thresholds
  - Test long vs short direction
- Strategy execution tests:
  - Test strategy12.8.2 with stepped SL config
  - Verify SL moves correctly as profit increases
  - Verify exit at correct SL level
  - Verify TP still works correctly
  - Verify EOD push still works
  - Test multiple round trips with stepped SL
- Edge case tests:
  - Unrealized profit never reaches any threshold
  - Multiple threshold crossings in same candle
  - SL moves but then price reverses
  - Config with invalid values (negative, non-numeric)

**File: `tests/e2e/stepped-sl.e2e.spec.ts`** (new file)

- E2E tests for UI:
  - Test config input field accepts valid JSON
  - Test config input field rejects invalid JSON
  - Test stepped SL lines render on chart
  - Test stepped SL lines respect toggle
  - Test config persists across page reloads
  - Test strategy selection with stepped SL config

## Files to Create/Modify

### New Files

- `src/lib/backtest/strategies/strategy12dot8dot2.ts`
- `src/lib/backtest/helpers/calculateSteppedSL.ts` (optional, for code reuse)
- `tests/e2e/stepped-sl.e2e.spec.ts`

### Modified Files

- `src/lib/backtest.ts` - Add config to BacktestParams, update generateAlgoTrades
- `src/lib/backtest/strategies/types.ts` - Update StrategyRunFunction signature
- `src/lib/backtest/strategies/index.ts` - Register strategy12.8.2
- `src/stores/backtest.ts` - Add config to state, add persistence
- `src/hooks/useBacktest.ts` - Add config setter/loader, pass to strategy
- `src/app/backtest/backtest-ui.tsx` - Add config input, render stepped SL lines
- `scripts/algo-trades.test.js` - Add stepped SL tests (or create new test file)

## Example Config

**UI Input Format:**

```json
{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}
```

**CLI Format:**

```bash
--stop-loss-thresholds '{"20":2,"25":10,"30":10,"40":20,"60":30,"80":50}'
```

**Meaning:**

- At 20pts unrealized profit → lock in 2pts (SL = Entry + 2 for longs, Entry - 2 for shorts)
- At 25pts unrealized profit → lock in 10pts (SL = Entry + 10)
- At 30pts unrealized profit → lock in 10pts (SL stays at Entry + 10, no change)
- At 40pts unrealized profit → lock in 20pts (SL = Entry + 20)
- etc.

## Strategy Description

**Strategy ID:** `strategy12.8.2`

**Name:** "Strategy 12.8.2"

**Description:** "Strategy 12.8 with stepped stop loss: stop loss moves up in discrete steps as unrealized profit increases, locking in profit at configured thresholds."