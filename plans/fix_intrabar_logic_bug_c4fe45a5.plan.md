---
name: Fix Intrabar Logic Bug
overview: Create a failing e2e test that demonstrates the intrabar path order bug, then fix the strategy to use proper intrabar resolution logic for same-candle exits.
todos:
  - id: create-failing-test
    content: Create failing e2e test in tests/e2e/intrabar-path-order-bug.e2e.spec.ts that demonstrates the bug
    status: pending
  - id: move-intrabar-call
    content: Move intrabar resolution call outside debug block to execute for all same-candle scenarios
    status: pending
  - id: add-intrabar-logic
    content: Add conditional logic to use intrabar result for same-candle exits (i === triggerCandleIndex)
    status: pending
  - id: preserve-different-candle
    content: Keep existing range-based logic for different-candle exits (i !== triggerCandleIndex)
    status: pending
  - id: update-debug-logs
    content: Update verbose debug logging to show strategy is using intrabar result
    status: pending
  - id: verify-test-passes
    content: Run e2e test to verify it now passes after the fix
    status: pending
---

# Fix Intrabar Exit Logic Bug in Strategy 12.8

## Problem Summary

The strategy currently detects same-candle exits using simple range checks (`candle.low <= slPrice`), which doesn't account for the order in which price levels are crossed within a candle. The intrabar directional helper correctly determines that in the first RT trade:

**Candle[0] at 09:30:00:**

- Open: 25495.25, High: 25503.75, Low: 25493.75, Close: 25497.5
- Path: O→L→H→C (green candle)
- Entry trigger: 25501.25 (crossed at segment 1: L→H)
- Stop loss: 25494.25 (crossed at segment 0: O→L, BEFORE entry)

Since stop-loss orders are only placed AFTER entry is filled, the stop being hit before entry along the path should not trigger an exit. The intrabar helper correctly returns `FILL_AND_SURVIVE`, but the strategy ignores this and exits anyway.

## Root Cause

In `src/lib/backtest/strategies/strategy12dot8.ts`, lines 557-663:

The exit detection loop (STEP D) uses simple boolean checks that ignore path order, causing incorrect same-candle exits when stop/target levels are crossed before entry along the assumed price path.

## Solution Steps

### Step 1: Create Failing E2E Test

**File: `tests/e2e/intrabar-path-order-bug.e2e.spec.ts`** (NEW)

Create a test that:

1. Loads 2025-12-03 with strategy12.8, pt=27, sl=7, trg=6
2. Verifies the first RT trade at 09:30:00 does NOT exit on same candle
3. Checks that intrabar resolution returns `FILL_AND_SURVIVE`
4. Validates the trade continues to next candle (currently FAILS)

The test will capture console logs showing the intrabar helper says "FILL_AND_SURVIVE" but the strategy exits anyway.

### Step 2: Fix Strategy Exit Logic

**File: `src/lib/backtest/strategies/strategy12dot8.ts`**

1. **Move intrabar resolution call outside debug block** (line ~591)

   - Execute for ALL same-candle scenarios, not just first RT trade

2. **Add conditional logic for same-candle exits:**
   ```typescript
   // For same-candle scenarios, use intrabar resolution
   if (i === triggerCandleIndex) {
     const intrabarResult = resolveIntrabarDirectional({...});
     
     if (intrabarResult.event === 'FILL_STOP_SAME_BAR') {
       // Exit with stop loss
       exitCandleIndex = i;
       exitPrice = intrabarResult.exitFill!;
       exitNote = "SL Hit";
       break;
     } else if (intrabarResult.event === 'FILL_TARGET_SAME_BAR') {
       // Exit with profit target
       exitCandleIndex = i;
       exitPrice = intrabarResult.exitFill!;
       exitNote = "PT Hit";
       break;
     }
     // FILL_AND_SURVIVE: continue to next candle
     continue;
   }
   
   // For different-candle scenarios, use existing range checks
   if (tpHit || slHit) { ... }
   ```

3. **Update debug logging** to show strategy is using intrabar result

### Step 3: Verify Test Passes

Run the e2e test to confirm:

- First RT trade no longer exits on same candle
- Trade behavior matches intrabar resolution
- Test passes with correct trade sequence

## Expected Behavior After Fix

For the first RT trade on 2025-12-03:

- Entry at 09:30:00 candle[0]: Long @ 25502.25
- Intrabar resolution: `FILL_AND_SURVIVE` (stop hit before entry along path)
- Trade continues to next candle instead of exiting immediately
- Exit occurs on subsequent candle when stop is actually hit after entry

## Files to Create/Modify

1. **CREATE**: `tests/e2e/intrabar-path-order-bug.e2e.spec.ts` - Failing test demonstrating the bug
2. **MODIFY**: `src/lib/backtest/strategies/strategy12dot8.ts` - Fix exit logic to use intrabar resolution