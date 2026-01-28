---
name: Extract Slippage Module
overview: Create a new `calculatePrice` module to centralize slippage calculations across all strategies, replacing inline slippage logic with dedicated functions for entry, take profit, and stop loss scenarios.
todos:
  - id: create-module
    content: Create src/lib/backtest/calculatePrice.ts with three slippage functions
    status: completed
  - id: update-strategy12dot8
    content: Update strategy12dot8.ts to use new slippage functions
    status: completed
  - id: update-strategy12dot7
    content: Update strategy12dot7.ts to use new slippage functions
    status: completed
  - id: update-935startchangeC
    content: Update 935startchangeC.ts to use new slippage functions
    status: completed
  - id: update-935startanddrag
    content: Update 935startanddrag.ts to use new slippage functions
    status: completed
  - id: update-935startchange
    content: Update 935startchange.ts to use new slippage functions
    status: completed
  - id: update-sldrag
    content: Update sldrag.ts to use new slippage functions
    status: completed
  - id: update-easy-peasy
    content: Update easy-peasy-original.ts to use new slippage functions
    status: completed
---

# Extract Slippage Calculations to New Module

## Current State

All 7 strategy files currently have inline slippage calculations scattered throughout:

**Entry slippage** (appears in all strategies):

```typescript
const entrySlippage = direction === "long" ? 1 : -1;
const entryPrice = direction === "long" ? longTrigger + 1 : shortTrigger - 1;
```

**Exit slippage** (appears in all strategies):

```typescript
// For PT Hit
exitSlippage = direction === "long" ? -1 : 1;
exitPrice = direction === "long" ? tpPrice - 1 : tpPrice + 1;

// For SL Hit  
exitSlippage = direction === "long" ? -1 : 1;
exitPrice = direction === "long" ? slPrice - 1 : slPrice + 1;

// For EOD Push
exitSlippage = 0;
exitPrice = entryPrice;
```

## Target Architecture

Create new module at `src/lib/backtest/calculatePrice.ts` with three functions:

1. **`calculateEntrySlippage(direction: "long" | "short"): number`**

   - Returns: `1` (always against us)

2. **`calculateTpSlippage(direction: "long" | "short"): number`**

   - Returns: `0` (no slippage on TP)

3. **`calculateSlSlippage(direction: "long" | "short"): number`**

   - Returns: `0` (no slippage on SL)

## Implementation Plan

### 1. Create New Module

Create `src/lib/backtest/calculatePrice.ts`:

- **Extensive file header documentation** explaining:
  - What slippage is in trading context
  - Why we calculate it separately
  - How this module fits into the backtest system
  - Examples of how slippage affects P&L
  - Module architecture and design decisions
  - Future extensibility considerations
- **Three slippage calculation functions** with verbose JSDoc:
  - `calculateEntrySlippage()` - Entry order slippage (always 1 point against us)
  - `calculateTpSlippage()` - Take profit slippage (always 0, no slippage)
  - `calculateSlSlippage()` - Stop loss slippage (always 0, no slippage)
- Each function includes:
  - Detailed parameter descriptions
  - Return value explanation with examples
  - Trading context and rationale
  - Code examples showing usage in strategies
  - Notes on why these values were chosen

### 2. Create Comprehensive Test Suite

Create `src/lib/backtest/__tests__/calculatePrice.test.ts`:

- **File header** explaining:
  - What we're testing and why
  - How Jest/Vitest works (test structure, assertions, etc.)
  - How to run tests (`npm test`)
  - How to read test output
- **Full permutation test coverage**:
  - Entry slippage: test both "long" and "short" directions
  - TP slippage: test both "long" and "short" directions
  - SL slippage: test both "long" and "short" directions
  - Edge cases: invalid inputs, type checking
- **Each test includes**:
  - Verbose description explaining what scenario is being tested
  - Comments explaining each assertion
  - Expected vs actual value documentation
  - Why this test matters for correctness
- **Educational comments** throughout:
  - Explain `describe()` blocks (test grouping)
  - Explain `it()` or `test()` blocks (individual tests)
  - Explain `expect()` assertions (what they verify)
  - Explain test organization best practices

### 2. Update All Strategy Files

For each of the 7 strategy files in `src/lib/backtest/strategies/`:

- `strategy12dot8.ts` (production)
- `strategy12dot7.ts` (production)
- `935startchangeC.ts`
- `935startanddrag.ts`
- `935startchange.ts`
- `sldrag.ts`
- `easy-peasy-original.ts`

**Changes per file:**

1. Import the new functions at the top
2. Replace entry slippage calculation with `calculateEntrySlippage(direction)`
3. Replace TP exit slippage with `calculateTpSlippage(direction)`
4. Replace SL exit slippage with `calculateSlSlippage(direction)`
5. Keep EOD Push slippage as `0` (no change needed, already hardcoded)

### 3. Key Locations in Each Strategy

**Entry calculation** (around line 112-115 in most files, 335-337 in strategy12dot7, 445-447 in strategy12dot8):

```typescript
// OLD:
const entrySlippage = direction === "long" ? 1 : -1;

// NEW:
const entrySlippage = calculateEntrySlippage(direction);
```

**Exit calculation - PT Hit** (around line 182-183 in most files, 427-428 in strategy12dot7, 546-547 in strategy12dot8):

```typescript
// OLD:
exitSlippage = direction === "long" ? -1 : 1;

// NEW:
exitSlippage = calculateTpSlippage(direction);
```

**Exit calculation - SL Hit** (around line 184-185 in most files, 429-430 in strategy12dot7, 548-549 in strategy12dot8):

```typescript
// OLD:
exitSlippage = direction === "long" ? -1 : 1;

// NEW:
exitSlippage = calculateSlSlippage(direction);
```

**Exit calculation - Forced 9:35 Close** (only in strategy12dot7 and strategy12dot8):

```typescript
// OLD:
exitSlippage = direction === "long" ? -1 : 1;

// NEW:
exitSlippage = calculateSlSlippage(direction); // Treat forced close like SL
```

## Benefits

1. **Centralized Logic**: All slippage calculations in one place
2. **Easy Updates**: Future slippage model changes only require updating the module
3. **Consistency**: All strategies use identical slippage calculations
4. **Testability**: Slippage logic can be unit tested independently
5. **Documentation**: Clear explanation of slippage model in one location

## Notes

- The new functions initially return simple hardcoded values as specified
- EOD Push slippage remains `0` (hardcoded in strategies, no function needed)
- Price calculations remain in strategies (only slippage values are extracted)
- No changes to test files needed initially (behavior remains identical)