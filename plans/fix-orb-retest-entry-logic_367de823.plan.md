---
name: fix-orb-retest-entry-logic
overview: Update the entry price logic in the ORB Retest strategy to handle gap-ups/gap-downs correctly, ensuring trades aren't executed at historical trigger prices when the current price has already moved beyond them.
todos:
  - id: update-entry-logic
    content: Update `findEntrySignal` in `orb-retest-breakout.ts` to use `Math.max(trigger, open)` for longs and `Math.min(trigger, open)` for shorts.
    status: pending
---

# Fix ORB Retest Entry Logic

## Rationale

The current implementation of `findEntrySignal` calculates entry price based solely on the fixed trigger level (`startPrice ± triggerPts` or `orbAnchored`). This assumes that if a candle's high/low crosses the trigger, we can always enter at the trigger price.

However, if the strategy is "waiting" (e.g., due to `retestTimeoutSeconds` or `avoidFirstSeconds`), the first candle we scan might already have opened *beyond* the trigger level. In this case, we cannot "time machine" back to the trigger price; we must enter at the current market price (the candle's Open).

## Proposed Changes

### `src/lib/backtest/strategies/orb-retest-breakout.ts`

Update `findEntrySignal` function:

1.  **Modify Entry Price Calculation**:

    - Instead of always using `triggerPrice + slippage`, check if the candle's **Open** is already beyond the trigger.
    - **Long**: `entryPrice = max(longTrigger, candle.open) + slippage`
    - **Short**: `entryPrice = min(shortTrigger, candle.open) - slippage`
    - This handles two cases:
        - **Intrabar Cross**: Candle opens below trigger and crosses up. Entry is at `trigger + slippage`.
        - **Gap/Late Entry**: Candle opens above trigger (e.g. after a wait period). Entry is at `candle.open + slippage`.

2.  **Add Logging**:

    - Log when a gap/late entry adjustment occurs for transparency.

## Verification

- Review the logic to ensure it covers both long and short scenarios.
- Verify that `slippage` is still applied correctly (added to long, subtracted from short) relative to the determined base price.