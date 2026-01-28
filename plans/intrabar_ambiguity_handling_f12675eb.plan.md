---
name: Intrabar Ambiguity Handling
overview: "Refactor strategy12.8 to handle intrabar ambiguity when entry trigger and stop-loss levels are both reachable within the same 1-second OHLCV candle, using directional path logic (green candle: O→L→H→C, red candle: O→H→L→C)."
todos:
  - id: add-helpers
    content: Add helper functions getIntrabarPath() and findLevelCrossing() to strategy12dot8.ts
    status: pending
  - id: refactor-exit-logic
    content: Update exit scanning loop in strategy12dot8.ts to use directional path logic when both TP and SL hit
    status: pending
  - id: add-logging
    content: Add logging statements for ambiguity resolution using existing logExit() logger
    status: pending
  - id: create-tests
    content: Create tests/unit/intrabar-ambiguity.test.ts with 10 test scenarios
    status: pending
  - id: update-docs
    content: Update strategy12dot8.ts JSDoc to document directional policy approach
    status: pending
  - id: verify-regression
    content: Run existing tests to ensure no regression in strategy12.8 behavior
    status: pending
---

# Intrabar Ambiguity Handling for Strategy 12.8

## Overview

Refactor `strategy12dot8.ts` to handle the case where both entry trigger (E) and stop-loss (S) levels are reachable within the same 1-second candle. This prevents optimistic bias by using **directional path logic** to approximate the intrabar price sequence.

## Variable Name Mapping

Based on your codebase conventions in `strategy12dot8.ts`, here's the mapping from the ticket to your app:

**Ticket → Your App:**
- `E` (entry/trigger price) → `longTrigger` or `shortTrigger`
- `S` (stop-loss price) → `slPrice`
- `T` (take-profit price) → `tpPrice`
- `side` → `direction` ("long" | "short")
- `fillE` → `entryPrice`
- `fillS` / `fillT` → `exitPrice`
- `O, H, L, C, V` → `candle.open, candle.high, candle.low, candle.close, candle.volume`
- `t` → `candle.time`

## Implementation Approach

### Directional Policy (Only Implementation)

**Rule:** Approximate intrabar path from candle direction:
- **Green candle** (C > O): path is `O → L → H → C`
- **Red candle** (C < O): path is `O → H → L → C`
- **Neutral candle** (C == O): use red path as default `O → H → L → C`

**Logic:** Check which level (TP or SL) is hit first along the assumed path.

### Where to Apply

**Location:** Exit scanning loop in `strategy12dot8.ts` (lines 491-540)

**Current behavior (line 522-525):**
```typescript
if (tpHit && slHit) {
  exitNote = "SL Hit"; // Conservative: SL wins
  exitPrice = direction === "long" ? slPrice - 1 : slPrice + 1;
}
```

**New behavior:** Replace with directional path logic to determine which level is hit first.

### Implementation Details

Add helper functions at the top of `strategy12dot8.ts`:

```typescript
/**
 * Determine intrabar price path based on candle direction.
 * Green candles (close > open) typically go: Open → Low → High → Close
 * Red candles (close < open) typically go: Open → High → Low → Close
 * Neutral candles (close == open) use red path as default
 */
function getIntrabarPath(candle: Candle): number[] {
  if (candle.close > candle.open) {
    // Green candle: O → L → H → C
    return [candle.open, candle.low, candle.high, candle.close];
  } else {
    // Red or neutral candle: O → H → L → C
    return [candle.open, candle.high, candle.low, candle.close];
  }
}

/**
 * Check if a price level is crossed along the intrabar path.
 * Returns the index in the path where the level is first hit, or -1 if not hit.
 */
function findLevelCrossing(
  path: number[],
  level: number,
  direction: "long" | "short"
): number {
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Check if level is crossed between path[i] and path[i+1]
    if (direction === "long") {
      // For long: check if price drops to/below level (for SL) or rises to/above level (for TP)
      if (level <= Math.max(from, to) && level >= Math.min(from, to)) {
        return i;
      }
    } else {
      // For short: check if price rises to/above level (for SL) or drops to/below level (for TP)
      if (level <= Math.max(from, to) && level >= Math.min(from, to)) {
        return i;
      }
    }
  }
  return -1;
}
```

Update the exit logic (around line 522):

```typescript
if (tpHit && slHit) {
  // Both TP and SL are reachable - use directional path to determine which hits first
  const path = getIntrabarPath(candle);
  const tpIndex = findLevelCrossing(path, tpPrice, direction);
  const slIndex = findLevelCrossing(path, slPrice, direction);
  
  logExit(`Candle[${i}]: BOTH TP and SL hit! Using directional path to resolve.`);
  logExit(`  Path: ${path.join(" → ")}`);
  logExit(`  TP crossed at path index: ${tpIndex}, SL crossed at path index: ${slIndex}`);
  
  // Whichever is hit first along the path wins
  if (slIndex !== -1 && (tpIndex === -1 || slIndex < tpIndex)) {
    exitNote = "SL Hit";
    exitPrice = direction === "long" ? slPrice - 1 : slPrice + 1;
    logExit(`  Result: SL hit first along path`);
  } else {
    exitNote = "PT Hit";
    exitPrice = direction === "long" ? tpPrice - 1 : tpPrice + 1;
    logExit(`  Result: TP hit first along path`);
  }
}
```

## Test Cases

**File:** `tests/unit/intrabar-ambiguity.test.ts` (new file)

### Test Scenarios:

1. **No ambiguity - TP only**
   - Candle range contains TP but not SL
   - Expected: TP hit, trade exits with profit

2. **No ambiguity - SL only**
   - Candle range contains SL but not TP
   - Expected: SL hit, trade exits with loss

3. **Green candle - SL hit first (long trade)**
   - Green candle, long position
   - Path O→L→H→C, SL below O, TP above H
   - SL crossed at L (before H where TP would be)
   - Expected: SL Hit

4. **Green candle - TP hit first (long trade)**
   - Green candle, long position
   - Path O→L→H→C, SL far below L, TP near H
   - TP crossed at H (SL never reached)
   - Expected: PT Hit

5. **Red candle - SL hit first (short trade)**
   - Red candle, short position
   - Path O→H→L→C, SL above O, TP below L
   - SL crossed at H (before L where TP would be)
   - Expected: SL Hit

6. **Red candle - TP hit first (short trade)**
   - Red candle, short position
   - Path O→H→L→C, SL far above H, TP near L
   - TP crossed at L (SL never reached)
   - Expected: PT Hit

7. **Neutral candle - Both reachable**
   - Neutral candle (C == O)
   - Uses red path O→H→L→C
   - Expected: Resolved based on red path logic

8. **Green candle - Both very close**
   - Green candle with tight range
   - Both TP and SL within candle range
   - Expected: Directional path determines winner

9. **No exit - Neither hit**
   - Candle range doesn't reach TP or SL
   - Expected: No exit, trade continues

10. **Wide range candle - Both easily reachable**
    - Large candle spanning both levels
    - Expected: Path logic determines which hit first

## Files to Modify

1. **src/lib/backtest/strategies/strategy12dot8.ts**
   - Add helper functions: `getIntrabarPath()`, `findLevelCrossing()`
   - Update exit scanning loop (lines 518-540) to use directional path logic
   - Add logging for ambiguity resolution
   - Update JSDoc comments to document the directional policy

2. **tests/unit/intrabar-ambiguity.test.ts** (new file)
   - Create comprehensive test suite with 10 scenarios above
   - Use synthetic candle data to test edge cases
   - Verify directional path logic works correctly

## Acceptance Criteria

- [ ] Helper functions `getIntrabarPath()` and `findLevelCrossing()` implemented
- [ ] Exit logic updated to use directional path when both TP and SL are hit
- [ ] Neutral candles (C == O) handled explicitly with red path
- [ ] Logging added for ambiguity resolution (when `enableLogging` is true)
- [ ] All 10 test scenarios pass
- [ ] Existing strategy12.8 tests still pass (no regression)
- [ ] JSDoc updated to document directional policy

## Key Implementation Notes

### Path Logic

The directional path approximates typical intrabar price movement:
- **Green candles** tend to dip to the low first, then rally to the high
- **Red candles** tend to rally to the high first, then drop to the low
- This is a heuristic, not perfect, but deterministic and reasonable

### Level Crossing Detection

The `findLevelCrossing()` function checks if a level is crossed between consecutive points in the path. A level is "crossed" if it falls within the range [min(from, to), max(from, to)].

### No Configuration Needed

Since we're only implementing the directional policy (not conservative or bracket), there's no need for a configuration parameter. The logic is applied directly whenever both TP and SL are hit on the same candle.

### Backward Compatibility

The change only affects the specific case where both TP and SL are hit on the same candle. All other cases remain unchanged, so existing behavior is preserved.
