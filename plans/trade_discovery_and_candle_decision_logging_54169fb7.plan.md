---
name: Trade Discovery and Candle Decision Logging
overview: "Design and implement two special logging moments: (1) Trade discovery logging when a trade is found, and (2) Per-candle decision logging with filtering capabilities. Proposing 3 design options for each with recommendations."
todos: []
---

# Trade Discovery and Candle Decision Logging Design

## Context

The logger system currently supports:

- Structured logging with modules, function types, function names, subfunctions
- Log levels: trace, debug, info, warn, error, fatal
- Filtering by: module, level, search text, time range
- No tag system currently exists

Trades are discovered in `scanForTrigger()` when price crosses triggers. The `TradingState` object contains all relevant state (triggers, prices, trade counts, alternating logic, 9:35 reset state, etc.).

Candles are processed in loops with many conditional checks (cutoff time, 9:35 reset, trigger hits, alternating logic, etc.).

---

## Logging Moment 1: Trade Discovery

**✅ SELECTED**: **Option 1B** - Structured log with categorized sections

**Goal**: Log the exact moment when a trade is discovered (both when trigger is found creating Open row, AND when exit is found creating Close row), including all relevant `TradingState` that could be helpful for debugging.

**Location**:

- After `scanForTrigger()` returns a result in `executeTradingLoop()` (Open row)
- After `scanForExit()` returns a result in `executeTradingLoop()` (Close row)

**Design**:

- Single `log.debug()` call per discovery moment (Open and Close)
- Break state into logical sections: `trade`, `trigger`/`exit`, `priceState`, `alternatingLogic`, `resetState`
- Level: `debug` (detailed diagnostic)

**Example**:

```typescript
// When trigger found (Open row):
logMain.debug("trade discovered - trigger", {
  trade: {
    number: state.tradeNumber,
    sessionCount: state.sessionTradeCount,
  },
  trigger: {
    candleIndex: triggerResult.candleIndex,
    direction: triggerResult.direction,
    candle: state.candles[triggerResult.candleIndex],
  },
  priceState: {
    currentStartPrice: state.currentStartPrice,
    longTrigger: state.longTrigger,
    shortTrigger: state.shortTrigger,
    hasSwitched: state.hasSwitched,
  },
  alternatingLogic: {
    lastTradeDirection: state.lastTradeDirection,
    lastExitNote: state.lastExitNote,
    lastExitWasSameCandleEligible: state.lastExitWasSameCandleEligible,
  },
  resetState: {
    hasResetAt935: state.hasResetAt935,
    candle935Index: state.candle935Index,
    priceAt935: state.priceAt935,
  },
}, undefined, "trade-disc-open-001");

// When exit found (Close row):
logMain.debug("trade discovered - exit", {
  trade: {
    number: state.tradeNumber,
    sessionCount: state.sessionTradeCount,
  },
  exit: {
    candleIndex: exitResult.candleIndex,
    price: exitResult.price,
    timestamp: exitResult.timestamp,
    note: exitResult.note,
    slippage: exitResult.slippage,
  },
  // ... same state sections
}, undefined, "trade-disc-close-001");
```

---

## Logging Moment 2: Per-Candle Decision Logging

**✅ SELECTED**: **Option 2C** - Create CandleDecision interface + structured logging with tags

**Goal**: Log every candle considered with all checks and reasons that led to either having a trade or not having a trade. **ONE log per candle** (not per phase), aggregating all checks from trigger-scan, exit-scan, and reeligibility-scan phases.

**Location**: In `scanForTrigger()`, `scanForExit()`, and `scanForReeligibility()` loops - but aggregate into ONE log per candle.

**Design**:

- Create a `CandleDecision` interface that captures all decision factors
- **ONE log per candle** - aggregate checks from all phases that touch this candle
- Include `results` section showing algorithmic trades created for that candle (if any)
- Add `tags` array as top-level field in LogEntry for filtering
- Use `log.debug()` with subfunction "candleDecision"
- Level: `debug` (detailed diagnostic, per-candle)

**CandleDecision Interface**:

```typescript
interface CandleDecision {
  candleIndex: number;
  candle: Candle;
  checks: {
    cutoffTime: { passed: boolean; value: string; cutoff: string };
    triggerHit: { long: boolean; short: boolean; levels: { long: number; short: number } };
    alternatingLogic: { active: boolean; requiredDirection: "long" | "short" | null };
    reset935: { triggered: boolean; newStartPrice: number | null };
    exitHit?: { tp: boolean; sl: boolean; eod: boolean; levels?: { tp: number; sl: number } };
    reeligibility?: { eligible: boolean; priceBetweenTriggers: boolean };
  };
  conditionalFlags: {
    mustAlternate: boolean;
    allowedLongHit: boolean;
    allowedShortHit: boolean;
  };
  outcome: {
    decision: "TRADE_FOUND" | "NO_TRADE" | "CONTINUE_SCAN";
    reason: string;
    direction?: "long" | "short";
  };
  results: {
    tradesCreated: AlgoTradeRow[]; // Empty array if no trades created for this candle
  };
}
```

**Usage with Tags**:

```typescript
const decision: CandleDecision = {
  candleIndex: i,
  candle: candle,
  checks: { /* ... */ },
  conditionalFlags: { /* ... */ },
  outcome: { /* ... */ },
  results: {
    tradesCreated: [], // or [openRow, closeRow] if trades created
  },
};

const tags = [
  "candle-check",
  decision.outcome.decision === "TRADE_FOUND" ? "trade-found" : "no-trade",
  decision.checks.triggerHit.long || decision.checks.triggerHit.short ? "trigger-hit" : null,
  decision.checks.reset935.triggered ? "reset-935" : null,
].filter(Boolean) as string[];

state.logTrigger.debug(
  "candle decision",
  { decision },
  "candleDecision",
  "candle-decision-001",
  tags
);
```

---

## Implementation Plan

### Phase 1: Add Tags Support to Logger

1. Extend `LogEntry` interface in `src/stores/logger.ts` to include optional `tags?: string[]`
2. Update logger API in `src/lib/logger.ts` to accept tags parameter for all log methods
3. Update `addLogEntry()` to store tags in LogEntry
4. Test tags are stored correctly

### Phase 2: Update LogDrawer UI for Tags Display

1. Update `LogDrawer.tsx` to display tags next to log entry title
2. Tags should display with `#` prefix (e.g., `#candle-check #trade-found`)
3. Use different color from title text
4. Enable text wrapping for tags
5. Add tag filtering UI (include/exclude tags) - can be simple chip buttons or input field
6. Test tag display and filtering

### Phase 3: Trade Discovery Logging (Option 1B)

1. Add trade discovery log in `executeTradingLoop()` after `scanForTrigger()` returns (Open row)
2. Add trade discovery log in `executeTradingLoop()` after `scanForExit()` returns (Close row)
3. Structure log data into categories: `trade`, `trigger`/`exit`, `priceState`, `alternatingLogic`, `resetState`
4. Use `logMain.debug()` with messages "trade discovered - trigger" and "trade discovered - exit"
5. Test with a backtest run to verify both logs appear correctly

### Phase 4: CandleDecision Interface (Option 2C)

1. Create `CandleDecision` interface in strategy file or shared types
2. Define structure with: `candleIndex`, `candle`, `checks`, `conditionalFlags`, `outcome`, `results`
3. Design checks object to capture: cutoffTime, triggerHit, alternatingLogic, reset935, exitHit (optional), reeligibility (optional)
4. Design conditionalFlags to capture: mustAlternate, allowedLongHit, allowedShortHit
5. Design outcome with: decision, reason, optional direction
6. Design results with: tradesCreated array (AlgoTradeRow[])
7. **ONE log per candle** - need to aggregate checks from all phases (trigger-scan, exit-scan, reeligibility-scan)

### Phase 5: Per-Candle Decision Logging (Option 2C)

1. Implement CandleDecision logging that aggregates checks from all phases
2. Build CandleDecision object for each candle iteration
3. Include tradesCreated in results section (any AlgoTradeRow objects created for this candle)
4. Use `log.debug()` with subfunction "candleDecision" and tags array
5. Add conditional flags to capture branching logic not in state
6. Test with debug level enabled to verify structure

---

## Implementation Details

### Trade Discovery Logging (Option 1B)

- **Location**: `src/lib/backtest/strategies/strategy12dot8refactored.ts` in `executeTradingLoop()`
- **Log Level**: `debug` (detailed diagnostic)
- **Messages**: "trade discovered - trigger" and "trade discovered - exit"
- **Custom IDs**: "trade-disc-open-001" and "trade-disc-close-001"
- **Data Structure**: Categorized sections (trade, trigger/exit, priceState, alternatingLogic, resetState)

### CandleDecision Interface (Option 2C)

- **Location**: Create in `src/lib/backtest/strategies/strategy12dot8refactored.ts` or shared types file
- **Interface Name**: `CandleDecision`
- **One log per candle** (aggregates all checks from trigger-scan, exit-scan, reeligibility-scan phases)
- **Outcome Decisions**: `"TRADE_FOUND" | "NO_TRADE" | "CONTINUE_SCAN"`
- **Results Section**: `tradesCreated: AlgoTradeRow[]` - shows any trades created for this candle
- **Log Level**: `debug` (detailed diagnostic, per-candle)
- **Subfunction**: `"candleDecision"` (consistent)
- **Tags**: Array of strings for filtering (e.g., `["candle-check", "trade-found", "trigger-hit"]`)

### Tags System

- **Location**: `src/stores/logger.ts` (LogEntry interface) and `src/lib/logger.ts` (logger API)
- **Display**: Next to log entry title with `#` prefix, different color, wrapping enabled
- **Filtering**: Include/exclude tags in LogDrawer UI