---
name: Fix stepped SL for second interval trades
overview: Verify and fix stepped stop loss not being applied to trades starting after 9:35 in strategy 12.10.1. Create a failing Playwright test for the specific case at 9:35:40, then fix the issue.
todos:
  - id: verify-issue
    content: Verify the issue by checking the URL with maxRT=2 and stepped SL config, confirming stepped SL is not applied to trades starting after 9:35
    status: completed
  - id: create-test
    content: Create Playwright test case that checks if stepped SL is applied to a trade starting after 9:35:00, specifically checking the trade around 9:35:40
    status: completed
  - id: debug-code
    content: Debug the stepped SL logic in strategy12dot10dot1.ts to identify why it is not being applied to second interval trades
    status: completed
  - id: fix-bug
    content: Fix the identified bug in the stepped SL logic
    status: completed
  - id: verify-fix
    content: Run the Playwright test until it passes, confirming the fix works
    status: completed
---

# Fix Stepped SL for Second Interval Trades

## Problem

Stepped stop loss is not being applied to trades starting in the second interval (after 9:35) in strategy 12.10.1. At 9:35:40 on 2025-11-12, price is relatively high and should have triggered SL drag but hasn't.

## Investigation Steps

1. **Verify the issue** with the specific URL and config:

   - URL: `/backtest/2025-11-12?strategy=strategy12.10.1&pt=50&sl=10&trg=8&candleType=1s&cutoffTime=09%3A45&maxRT=2`
   - Use stepped SL config: `{"20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50}`
   - Check if stepped SL is applied to trades starting after 9:35

2. **Review the code** in `src/lib/backtest/strategies/strategy12dot10dot1.ts`:

   - Verify `scanForExit()` receives `state.stopLossByProfitThreshold` correctly
   - Check if the config is properly initialized in `initializeTradingState()`
   - Ensure stepped SL logic runs for all trades regardless of when they start

## Test Case

Create a Playwright test in `tests/e2e/stepped-sl-12dot10.e2e.spec.ts`:

```typescript
test("stepped SL applied to trade starting after 9:35 for 2025-11-12", async ({ page }) => {
  // Use the exact URL and config from the user
  const steppedSLConfig = { "20": 2, "25": 10, "30": 10, "40": 20, "60": 30, "80": 50 };
  const steppedSLParam = encodeURIComponent(JSON.stringify(steppedSLConfig));
  const url = `/backtest/2025-11-12?strategy=strategy12.10.1&pt=50&sl=10&trg=8&candleType=1s&cutoffTime=09%3A45&maxRT=2&steppedSL=${steppedSLParam}`;
  
  await page.goto(url);
  await waitForAlgoTrades(page);
  
  // Find trade that starts after 9:35:00
  // Check if it has stepped SL applied (either hits adjusted SL or shows SL changes)
  // Verify that at 9:35:40, if price is high enough, stepped SL should have triggered
});
```

## Potential Fixes

1. **If config is not passed correctly**: Ensure `stopLossByProfitThreshold` is properly passed through the call chain
2. **If logic is skipped**: Check if there's a condition that prevents stepped SL from running for post-9:35 trades
3. **If state is reset incorrectly**: Verify that `state.stopLossByProfitThreshold` persists through 9:35 reset

## Implementation

1. Add the test case to `tests/e2e/stepped-sl-12dot10.e2e.spec.ts`
2. Run the test to confirm it fails
3. Debug the issue in `strategy12dot10dot1.ts`
4. Fix the bug
5. Re-run the test until it passes

## Files to Modify

- `tests/e2e/stepped-sl-12dot10.e2e.spec.ts` - Add new test case
- `src/lib/backtest/strategies/strategy12dot10dot1.ts` - Fix stepped SL logic if needed