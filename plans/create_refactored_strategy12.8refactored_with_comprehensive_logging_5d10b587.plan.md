---
name: Create refactored strategy12.8refactored with comprehensive logging
overview: Create a new refactored version of strategy12dot8.ts as strategy12dot8refactored.ts with comprehensive structured logging, detailed JSDoc comments, and improved organization while preserving exact business logic
todos:
  - id: copy-original
    content: Copy strategy12dot8.ts to strategy12dot8refactored.ts as starting point
    status: pending
  - id: add-logger-setup
    content: Add module-level logger and create scoped loggers (logMain, logTrigger, logExit, logReentry, logAlternate)
    status: pending
  - id: refactor-structure
    content: "Refactor: reorganize sections (CONFIGURATION, MAIN/EXPORTED, HELPER FUNCTIONS), extract helper functions"
    status: pending
  - id: add-comprehensive-logging
    content: Add structured logging with JSDoc comments above each log call explaining level, purpose, and custom ID
    status: pending
  - id: add-detailed-comments
    content: Add comprehensive JSDoc to all functions and inline comments explaining design decisions
    status: pending
  - id: register-strategy
    content: "Register new strategy in index.ts with ID 'strategy12.8refactored' and production: false"
    status: pending
  - id: create-comparison-tests
    content: Create comparison tests to verify both strategies produce identical results
    status: pending
  - id: verify-no-changes
    content: Run tests and fix any discrepancies to ensure no business logic changes
    status: pending
---

# Create Refactored Strategy12.8refactored with Comprehensive Logging

## Problem

- Need to refactor strategy12dot8.ts to match styleguide (logger, helper functions, organized structure)
- Must preserve exact business logic - no behavior changes
- Need baseline comparison to verify refactoring didn't break anything
- Original strategy12dot8.ts should remain untouched as reference

## Solution

Create a new strategy file `strategy12dot8refactored.ts` that:

- Contains refactored code matching strategy12dot8dot2.ts style
- **IMPORTANT**: Includes comprehensive structured logging with detailed JSDoc comments
- Preserves exact business logic from original
- Registered with different ID ("strategy12.8refactored") for side-by-side testing
- Original strategy12dot8.ts remains unchanged as baseline

## Steps

### 1. Copy Original Strategy as Starting Point

- Copy `src/lib/backtest/strategies/strategy12dot8.ts` to `src/lib/backtest/strategies/strategy12dot8refactored.ts`
- This preserves the original logic as a starting point

### 2. Refactor New File to Match Styleguide

#### 2.1 File Structure (Three Sections)

- **CONFIGURATION**: Imports, logger setup, constants
- **MAIN / EXPORTED**: Entry point function (slim, ~5-6 function calls)
- **HELPER FUNCTIONS**: All utility functions ordered by appearance in Happy Path Flow

#### 2.2 Comprehensive File Header Documentation

- Follow styleguide format with:
                                                                                                                                - Brief description
                                                                                                                                - Usage examples
                                                                                                                                - Input parameters (detailed)
                                                                                                                                - Happy Path Flow (inputs ➜ outputs per step)
                                                                                                                                - Strategy Behavior section
                                                                                                                                - Output format

#### 2.3 Add Structured Logging (CRITICAL - BIG PART)

- **Module-level logger**: `const logger = createLogger("strategy12.8refactored")`
- **Main function logger**: `const logMain = logger.main("runStrategy12dot8refactored")`
- **Helper function loggers**: Create scoped loggers for subsystems:
                                                                                                                                - `logTrigger = logger.helper("triggerScan")` - For trigger scanning logic
                                                                                                                                - `logExit = logger.helper("exitScan")` - For exit condition scanning
                                                                                                                                - `logReentry = logger.helper("reentry")` - For re-eligibility scanning
                                                                                                                                - `logAlternate = logger.helper("alternating")` - For alternating logic
- **Every log call must have**:
                                                                                                                                - JSDoc comment above explaining:
                                                                                                                                                                                                                                                                - What the log is for
                                                                                                                                                                                                                                                                - What level it is (INFO/DEBUG/TRACE/WARN/ERROR/FATAL)
                                                                                                                                                                                                                                                                - Why it's at that level
                                                                                                                                                                                                                                                                - What data it contains
                                                                                                                                                                                                                                                                - Custom ID for easy code lookup (e.g., "rb2krqkc")
                                                                                                                                - Structured data object
                                                                                                                                - Custom ID parameter (required for grep/search)
- **Log levels**:
                                                                                                                                - **INFO**: Function entry/exit, major milestones (1-3 per main function)
                                                                                                                                - **DEBUG**: Decision points, tricky calculations, validations (sparse, 0-N)
                                                                                                                                - **TRACE**: Hotspots/loops only (per-candle checks in scan loops)
                                                                                                                                - **WARN**: Unexpected but non-fatal (e.g., "935 transition not found")
                                                                                                                                - **ERROR**: Error conditions that affect functionality
                                                                                                                                - **FATAL**: Critical errors that stop execution

#### 2.4 Extract Helper Functions (Matching strategy12dot8dot2.ts Pattern)

- `initializeTradingState()` - Setup state, find 9:35 transition, create loggers
- `executeTradingLoop()` - Main trading loop orchestration (slim, delegates to helpers)
- `find935CandleIndex()` - Find 9:35 candle
- `check935Reset()` - Handle 9:35 reset logic
- `isBeforeCutoff()` - Cutoff time checking
- `scanForTrigger()` - Trigger scanning logic (with logTrigger logger)
- `calculateEntry()` - Entry price calculation
- `calculateTpAndSl()` - TP/SL calculation
- `scanForExit()` - Exit condition scanning (with logExit logger)
- `buildTradeRows()` - Trade row construction
- `scanForReeligibility()` - Re-eligibility scanning (with logReentry logger)

#### 2.5 Create TradingState Interface

- Consolidate all mutable state into interface
- Include loggers in state object
- Add extensive JSDoc explaining why state object pattern is used
- Document each state category (Price state, Trade tracking, Alternating logic, etc.)

#### 2.6 Comprehensive JSDoc Comments

- **Every function** must have detailed JSDoc:
                                                                                                                                - Brief description
                                                                                                                                - "What this function does" section
                                                                                                                                - Parameter descriptions with types
                                                                                                                                - Return value description
                                                                                                                                - Examples where helpful
- **Inline comments** explaining:
                                                                                                                                - Why things are done a certain way
                                                                                                                                - Design patterns being used
                                                                                                                                - Complex logic reasoning
                                                                                                                                - State management decisions

#### 2.7 Update Main Function to be Slim

- Main function should be ~5-6 high-level function calls
- All detailed logic delegated to helpers
- Follow pattern from strategy12dot8dot2.ts

### 3. Register New Strategy

- Import `strategy12dot8refactored` in `src/lib/backtest/strategies/index.ts`
- Add to strategies array with ID `"strategy12.8refactored"`
- Set `production: false` to hide from production UI (testing only)
- Add JSDoc comment explaining registry pattern

### 4. Create Comparison Tests

- Create `tests/unit/strategy12dot8-comparison.test.ts`
- Test both strategies with same inputs and verify identical outputs
- Use fixture data from `tests/fixtures/strategy12dot8/2025-10-17-pt33-sl7-trg6.json`
- Compare: trade count, trade prices, timestamps, exit reasons, P&L
- Document any differences discovered

### 5. Verify No Business Logic Changes

- Run comparison tests to ensure both strategies produce identical results
- Fix any discrepancies found during testing
- Ensure logging doesn't affect business logic (all logging should be side-effect free)

## Key Files

- `src/lib/backtest/strategies/strategy12dot8.ts` - Original (untouched baseline)
- `src/lib/backtest/strategies/strategy12dot8refactored.ts` - New refactored version
- `src/lib/backtest/strategies/strategy12dot8dot2.ts` - Style reference (logging patterns)
- `src/lib/backtest/strategies/index.ts` - Register new strategy
- `src/lib/logger.ts` - Logger implementation reference
- `tests/unit/strategy12dot8-comparison.test.ts` - Comparison tests

## Expected Outcome

- Original strategy12dot8.ts remains unchanged (baseline)
- New strategy12dot8refactored.ts with:
                                                                                                                                - **Comprehensive structured logging** with detailed JSDoc comments above each log call
                                                                                                                                - **Scoped loggers** for different subsystems (triggerScan, exitScan, reentry, alternating)
                                                                                                                                - **Custom IDs** on every log call for easy code lookup
                                                                                                                                - **Proper log levels** (INFO for milestones, DEBUG for decisions, TRACE for loops)
                                                                                                                                - Improved structure and organization
- Both strategies produce identical results when tested
- Comparison tests verify no business logic changes
- New strategy registered and testable via ID "strategy12.8refactored"

## Logging Examples from strategy12dot8dot2.ts

```typescript
/**
 * Logs function entry with input parameters and configuration.
 * INFO level: Major milestone - function start.
 * 
 * @param message - "starting, configuration loaded, Candles loaded"
 * @param data - Input candle count/start price and full config
 * @param id - "rb2krqkc" - Custom ID for easy code lookup
 */
logMain.info("starting, configuration loaded, Candles loaded", {
  input: { candleCount: candles.length, startPrice },
  config: { triggerPts, profitTargetPts, stopLossPts, maxRoundTrips },
}, "rb2krqkc");

/**
 * Logs per-candle trigger check during trigger scan loop.
 * TRACE level: Hotspot/loop - high-frequency logging for each candle checked.
 * 
 * @param message - "checking trigger"
 * @param data - Candle index, time, OHLC prices, trigger levels, hit status
 * @param subfunction - undefined (no subfunction)
 * @param id - "rb2krqkh" - Custom ID for easy code lookup
 */
state.logTrigger.trace("checking trigger", {
  candleIndex: i,
  time: candle.time,
  high: candle.high,
  low: candle.low,
  longTrigger: state.longTrigger,
  shortTrigger: state.shortTrigger,
  longHit,
  shortHit,
}, undefined, "rb2krqkh");
```