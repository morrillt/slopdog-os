---
name: Stepped Stop Loss UI
overview: Implement stepped stop loss for strategy 12.8.2 (UI only, no CLI). Show stepped SL intervals for 9:30-9:35 and post-9:35 periods, with e2e tests for store updates and unit tests comparing actual day results vs strategy 12.8.
todos:
  - id: create-strategy
    content: Create strategy12dot8dot2.ts based on strategy12dot8.ts with stepped SL logic
    status: pending
  - id: update-types
    content: Add stopLossByProfitThreshold to BacktestParams and StrategyRunFunction
    status: pending
  - id: register-strategy
    content: "Register strategy12.8.2 in strategies/index.ts with production: true"
    status: pending
  - id: state-management
    content: Add stepped SL config to backtest store and useBacktest hook
    status: pending
  - id: ui-config-input
    content: Add JSON input field for stepped SL config in backtest-ui.tsx
    status: pending
  - id: ui-visualization
    content: Render stepped SL lines for 9:30-9:35 and post-9:35 periods
    status: pending
  - id: analyze-days
    content: Analyze historical data to find days where strategy12.8.2 differs from strategy12.8
    status: pending
  - id: unit-tests
    content: Write unit tests comparing strategy12.8.2 vs strategy12.8 on actual days
    status: pending
  - id: e2e-tests
    content: Write e2e tests verifying store updates and UI rendering
    status: pending
---

# Stepped Stop Loss Implementation (UI Only)

## Overview

Implement strategy 12.8.2 extending strategy 12.8 with stepped stop loss functionality. UI-only implementation (no CLI support). Focus on:

1. Stepped SL intervals for 9:30-9:35 and post-9:35 periods
2. E2E tests showing store updates
3. Unit tests comparing actual day results vs strategy 12.8
4. Set `production: true` flag

## 1. Strategy Implementation

**File: `src/lib/backtest/strategies/strategy12dot8dot2.ts`** (new)

Based on `strategy12dot8.ts`, add stepped stop loss logic:

```typescript
export const strategy12dot8dot2: Strategy = {
  id: "strategy12.8.2",
  name: "strategy12.8.2",
  description: "Strategy 12.8 with stepped stop loss: SL moves up in discrete steps as unrealized profit increases",
  production: true, // ✅ Published flag
  run: runStrategy12dot8dot2,
};
```

**Key Implementation Details:**

- Track `currentSlPrice` starting at initial SL
- Track `highestProfitPts` (longs) or `lowestProfitPts` (shorts)
- During exit scan, check unrealized profit each candle:
  - Long: `unrealizedProfitPts = candle.high - entryPrice`
  - Short: `unrealizedProfitPts = entryPrice - candle.low`
- For each threshold in config (sorted ascending):
  - If `unrealizedProfitPts >= threshold`, update SL to lock in profit
  - Record SL change with timestamp for UI visualization
- Check exit: TP hit, current SL hit, or EOD
- **Respect 9:35 transition**: When start price shifts at 9:35, all SL calculations use new start price

## 2. Type Definitions

**File: `src/lib/backtest.ts`**

Extend `BacktestParams`:

```typescript
export type BacktestParams = {
  triggerPts: number;
  profitTargetPts: number;
  stopLossPts: number;
  maxRoundTrips?: number;
  stopLossByProfitThreshold?: Record<string, number>; // {"20": 2, "25": 10, ...}
};
```

**File: `src/lib/backtest/strategies/types.ts`**

Update `StrategyRunFunction` to accept optional `stopLossByProfitThreshold` parameter.

## 3. Strategy Registry

**File: `src/lib/backtest/strategies/index.ts`**

Import and register strategy12.8.2 in the strategies array.

## 4. State Management

**File: `src/stores/backtest.ts`**

Add to state:

```typescript
stopLossByProfitThreshold?: Record<string, number>;
```

**File: `src/hooks/useBacktest.ts`**

- Add `setStopLossByProfitThreshold()` action
- Update `generateAlgoTradesForDay()` to pass config to strategy
- Persist to LocalStorage

## 5. UI Implementation

**File: `src/app/backtest/backtest-ui.tsx`**

**Config Input:**

- JSON text input field for threshold config
- Format: `{"20": 2, "25": 10, "30": 10, ...}`
- Validation: ensure valid JSON with numeric keys/values
- Place near other backtest parameters
- Save to LocalStorage on change

**Stepped SL Visualization:**

- Similar to `935startchange` stepped lines pattern (lines 509, 1507)
- Create line segments for each SL level
- **Show two periods**:
  - Lines from 9:30-9:35 (based on original start price)
  - Lines from 9:35+ (based on 9:35 candle open price)
- Each segment spans from threshold crossing to next threshold/exit
- Color: `LINE_COLORS.sl` (#ff3b30)
- Respect `lineToggles.sl` toggle

## 6. E2E Tests

**File: `tests/e2e/stepped-sl.e2e.spec.ts`** (new)

Test store updates:

- Load backtest page
- Select strategy12.8.2
- Input stepped SL config JSON
- Verify config persists in store (check LocalStorage)
- Change parameters, verify store updates
- Reload page, verify config persists
- Verify stepped SL lines render on chart
- Verify lines respect toggle

## 7. Unit Tests - Compare vs Strategy 12.8

**First: Analyze which days have different outcomes**

Run both strategies on historical data to identify days where stepped SL changes trade results. Look for:

- Days where SL would have locked in profit before reversal
- Days where stepped SL exits earlier than fixed SL
- Days with multiple threshold crossings

**Then: Write unit tests**

**File: `scripts/algo-trades.test.js`** or new test file

- Test stepped SL calculation logic (threshold crossing, SL updates)
- Test strategy12.8.2 execution on specific actual days
- **Compare results**: Run both strategy12.8 and strategy12.8.2 on same days
- Assert differences in:
  - Exit prices (when stepped SL triggers earlier)
  - P&L (when profit is locked in)
  - Exit reasons (SL Hit vs PT Hit)
- Test both long and short trades
- Test 9:35 transition behavior (SL recalculates with new start price)

## Files to Create

- `src/lib/backtest/strategies/strategy12dot8dot2.ts`
- `tests/e2e/stepped-sl.e2e.spec.ts`

## Files to Modify

- `src/lib/backtest.ts` - Add `stopLossByProfitThreshold` to BacktestParams
- `src/lib/backtest/strategies/types.ts` - Update StrategyRunFunction signature
- `src/lib/backtest/strategies/index.ts` - Register strategy12.8.2
- `src/stores/backtest.ts` - Add config to state
- `src/hooks/useBacktest.ts` - Add setter, pass to strategy
- `src/app/backtest/backtest-ui.tsx` - Add JSON input, render stepped SL lines
- `scripts/algo-trades.test.js` - Add comparison tests

## Example Config

```json
{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}
```

**Meaning:**

- At 20pts unrealized profit → lock in 2pts (SL = Entry + 2 for longs)
- At 25pts unrealized profit → lock in 10pts (SL = Entry + 10)
- At 40pts unrealized profit → lock in 20pts (SL = Entry + 20)
- etc.

## Key Differences from Original Plan

✅ **UI only** - No CLI support

✅ **Production flag** - Set `production: true` on strategy12.8.2

✅ **9:35 periods** - Show stepped intervals for both 9:30-9:35 and post-9:35

✅ **Actual day analysis** - First identify days with different outcomes, then write tests

✅ **JSON input** - Simple text field for config