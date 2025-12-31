---
name: ""
overview: ""
todos:
  - id: 9d62bb77-20d3-4b38-8f0c-a481d55292d6
    content: Create strategy registry in src/lib/backtest/strategies/index.ts with types + getStrategies/getStrategy
    status: pending
  - id: 90a2700c-5be1-4cec-8846-2c812a260f7b
    content: Create 4 strategy modules with console log at module load, copying current algo logic
    status: pending
  - id: 09fdbbe3-245c-470b-989f-022a464c12bc
    content: Update backtest-ui.tsx dropdown to use registry, remove toast, log on selection
    status: pending
  - id: 0f310ecd-0d05-49ad-a7dd-79bbdd21179f
    content: Add --strategy flag to analyze-permutations.js with interactive fallback
    status: pending
  - id: 4ac93b41-748f-41e2-8dab-8b5915aa1954
    content: Write tests/unit/data-validity.test.ts with UT-PRE-1 (fixture sanity)
    status: pending
  - id: 826bc900-6897-4306-9a6f-2667d5dc977b
    content: Write tests/unit/strategies.test.ts with UT-PRE-2, UT-POST-1, UT-POST-2
    status: pending
  - id: 9e643d24-29a9-45d4-8709-4408be72c425
    content: Write tests/e2e/multistrategy.spec.ts with E2E-1 and E2E-2
    status: pending
---

<!-- f9de739d-aff5-4b2e-8925-2f3566df5b10 12948b87-44b4-4a68-a2cd-27d559e5ac9e -->

# Multi-Strategy Backtester Refactor

## Summary

Create a strategy registry that indexes 4 strategy modules, wire it to the UI dropdown and CLI, and add comprehensive tests. The existing Easy Peasy logic will be copied into 4 named modules with identical behavior (no logic changes).

## Key Files

| File | Purpose |

|------|---------|

| [src/lib/backtest/strategies/index.ts](src/lib/backtest/strategies/index.ts) | Registry: `getStrategies()`, `getStrategy(id)`, types |

| [src/lib/backtest/strategies/easy-peasy-original.ts](src/lib/backtest/strategies/easy-peasy-original.ts) | Strategy 1: Copy of current logic |

| [src/lib/backtest/strategies/935startchange.ts](src/lib/backtest/strategies/935startchange.ts) | Strategy 2: Copy with unique name |

| [src/lib/backtest/strategies/sldrag.ts](src/lib/backtest/strategies/sldrag.ts) | Strategy 3: Copy with unique name |

| [src/lib/backtest/strategies/935startanddrag.ts](src/lib/backtest/strategies/935startanddrag.ts) | Strategy 4: Copy with unique name |

| [src/app/backtest/backtest-ui.tsx](src/app/backtest/backtest-ui.tsx) | Wire dropdown to registry |

| [scripts/analyze-permutations.js](scripts/analyze-permutations.js) | Add `--strategy` flag |

## Implementation

### 1. Strategy Registry Contract

```typescript
// src/lib/backtest/strategies/index.ts
export interface Strategy {
  id: string;
  name: string;
  description: string;
  run: typeof generateAlgoTrades; // Same signature as current
}

export function getStrategies(): Strategy[];
export function getStrategy(id: string): Strategy | undefined;
```

### 2. Strategy Module Pattern

Each strategy module will:

- Export a `Strategy` object with id/name/description/run
- Log `Module {strategyname} Selected` at module load (top-level)
- Use identical `run()` implementation (copied from current `generateAlgoTrades`)

### 3. UI Integration

- Replace hardcoded dropdown options with `getStrategies().map(s => <option>)`
- Remove "NOT WORKING" toast
- Call `setStrategy(id)` on change
- Console log "Module {strategyname} Selected" when strategy changes

### 4. CLI Integration

- Add `--strategy <id>` flag to `analyze-permutations.js`
- If not provided, prompt with `readline` to select from `getStrategies()`
- Default to "easy-peasy-original" on empty input

### 5. Backward Compatibility

- Keep [src/lib/backtest.ts](src/lib/backtest.ts) exporting `generateAlgoTrades` for existing imports
- Registry's "easy-peasy-original" strategy wraps the same function

## Tests

### Vitest Unit Tests

**`tests/unit/data-validity.test.ts`** (Fixture sanity - separate file)

| Test ID | Name | Assertion |

|---------|------|-----------|

| UT-PRE-1 | Data fixtures sanity | 60+ JSON files exist in candles dir, each parses to array length > 1500 |

**`tests/unit/strategies.test.ts`** (Strategy tests)

| Test ID | Name | Assertion |

|---------|------|-----------|

| UT-PRE-2 | Baseline deterministic result | 2025-11-19.json with TP=30/SL=6/TRG=5/RT=6 returns 6 trades, net=-17 |

| UT-POST-1 | Strategy registry lookup | `getStrategies()` returns 4 items with id/name/description, no nulls |

| UT-POST-2 | Baseline unchanged | Same 2025-11-19.json test still returns 6 trades, net=-17 |

### Playwright E2E Tests (`tests/e2e/multistrategy.spec.ts`)

| Test ID | Name | Steps |

|---------|------|-------|

| E2E-1 | Dropdown switching emits console log | Navigate to /backtest, switch each strategy, assert console contains "Module {name} Selected" |

| E2E-2 | Graph renders for each strategy | For each strategy, run backtest, assert chart container is not empty |

Note: E2E-3 (no console errors) is already covered by existing [tests/e2e/backtest.console.e2e.spec.ts](tests/e2e/backtest.console.e2e.spec.ts) - no new test needed.

### To-dos

- [ ] Create strategy registry in src/lib/backtest/strategies/index.ts with types + getStrategies/getStrategy
- [ ] Create 4 strategy modules with console log at module load, copying current algo logic
- [ ] Update backtest-ui.tsx dropdown to use registry, remove toast, log on selection
- [ ] Add --strategy flag to analyze-permutations.js with interactive fallback
- [ ] Write tests/unit/data-validity.test.ts with UT-PRE-1 (fixture sanity)
- [ ] Write tests/unit/strategies.test.ts with UT-PRE-2, UT-POST-1, UT-POST-2
- [ ] Write tests/e2e/multistrategy.spec.ts with E2E-1 and E2E-2