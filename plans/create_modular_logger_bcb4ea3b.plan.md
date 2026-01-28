---
name: Create Modular Logger
overview: Create a minimal logger.ts with 3-tier granularity stored in Valtio state (ring buffer, 1000 events), default silent until toggled on via a drawer UI with filters and toggles, supporting named JSON data attachments.
todos:
  - id: create-logger-store
    content: Create src/stores/logger.ts with Valtio state, ring buffer logic, and module config actions
    status: pending
  - id: create-logger-core
    content: Create src/lib/logger.ts with createLogger factory and log level methods
    status: pending
  - id: create-logger-hook
    content: Create src/hooks/useLogger.ts for React integration
    status: pending
  - id: create-drawer-ui
    content: Create src/components/LogDrawer.tsx with filters, toggles, and log entry list
    status: pending
  - id: add-json-viewer
    content: Add JSON viewer component for data attachments (expandable inline)
    status: pending
  - id: integrate-backtest
    content: Add LogDrawer to backtest-ui.tsx and example logger calls to backtest.ts
    status: pending
---

# Create Modular Logger System with Drawer UI

## Overview

Build a tiered logging infrastructure with 3 levels of granularity, stored in Valtio state as a ring buffer, with a drawer UI for viewing/filtering logs. All modules silent by default until toggled on.

## Architecture

### Core Logger (`src/lib/logger.ts`)

A minimal, type-safe logger with:

- **3-tier hierarchy**: Module → Function Type (main/helper) → Subfunction
- **6 log levels**: trace, debug, info, warn, error, fatal
- **Ring buffer**: Fixed-size array (1000 entries) in Valtio store
- **Named data attachments**: Attach JSON objects with names to any log entry
- **Zero persistence**: No localStorage, all in-memory

**Module Header Documentation** (will be at top of `src/lib/logger.ts`):

````typescript
/**
 * =============================================================================
 * LOGGER - Application Logging System
 * =============================================================================
 * 
 * ## TL;DR - AI QUICK START
 * 
 * ```typescript
 * // 1. Create module logger (once per file, top level)
 * import { createLogger } from "@/lib/logger";
 * const logger = createLogger("backtest");
 * 
 * // 2. Scope logger to function (once per function)
 * const log = logger.main("generateAlgoTrades");  // or logger.helper("calculatePrice")
 * 
 * // 3. Log at milestones + decision points (keep sparse!)
 * log.info("starting", { input: { date, strategyId } });           // Function entry
 * log.debug("validated", { checks: { hasCandles: true } });        // Decision point
 * log.trace("candle check", { candle, trigger }, "checkTrigger");  // Hotspot/loop (rare)
 * log.info("completed", { output: { tradeCount: 5 } });            // Function exit
 * 
 * // 4. Signature
 * log.info(message: string, data?: Record<string, any>);
 * log.trace(message: string, data?: Record<string, any>, subfunction?: string);
 * 
 * // 5. Rules
 * // - INFO: 1-3 per main function (start, done, major outcome)
 * // - DEBUG: sparse, only tricky decisions/calcs (0-N)
 * // - TRACE: only hotspots/loops, gated behind scope + level
 * // - Keep message short, data small
 * // - If INFO+DEBUG doesn't explain it, enable TRACE for that scope temporarily
 * ```
 */
````

**Note**: The full detailed usage guide from the original plan has been removed to keep the module header concise and focused on the essential quick-start information.

                                                                - 
                                                                - ### Interface Requirements
                                                                - 
                                                                - - **module**: string - Identifies the logging module (e.g., "backtest", "strategies")
                                                                - - **functionType**: "main" | "helper" - Categorizes the function
                                                                - - **functionName**: string - The actual function name
                                                                - - **message**: string - What happened (action or state)
                                                                - - **data**: Record<string, any> (optional) - Named JSON objects with context
                                                                - - **subfunctionName**: string (optional) - For nested operations
                                                                - 
                                                                - ### Integration Pattern
                                                                - 
                                                                - ```typescript
                                                                - // 1. Import and create logger (once per file, top level)
                                                                - import { createLogger } from "@/lib/logger";
                                                                - const logger = createLogger("backtest");
                                                                - 
                                                                - // 2. Log in main functions (entry/exit)
                                                                - export function generateAlgoTrades(candles, startPrice, ...) {
                                                                -   logger.info("main", "generateAlgoTrades", "Starting", {
                                                                -     input: { candleCount: candles.length, startPrice },
                                                                -     config: { triggerPts, profitTargetPts }
                                                                -   });
                                                                -   
                                                                -   // ... function logic ...
                                                                -   
                                                                -   logger.info("main", "generateAlgoTrades", "Completed", {
                                                                -     output: { tradeCount: rows.length }
                                                                -   });
                                                                - }
                                                                - 
                                                                - // 3. Log validation/substeps with subfunction name
                                                                - logger.debug("main", "generateAlgoTrades", "Validating params", {
                                                                -   params: { triggerPts, profitTargetPts }
                                                                - }, "validateParams");
                                                                - 
                                                                - // 4. Log in helper functions
                                                                - function calculatePrice(candle, offset) {
                                                                -   logger.trace("helper", "calculatePrice", "Computing", {
                                                                -     candle: { open: candle.open, high: candle.high },
                                                                -     offset
                                                                -   });
                                                                -   
                                                                -   const price = candle.open + offset;
                                                                -   
                                                                -   logger.trace("helper", "calculatePrice", "Computed", {
                                                                -     result: { price }
                                                                -   });
                                                                -   
                                                                -   return price;
                                                                - }
                                                                - 
                                                                - // 5. Log errors with context
                                                                - logger.error("main", "generateAlgoTrades", "Failed", {
                                                                -   error: { message: err.message, stack: err.stack },
                                                                -   context: { date, strategyId }
                                                                - });
                                                                - ```
                                                                - 
                                                                - ### When to Add Logging
                                                                - 
                                                                - - **Entry/Exit**: Main function start/end (info level)
                                                                - - **Validation**: Parameter checks, data validation (debug level)
                                                                - - **Helpers**: Helper function calls with inputs/outputs (debug/trace level)
                                                                - - **Errors**: All error conditions with full context (error/fatal level)
                                                                - - **Performance**: Critical sections, loops, heavy computation (trace level)
                                                                - - **State Changes**: Important state mutations (info/debug level)
                                                                - 
                                                                - ### Log Levels (when to use)
                                                                - 
                                                                - - **trace**: Very detailed, high-frequency logs (loop iterations, calculations)
                                                                - - **debug**: Detailed diagnostic info (validation, helper calls, substeps)
                                                                - - **info**: General informational messages (function entry/exit, milestones)
                                                                - - **warn**: Warning conditions that don't stop execution
                                                                - - **error**: Error conditions that affect functionality
                                                                - - **fatal**: Critical errors that stop execution
                                                                - 
                                                                - ### Data Attachment Best Practices
                                                                - 
                                                                - - Use descriptive keys: `input`, `output`, `config`, `result`, `error`, `context`
                                                                - - Keep data small: Don't attach huge arrays (summarize instead)
                                                                - - Include relevant IDs: date, strategyId, tradeId, etc.
                                                                - - Sanitize sensitive data: No passwords, tokens, etc.
                                                                - 
                                                                - ### Example: Full Integration
                                                                - 
                                                                - ```typescript
                                                                - // src/lib/backtest.ts
                                                                - import { createLogger } from "@/lib/logger";
                                                                - 
                                                                - const logger = createLogger("backtest");
                                                                - 
                                                                - export function generateAlgoTrades(
                                                                -   candles: Candle[],
                                                                -   startPrice: number,
                                                                -   triggerPts: number,
                                                                -   profitTargetPts: number,
                                                                -   stopLossPts: number,
                                                                -   maxRoundTrips: number,
                                                                -   enableLogging: boolean,
                                                                -   strategyId: string,
                                                                -   cutoffTime?: string,
                                                                -   steppedSL?: Record<string, number>
                                                                - ): AlgoTradeRow[] {
                                                                -   logger.info("main", "generateAlgoTrades", "Starting", {
                                                                -     input: { 
                                                                -       candleCount: candles.length, 
                                                                -       startPrice, 
                                                                -       strategyId 
                                                                -     },
                                                                -     config: { 
                                                                -       triggerPts, 
                                                                -       profitTargetPts, 
                                                                -       stopLossPts, 
                                                                -       maxRoundTrips,
                                                                -       cutoffTime,
                                                                -       steppedSL 
                                                                -     }
                                                                -   });
                                                                - 
                                                                -   // Validation
                                                                -   logger.debug("main", "generateAlgoTrades", "Validating", {
                                                                -     checks: { 
                                                                -       hasCandlesData: candles.length > 0,
                                                                -       hasStartPrice: startPrice != null,
                                                                -       hasStrategy: strategyId != null
                                                                -     }
                                                                -   }, "validateInputs");
                                                                - 
                                                                -   if (!candles.length) {
                                                                -     logger.error("main", "generateAlgoTrades", "No candles", {
                                                                -       error: { message: "Empty candles array" }
                                                                -     });
                                                                -     return [];
                                                                -   }
                                                                - 
                                                                -   // Get strategy
                                                                -   const strategy = getStrategy(strategyId);
                                                                -   logger.debug("main", "generateAlgoTrades", "Strategy loaded", {
                                                                -     strategy: { id: strategy?.id, name: strategy?.name }
                                                                -   });
                                                                - 
                                                                -   // Run strategy
                                                                -   const rows = strategy.run(...);
                                                                - 
                                                                -   logger.info("main", "generateAlgoTrades", "Completed", {
                                                                -     output: { 
                                                                -       tradeCount: rows.length,
                                                                -       roundTrips: rows.filter(r => r.id.startsWith("close")).length
                                                                -     }
                                                                -   });
                                                                - 
                                                                -   return rows;
                                                                - }
                                                                - ```

*/

````

### Valtio Store (`src/stores/logger.ts`)

**What is an interface?**
An interface is a TypeScript contract that defines the shape of an object. It specifies what properties an object must have and their types. Think of it as a blueprint or template. Interfaces don't exist at runtime (JavaScript doesn't have them) - they're purely for TypeScript's type checking during development.

Example: If you have `interface Person { name: string; age: number; }`, then any object claiming to be a `Person` MUST have a `name` (string) and `age` (number). TypeScript will error if you try to pass an object without these properties or with wrong types.

```typescript
/**
 * A single log entry in the ring buffer.
 * 
 * This interface defines the structure of each logged event. Every log call
 * creates one LogEntry object that gets stored in the Valtio state.
 */
interface LogEntry {
  id: string;                      // Unique ID for React keys (prevents re-render issues)
  timestamp: number;               // Unix timestamp (ms) when log was created
  module: string;                  // Module name from createLogger() (e.g., "backtest", "strategies")
  functionType: "main" | "helper"; // Category: main business logic or helper utility
  functionName: string;            // Function name from logger.main() or logger.helper()
  subfunctionName?: string;        // Optional: nested operation name (only for TRACE/rare DEBUG)
  level: LogLevel;                 // Log level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  message: string;                 // Short human-readable description of what happened
  data?: Record<string, any>;      // Optional: named JSON objects with context (input, output, config, error, etc.)
}

/**
 * Global logger state stored in Valtio.
 * 
 * This is the single source of truth for all logging data and configuration.
 * Valtio makes it reactive - when this changes, React components automatically re-render.
 */
interface LoggerState {
  entries: LogEntry[];                        // Ring buffer of log entries (max 1000, oldest removed when full)
  moduleConfigs: Record<string, ModuleConfig>; // Per-module configuration (enabled state, log level)
  drawerOpen: boolean;                        // Whether the log drawer UI is currently visible
}

/**
 * Configuration for a single module.
 * 
 * Each module (e.g., "backtest", "strategies") has its own config that controls
 * whether it logs and at what level.
 */
interface ModuleConfig {
  enabled: boolean;  // Whether this module logs at all (default: false = silent)
  level: LogLevel;   // Minimum level to log (default: "debug" when enabled)
                     // Example: if level="info", then trace/debug are ignored, info/warn/error/fatal are logged
}
````

### Logger API

```typescript
// Create module-scoped logger
const logger = createLogger("backtest");

// Log with optional named data attachments
logger.info("main", "generateAlgoTrades", "Starting trade generation", {
  params: { triggerPts: 5, profitTargetPts: 30 },
  candle: { open: 4500, high: 4505, ... }
});

// Subfunction logging
logger.debug("helper", "calculatePrice", "Validating range", 
  { price: 4500.25, threshold: 4500 }, 
  "validateRange"
);

// Toggle module on/off
toggleModule("backtest", true);

// Set module log level
setModuleLevel("backtest", "trace");
```

### Drawer UI (`src/components/LogDrawer.tsx`)

A slide-out drawer with:

- **Module toggles**: Enable/disable each module
- **Level filter**: Show only logs >= selected level
- **Search**: Filter by message text
- **Time range**: Show logs from last N minutes
- **Data inspector**: Expandable JSON viewer for attached data
- **Clear button**: Clear all logs
- **Auto-scroll**: Toggle auto-scroll to latest

## Implementation Details

### Ring Buffer Logic

```typescript
function addLogEntry(entry: LogEntry) {
  if (loggerState.entries.length >= 1000) {
    loggerState.entries.shift(); // Remove oldest
  }
  loggerState.entries.push(entry);
}
```

### Default Configuration

- All modules **disabled by default** (silent)
- Default level when enabled: `debug`
- Drawer closed by default
- Ring buffer starts empty

## Integration Points

### Target Modules

Based on your request for "all imported /lib modules in the backtest hook":

1. **`src/lib/backtest.ts`** - Main backtest orchestration
2. **`src/lib/backtest/strategies/*.ts`** - All strategy implementations  
3. **`src/lib/backtest/helpers/*.ts`** - Helper utilities
4. **`src/hooks/useBacktest.ts`** - React hook (optional)

### Example Usage in Backtest

```typescript
// In src/lib/backtest.ts
import { createLogger } from "./logger";

const logger = createLogger("backtest");

export function generateAlgoTrades(candles, startPrice, ...) {
  logger.info("main", "generateAlgoTrades", "Starting", {
    input: { strategyId, candleCount: candles.length, startPrice },
    config: { triggerPts, profitTargetPts, stopLossPts }
  });
  
  // Validation subfunction
  logger.debug("main", "generateAlgoTrades", "Validating params", {
    params: { triggerPts, profitTargetPts }
  }, "validateParams");
  
  // Helper function
  const price = calculatePrice(...);
  logger.trace("helper", "calculatePrice", "Price computed", {
    result: { price, candle: candles[0] }
  });
  
  logger.info("main", "generateAlgoTrades", "Completed", {
    output: { tradeCount: rows.length, totalPnL: 150 }
  });
}
```

### Drawer Integration

Add to `src/app/backtest/backtest-ui.tsx`:

```tsx
import { LogDrawer } from "@/components/LogDrawer";

export function BacktestUI() {
  return (
    <>
      {/* Existing UI */}
      <LogDrawer />
    </>
  );
}
```

## Files to Create

1. **`docs/ai/logger-usage.md`** (~50 lines)

                                                                                                                                                                                                - Concise AI usage guide
                                                                                                                                                                                                - Interface requirements
                                                                                                                                                                                                - Integration examples
                                                                                                                                                                                                - When/how to add logging

2. **`src/lib/logger.ts`** (~150 lines)

                                                                                                                                                                                                - Core logger implementation
                                                                                                                                                                                                - `createLogger()` factory
                                                                                                                                                                                                - Level checking logic

3. **`src/stores/logger.ts`** (~100 lines)

                                                                                                                                                                                                - Valtio state definition
                                                                                                                                                                                                - Ring buffer management
                                                                                                                                                                                                - Module config actions

4. **`src/components/LogDrawer.tsx`** (~300 lines)

                                                                                                                                                                                                - Drawer UI component
                                                                                                                                                                                                - Module toggles
                                                                                                                                                                                                - Level filter dropdown
                                                                                                                                                                                                - Search input
                                                                                                                                                                                                - Log entry list with data inspector
                                                                                                                                                                                                - Clear/auto-scroll controls

5. **`src/hooks/useLogger.ts`** (~50 lines)

                                                                                                                                                                                                - React hook for accessing logger state
                                                                                                                                                                                                - Convenience wrapper around Valtio snapshot

6. **`tests/e2e/log-drawer.e2e.spec.ts`** (~100 lines)

                                                                                                                                                                                                - E2E test for log drawer functionality
                                                                                                                                                                                                - Verify drawer opens/closes
                                                                                                                                                                                                - Verify logs appear when modules are toggled
                                                                                                                                                                                                - Verify filters work

## UI Design (LogDrawer)

### Layout

```
┌─────────────────────────────────────┐
│ Logs                           [×]  │ ← Header with close button
├─────────────────────────────────────┤
│ Modules: [backtest ✓] [strategies] │ ← Module toggles (chips)
│ Level: [Debug ▼]  Search: [____]   │ ← Filters
│ [Clear] [Auto-scroll ✓]            │ ← Actions
├─────────────────────────────────────┤
│ 12:34:56.789 [INFO] backtest       │ ← Log entries
│   main.generateAlgoTrades           │
│   Starting trade generation         │
│   📎 input, config                  │ ← Data attachments (clickable)
├─────────────────────────────────────┤
│ 12:34:56.790 [DEBUG] backtest      │
│   main.generateAlgoTrades           │
│   → validateParams                  │ ← Subfunction indicator
│   Validating params                 │
│   📎 params                         │
└─────────────────────────────────────┘
```

### Data Inspector

Clicking a data attachment expands inline JSON viewer:

```
📎 input ▼
  {
    "strategyId": "strategy12.8",
    "candleCount": 23400,
    "startPrice": 4500.25
  }
```

## Styling

- Use Tailwind v4 (existing project setup)
- Drawer slides in from right
- Fixed width: 600px (desktop), full-width (mobile)
- Dark theme to match existing UI
- Syntax highlighting for JSON (use `react-json-view` or similar)

## Future Extension Points

1. **Export**: Add "Export to JSON" button
2. **Persistence**: Optional IndexedDB for session history
3. **Performance metrics**: Track function execution time
4. **Stack traces**: Capture call stacks for errors
5. **Log streaming**: Real-time updates during long operations
6. **Filtering presets**: Save common filter combinations

## E2E Test Coverage

### Test: Log Drawer Basic Functionality

**File**: `tests/e2e/log-drawer.e2e.spec.ts`

**Scenarios**:

1. **Drawer opens and closes**

                                                                                                                                                                                                - Navigate to backtest page
                                                                                                                                                                                                - Click "Logs" button (or icon)
                                                                                                                                                                                                - Verify drawer is visible with heading "Logs"
                                                                                                                                                                                                - Click close button
                                                                                                                                                                                                - Verify drawer is hidden

2. **Logs appear when module is enabled**

                                                                                                                                                                                                - Open drawer
                                                                                                                                                                                                - Verify initially empty or shows "No logs" message
                                                                                                                                                                                                - Enable "backtest" module toggle
                                                                                                                                                                                                - Trigger an action that logs (e.g., generate trades)
                                                                                                                                                                                                - Verify log entries appear with module name "backtest"

3. **Module toggle works**

                                                                                                                                                                                                - Enable "backtest" module
                                                                                                                                                                                                - Verify toggle shows as checked/active
                                                                                                                                                                                                - Disable "backtest" module
                                                                                                                                                                                                - Verify toggle shows as unchecked/inactive

4. **Data attachments are visible**

                                                                                                                                                                                                - Enable module and trigger logging
                                                                                                                                                                                                - Verify log entry shows data attachment indicators (📎 or "data" label)
                                                                                                                                                                                                - Click attachment to expand
                                                                                                                                                                                                - Verify JSON data is displayed

## Questions Answered

1. ✅ **Storage**: Valtio store with ring buffer (1000 entries)
2. ✅ **Persistence**: None - all in-memory
3. ✅ **Default state**: All modules silent (disabled)
4. ✅ **UI**: Drawer with filters and toggles
5. ✅ **Data attachments**: Named JSON objects per log entry
6. ✅ **Visibility**: Toggle on/off via drawer UI
7. ✅ **E2E testing**: Test drawer open/close and basic log display