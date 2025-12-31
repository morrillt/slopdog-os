---
name: Scaffold fixture-based test structure
overview: Create a reusable test structure that loads candles from fixture files (copied from public), uses a configuration object (mocking UI inputs), and asserts against expected trades. This will make it easy to add new test cases by copying data files and filling in config/expected values.
todos:
  - id: "1"
    content: Add TypeScript types for test fixture structure (TestFixture, TestConfig, etc.)
    status: pending
  - id: "2"
    content: Create loadTestFixture() helper function to load and validate JSON fixtures
    status: pending
  - id: "3"
    content: Create normalizeTradeRow() helper function for trade comparison
    status: pending
  - id: "4"
    content: Create assertTradesMatch() helper function with detailed error messages
    status: pending
  - id: "5"
    content: Scaffold example test case demonstrating the pattern
    status: pending
  - id: "6"
    content: Add comments explaining how to use the pattern and create new fixtures
    status: pending
---

# Scaffold Fixture-Based Test Structure for Strategy 12.8

## Overview

Create a reusable test pattern that:

1. Loads candle data from fixture files (copied from `src/public/data/backtest/candles/`)
2. Uses a configuration object matching UI inputs (pt, sl, trg, maxRoundTrips, cutoffTime, etc.)
3. Asserts against expected trades array
4. Makes it easy to add new test cases by copying data files and filling in values

## Implementation Plan

### 1. Define Test Fixture Structure

Create a TypeScript type for the test fixture that includes:

- `candles`: Array of Candle objects (loaded from JSON)
- `startPrice`: Starting price for the strategy
- `config`: Configuration object matching UI inputs:
  - `profitTargetPts` (pt)
  - `stopLossPts` (sl)
  - `triggerPts` (trg)
  - `maxRoundTrips`
  - `cutoffTime`
  - `strategy` (optional, defaults to "strategy12.8")
- `expectedTrades`: Array of expected AlgoTradeRow objects for assertions

### 4. Create Helper Function to Load Fixture

Create `loadTestFixture(fixturePath: string)` function that:

- Reads JSON file from `tests/fixtures/strategy12dot8/`
- If `config` is a string (URL params), calls `parseConfigFromUrlParams()` to convert it
- If `expectedTrades` is a string (table format), calls `parseTradesFromTable()` to convert it
- Validates structure
- Returns typed fixture object with normalized config and expectedTrades
- Handles file not found gracefully (skip test)

### 2. Create Helper Function to Parse Config from URL Params

Create `parseConfigFromUrlParams(urlParams: string)` function that:

- Parses URL query string format: `pt=33&sl=7&trg=6&cutoffTime=09:45&maxRoundTrips=6`
- Converts to TestConfig object:
  - `pt` → `profitTargetPts` (number)
  - `sl` → `stopLossPts` (number)
  - `trg` → `triggerPts` (number)
  - `cutoffTime` → `cutoffTime` (string, defaults to "09:45")
  - `maxRoundTrips` → `maxRoundTrips` (number, defaults to 1)
- Handles missing params with defaults

### 3. Create Helper Function to Parse Trades from Table Format

Create `parseTradesFromTable(tableText: string)` function that:

- Parses table format with columns: RT#, Timestamp (ET), Type, Price, Slippage, Note, Net
- Converts each row to AlgoTradeRow:
  - RT# is ignored (round trip number)
  - Timestamp: "10/17/2025, 09:30:00 ET" → normalized timestamp string
  - Type: "Open Short" → "Open Short" | "Open Long" | "Close Short" | "Close Long"
  - Price: string → number
  - Slippage: string → number (optional)
  - Note: "—" → undefined, "SL Hit" → "SL Hit", "PT Hit" → "PT Hit"
  - Net: string → number (optional, for validation)
- Returns AlgoTradeRow[] array
- Skips header row and "Day Total" footer row

### 4. Create Helper Function to Normalize Trades for Comparison

Create `normalizeTradeRow(row: AlgoTradeRow)` function that:

- Extracts key fields for comparison (timestamp, type, price, note)
- Handles timestamp format differences (ET vs ISO)
- Returns a comparable object

### 5. Create Helper Function to Assert Trades Match

Create `assertTradesMatch(actual: AlgoTradeRow[], expected: AlgoTradeRow[], fixtureName: string)` function that:

- Compares trade counts
- Compares each trade's key properties
- Provides helpful error messages showing differences
- Handles partial matches (if expected is subset of actual)

### 5. Scaffold Example Test Case

Create a template test case that demonstrates the pattern:

```typescript
it("should match expected trades from fixture file", async () => {
  const fixture = await loadTestFixture("example-test.json");
  
  const results = runStrategy12dot8(
    fixture.candles,
    fixture.startPrice,
    fixture.config.triggerPts,
    fixture.config.profitTargetPts,
    fixture.config.stopLossPts,
    fixture.config.maxRoundTrips,
    false, // enableLogging
    fixture.config.cutoffTime
  );
  
  assertTradesMatch(results, fixture.expectedTrades, "example-test");
});
```

### 6. File Structure

- Place fixture files in: `tests/fixtures/strategy12dot8/`
- Naming convention: `{date}-{description}.json` (e.g., `2025-10-17-same-candle-reentry.json`)
- Each fixture file contains:
  ```json
  {
    "candles": [...],
    "startPrice": 24736.25,
    "config": {
      "profitTargetPts": 33,
      "stopLossPts": 7,
      "triggerPts": 6,
      "maxRoundTrips": 6,
      "cutoffTime": "09:45"
    },
    "expectedTrades": [...]
  }
  ```


### 7. Integration Points

- Use existing `runStrategy12dot8` function signature
- Use existing `Candle` and `AlgoTradeRow` types from `src/lib/backtest`
- Place helper functions at top of test file (after imports, before test suites)
- Add example fixture file to demonstrate structure

## Files to Modify

1. **`tests/unit/strategy12dot8.test.ts`**

   - Add helper functions (loadTestFixture, normalizeTradeRow, assertTradesMatch)
   - Add example test case showing the pattern
   - Add TypeScript types for fixture structure

## Files to Create

1. **`tests/fixtures/strategy12dot8/example-test.json`** (optional example)

   - Template fixture file showing expected structure
   - Can be copied and filled in for new tests

## Notes

- The fixture files will be copied from `src/public/data/backtest/candles/` by the user
- The test structure mimics the UI flow: load candles → apply config → run strategy → compare results
- Timestamp comparison should handle format differences (ET format vs ISO)
- The structure makes it easy to add regression tests by copying production data and expected results