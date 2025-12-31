---
name: fix-orb-retest-entry-logic
overview: Fork the ORB Retest strategy to a new v2 version that implements "gap-aware" entry logic. This ensures that if the price has moved beyond the trigger during a wait period (like retest timeout), the entry price reflects the actual market price (open) rather than the historical trigger level. We will then validate this with a 90-day backtest using optimized parameters.
todos:
  - id: create-v2-strategy
    content: Create `src/lib/backtest/strategies/orb-retest-breakout-v2.ts` and implement the gap-aware entry logic.
    status: pending
  - id: register-v2-strategy
    content: Register `strategyOrbRetestV2` in `src/lib/backtest/strategies/index.ts`.
    status: pending
  - id: run-backtest
    content: "Run 90-day backtest with winning parameters (TP: 28.5, SL: 7.5, Trigger: 3, MaxRT: 6)."
    status: pending
---

# Fix ORB Retest Entry Logic (v2 Fork)

## Rationale

The current ORB strategy assumes entry at the exact trigger price. However, in scenarios with significant price movement during wait periods (e.g., retest window), the first actionable candle may open well beyond the trigger. To simulate realistic execution, we must enter at the available market price (Candle Open) if it is worse than the trigger.

We will fork the existing strategy to `orb-retest-breakout-v2.ts` to preserve the original for comparison.

## Implementation Steps

1.  **Create Strategy Fork**:

    - Create `src/lib/backtest/strategies/orb-retest-breakout-v2.ts`.
    - Copy content from `src/lib/backtest/strategies/orb-retest-breakout.ts`.
    - Rename exported constant to `strategyOrbRetestV2`.
    - Update Strategy ID to `orb-retest-breakout-v2` and Name to `ORB Retest Breakout v2`.

2.  **Update Entry Logic (v2 only)**:

    - Modify `findEntrySignal` function in the new file.
    - **Long Entry**:
        ```typescript
        // Old: triggerPrice + slippage
        // New: Math.max(triggerPrice, candle.open) + slippage
        ```

    - **Short Entry**:
        ```typescript
        // Old: triggerPrice - slippage
        // New: Math.min(triggerPrice, candle.open) - slippage
        ```

    - Add logging to indicate when a "Gap Entry" adjustment occurs.

3.  **Register New Strategy**:

    - Update `src/lib/backtest/strategies/index.ts`.
    - Import `strategyOrbRetestV2`.
    - Add to `strategies` array.

4.  **Run Validation Test**:

    - Execute a 90-day backtest using the "winning numbers" from `permutationresults-11.csv`.
    - **Parameters**:
        - Strategy: `orb-retest-breakout-v2`
        - Profit Target: 28.5
        - Stop Loss: 7.5
        - Trigger Pts: 3
        - Max Round Trips: 6
        - Cutoff Time: 09:45
    - **Command**:
        ```bash
        npm run backtest -- --strategy orb-retest-breakout-v2 --days 90 --tp 28.5 --sl 7.5 --trigger 3 --max-rt 6 --cutoff 09:45
        ```


## Verification

- Confirm the new strategy appears in the registry.
- Verify the backtest runs and produces results.
- Check logs for "Gap Entry" messages to confirm the new logic is active.