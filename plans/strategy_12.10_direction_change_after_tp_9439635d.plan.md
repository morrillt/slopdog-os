---
name: Strategy 12.10 Direction Change After TP
overview: Create strategy 12.10 based on 12.8refactored, extending alternating logic to require direction change after both SL and TP hits, resetting at 9:35 candle close.
todos:
  - id: create-strategy-file
    content: Create strategy12dot10.ts by copying strategy12dot8refactored.ts and updating headers/loggers
    status: pending
  - id: modify-alternating-logic
    content: Update scanForTrigger() to check for both 'SL Hit' and 'PT Hit' in alternating logic condition
    status: pending
  - id: update-logging
    content: Update log messages and JSDoc comments to reflect TP direction change requirement
    status: pending
  - id: register-strategy
    content: Add strategy12dot10 to the strategy registry in index.ts
    status: pending
  - id: update-strategy-object
    content: Set correct id, name, and description for strategy 12.10
    status: pending
---

# Strategy 12.10: Direction Change After TP

## Overview

Create a new strategy version 12.10 based on `strategy12dot8refactored.ts` that extends the alternating direction logic to apply after both Stop Loss (SL) and Take Profit (TP) hits.

## Current Behavior (12.8refactored)

- After SL hit: Next trade must be opposite direction
- After TP hit: No direction restriction (can trade same direction again)

## New Behavior (12.10)

- After SL hit: Next trade must be opposite direction (unchanged)
- After TP hit: Next trade must also be opposite direction (NEW)
- Reset: Direction change requirement resets at 9:35 candle close (same as existing reset logic)

## Implementation Plan

### 1. Create New Strategy File

- **File**: `src/lib/backtest/strategies/strategy12dot10.ts`
- Copy `strategy12dot8refactored.ts` as the base
- Update file header comments to reflect version 12.10
- Update logger module name to "strategy12.10"
- Update function names: `runStrategy12dot10`, `strategy12dot10`

### 2. Modify Alternating Logic

- **Location**: `scanForTrigger()` function
- **Current logic** (line ~953): Only checks for SL hit
  ```typescript
  let mustAlternate = state.lastExitNote === "SL Hit" && ...
  ```

- **New logic**: Check for both SL and TP hits
  ```typescript
  let mustAlternate = (state.lastExitNote === "SL Hit" || state.lastExitNote === "PT Hit") && ...
  ```


### 3. Update Logging Messages

- Update log messages to reflect that alternating logic applies to both SL and TP
- Update JSDoc comments explaining the alternating logic behavior
- Update log IDs to use "12dot10" prefix instead of "ref12dot8"

### 4. Register Strategy

- **File**: `src/lib/backtest/strategies/index.ts`
- Import the new strategy
- Add to strategies array
- Set `production: true` flag

### 5. Update Strategy Object

- Set `id: "strategy12.10"`
- Set `name: "strategy12.10"`
- Set description: "Direction change required after both SL and TP hits"

## Key Code Changes

### scanForTrigger() function

Change line ~953 from:

```typescript
let mustAlternate = state.lastExitNote === "SL Hit" && state.lastTradeDirection !== null && !state.lastExitWasSameCandleEligible;
```

To:

```typescript
let mustAlternate = (state.lastExitNote === "SL Hit" || state.lastExitNote === "PT Hit") && state.lastTradeDirection !== null && !state.lastExitWasSameCandleEligible;
```

### Logging updates

Update log message at line ~976 to mention both SL and TP:

```typescript
state.log(`  *** ALTERNATING LOGIC: Last trade was ${state.lastTradeDirection} with ${state.lastExitNote}, must trade ${requiredDirection} next ***`);
```

## Testing Considerations

- Verify alternating logic triggers after TP hits
- Verify alternating logic still works after SL hits
- Verify reset at 9:35 candle close clears the direction requirement
- Verify same-candle eligible logic still overrides alternating logic when appropriate

## Files to Modify

1. Create: `src/lib/backtest/strategies/strategy12dot10.ts` (copy from strategy12dot8refactored.ts)
2. Modify: `src/lib/backtest/strategies/index.ts` (register new strategy)