---
name: strategy-12-08-implementation
overview: Create strategy 12.8 as a refinement of 12.7 that fixes the same-candle reentry edge case. The new strategy will allow reentry on the same candle when entry and exit occur together and price conditions allow it.
todos:
  - id: create-strategy-file
    content: Create strategy12dot8.ts by copying strategy12dot7.ts and updating names
    status: pending
  - id: add-changelog
    content: Add changelog JSDoc section at top of strategy12dot8.ts
    status: pending
  - id: fix-reentry-logic
    content: Implement same-candle reentry fix in re-eligibility scan section
    status: pending
  - id: register-strategy
    content: Register strategy12dot8 in strategies/index.ts registry
    status: pending
---

# Plan: Strategy 12.8 - Same-Candle Reentry Fix

## Overview

Create a new strategy file `strategy12dot8.ts` based on `strategy12dot7.ts` with a fix for the same-candle reentry edge case documented in ticket 12.08. The strategy will include a changelog in JSDoc format at the top.

## Key Changes

### 1. Create New Strategy File

- **File**: `src/lib/backtest/strategies/strategy12dot8.ts`
- @planCopy entire implementation from `strategy12dot7.ts`
- Update function name from `runStrategy12dot7` to `runStrategy12dot8`
- Update strategy object ID to `"strategy12.8"`

### 2. Add Changelog in JSDoc Header

Add a changelog section at the top of the file (after the main description, before imports):

```typescript
/**
 * ## Changelog
 * 
 * ### Version 12.8 (Current)
 * - **Fix**: Allow reentry on same candle when entry and exit occur together
 *   - Modified re-eligibility scan to check exit candle itself when `exitCandleIndex === triggerCandleIndex`
 *   - When same-candle exit detected and price is between triggers, allows immediate reentry
 *   - Fixes issue where reentry was missed when SP (stop loss) and TRG (trigger) hit on same candle
 *   - See ticket 12.08 QA analysis: `/docs/ticketqa/strategy12.08.md`
 * 
 * ### Version 12.7 (Previous)
 * - Initial implementation with variable start price at 9:35 AM ET
 * - Multi-round-trip support with re-eligibility requirements
 * - Alternating logic after SL hits
 */
```

### 3. Fix Same-Candle Reentry Logic

**Location**: Re-eligibility scan section (around line 549-550 in strategy12dot7.ts)

**Current behavior**: Re-eligibility scan starts from `exitCandleIndex + 1`, skipping the exit candle.

**Fix**: When `exitCandleIndex === triggerCandleIndex` (same-candle exit), check the exit candle itself for re-eligibility before scanning forward:

```typescript
// Check if exit happened on same candle as entry
if (exitCandleIndex === triggerCandleIndex) {
  // Check exit candle itself for re-eligibility
  const exitCandle = candles[exitCandleIndex];
  const lowInZone = exitCandle.low > shortTrigger && exitCandle.low < longTrigger;
  const highInZone = exitCandle.high > shortTrigger && exitCandle.high < longTrigger;
  const openInZone = exitCandle.open > shortTrigger && exitCandle.open < longTrigger;
  const closeInZone = exitCandle.close > shortTrigger && exitCandle.close < longTrigger;
  
  if (lowInZone || highInZone || openInZone || closeInZone) {
    // Price is eligible on exit candle - can reenter immediately
    reEligibleIndex = exitCandleIndex;
    log(`  Re-eligibility found on same candle[${exitCandleIndex}] - price between triggers`);
    // Set scanStartIndex to exit candle (will check for trigger on next iteration)
    scanStartIndex = exitCandleIndex;
    continue; // Restart loop to check for trigger on this candle
  }
}

// Otherwise, proceed with normal re-eligibility scan from exitCandleIndex + 1
let reEligibleIndex = -1;
for (let i = exitCandleIndex + 1; i < candles.length; i++) {
  // ... existing re-eligibility scan logic
}
```

**Alternative approach** (simpler): Start re-eligibility scan from `exitCandleIndex` instead of `exitCandleIndex + 1` when it's a same-candle exit, but ensure we don't re-check the exit conditions.

### 4. Register Strategy in Registry

- **File**: `src/lib/backtest/strategies/index.ts`
- Import: `import { strategy12dot8 } from "./strategy12dot8";`
- Add to strategies array: `strategy12dot8,`

## Implementation Details

### Files to Create/Modify

1. **Create**: `src/lib/backtest/strategies/strategy12dot8.ts`

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Copy from `strategy12dot7.ts`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add changelog JSDoc
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Update function/strategy names
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Implement same-candle reentry fix

2. **Modify**: `src/lib/backtest/strategies/index.ts`

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add import for `strategy12dot8`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add to strategies array

### Testing Considerations

- The existing test `UT-12.08` in `tests/unit/strategies.test.ts` should pass with strategy12.8
- Strategy 12.7 should remain unchanged (preserves existing behavior)
- Both strategies should be available in the UI dropdown

## Notes

- Strategy 12.7 remains unchanged to preserve existing behavior
- Strategy 12.8 is a refinement that fixes the documented edge case
- Debug logging from 12.7 is preserved in 12.8
- The fix specifically addresses Theory 1 from the QA analysis (re-eligibility scan skips exit candle)