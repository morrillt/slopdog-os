---
title: "Code Style Guide"
updated: "2025-12-15"
facets:
  type: note
  status: active
tags:
  - meta/index
  - tech/frontend/architecture
---
# Code Style Guide

## File Structure

Three sections separated by dividers:

```javascript
// =============================================================================
// SECTION NAME
// =============================================================================
```

1. **CONFIGURATION** - Constants, imports, module setup
2. **MAIN / EXPORTED** - Entry point and orchestration  
3. **HELPER FUNCTIONS** - All utility functions

## File Header Documentation

Comprehensive JSDoc header with sections:

```javascript
/**
 * =============================================================================
 * MODULE NAME (UPPERCASE)
 * =============================================================================
 * 
 * Brief one-sentence description.
 * 
 * Usage:
 *   node path/to/file.js
 * 
 * ## Usage
 *   Detailed usage examples
 * 
 * ## Input
 *   - Format requirements, naming conventions, validation rules
 * 
 * ## Happy Path Flow (inputs ➜ outputs per step)
 *   1) functionName() - Input: ... Output: ...
 *   2) nextFunction() - Input: ... Output: ...
 * 
 * ## Environment Variables
 *   VAR_NAME - Description (default: "value")
 * 
 * ## CLI Arguments
 *   --flag <value> - Description
 * 
 * ## Output
 *   output/file.csv
 * 
 * @module path/to/module
 */
```

## Main or Exported Function Pattern

**Main and exported functions must be slim** - 5-6 function calls max. Extract logic into named helpers.

If no `main()`, treat exported functions as main functions (slim, top-level priority).

```javascript
async function main() {
  const { config, logInfo } = initializeAndPrintHeader();
  const { candleFiles, startDay, endDay } = prepareCandleFiles(config, logInfo);
  const selectedStrategyIds = await selectStrategies(logInfo);
  const permutations = generatePermutations(selectedStrategyIds, config, candleFiles, logInfo);
  const dayDataList = loadDayData(candleFiles, logInfo);
  const results = runBacktests(permutations, dayDataList, config, startDay, endDay, logInfo);
  writeResults(results, logInfo);
}
```

```typescript
export async function generateAlgoTrades(candles, startPrice, triggerPts) {
  const log = logger.main("generateAlgoTrades");
  log.info("starting", { input: { date, strategyId } });
  
  const validated = validateInputs(candles, startPrice);
  const trades = processCandles(validated, triggerPts);
  const results = aggregateResults(trades);
  
  log.info("completed", { output: { tradeCount: results.length } });
  return results;
}
```

## Helper Function Organization

Order helpers by appearance in "Happy Path Flow" from file header. Earlier functions appear first.

## JSDoc Function Comments

Every function documented:

```javascript
/**
 * Brief description.
 * 
 * @param {Type} paramName - Description
 * @param {Type} [optionalParam] - Optional description
 * @returns {Type} Return description
 */
```

## Logging

Use `@/lib/logger` for toggleable per-module console logs:

```typescript
// Setup (once per file)
import { createLogger } from "@/lib/logger";
const logger = createLogger("moduleName");

// Usage in functions
export async function generateAlgoTrades(...) {
  const log = logger.main("generateAlgoTrades");  // or logger.helper()
  
  log.info("starting", { input: { date, strategyId } });
  log.debug("validated", { checks: { hasCandles: true } });
  log.trace("candle check", { candle, trigger }, "checkTrigger");
  log.info("completed", { output: { tradeCount: 5 } });
}
```

**Levels:**
- **INFO**: 1-3 per main function (start, done, major outcome)
- **DEBUG**: Sparse, tricky decisions/calculations
- **TRACE**: Hotspots/loops only

## Naming Conventions

- **Functions**: camelCase (`loadConfig()`, `filterCandleFiles()`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TP_LEVELS`, `CANDLES_DIR`)
- **Variables**: camelCase (`candleFiles`, `selectedStrategyIds`)
