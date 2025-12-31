---
name: fix-orb-retest-entry-logic
overview: Fork the ORB Retest strategy to a new v2 version that implements "gap-aware" entry logic, ensuring entries reflect market price when scanning resumes after a wait. We will validate this with a 90-day backtest using the winning parameters from permutation 22.
todos:
  - id: create-v2-strategy
    content: Create `src/lib/backtest/strategies/orb-retest-breakout-v2.ts` with gap-aware entry logic.
    status: pending
  - id: register-v2-strategy
    content: Register `strategyOrbRetestV2` in `src/lib/backtest/strategies/index.ts`.
    status: pending
  - id: run-backtest
    content: Run 90-day backtest with Permutation 22 parameters.
    status: pending
---

# Fix ORB Retest Entry Logic (v2 Fork)

## Rationale

The current ORB strategy enters at the historical trigger price even if the market price is much worse after a wait period (e.g., retest timeout). We will fork the strategy to `orb-retest-breakout-v2.ts` and implement gap-aware entry logic: entering at `Math.max(trigger, open)` for longs (and min for shorts) to simulate realistic execution.

## Implementation Steps

1.  **Create Strategy Fork**:

    - Create `src/lib/backtest/strategies/orb-retest-breakout-v2.ts`.
    - Copy content from `src/lib/backtest/strategies/orb-retest-breakout.ts`.
    - Rename exported constant to `strategyOrbRetestV2`.
    - Update Strategy ID to `orb-retest-breakout-v2` and Name to `ORB Retest Breakout v2`.

2.  **Update Entry Logic (v2 only)**:

    - Modify `findEntrySignal` in the new file.
    - **Long**: `entryPrice = Math.max(triggerPrice, candle.open) + slippage`
    - **Short**: `entryPrice = Math.min(triggerPrice, candle.open) - slippage`
    - Log "Gap Entry" events for transparency.

3.  **Register New Strategy**:

    - Update `src/lib/backtest/strategies/index.ts` to include `strategyOrbRetestV2`.

4.  **Run Validation Test (Permutation 22)**:

    - Execute a 90-day backtest using parameters from `permutationresults-22.csv`.
    - **Command**:
      ```bash
      npm run backtest -- --strategy orb-retest-breakout-v2 \
        --days 90 \
        --tp 100 \
        --sl 8 \
        --trigger 5 \
        --max-rt 3 \
        --cutoff 09:45 \
        --orb-window 45 \
        --breakout-buffer 0.5 \
        --confirmation-mode two_closes \
        --retest-timeout 3 \
        --stepped-sl '{"20":2,"25":10,"30":15}'
      ```

    - *Note: Command arguments assumed to map to strategy params. If CLI doesn't support specific args, we will pass them via config object or defaults.*

## Verification

- Verify the new strategy is registered and runnable.
- Confirm "Gap Entry" logic handles price jumps correctly in logs.
- Compare backtest P&L to expected baseline (though exact match unlikely due to logic change).