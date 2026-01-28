---
name: Modular Intrabar Fill Policy
overview: Implement a modular, pure-function intrabar fill policy helper library using directional path heuristics (Policy 2) with comprehensive, verbosely documented permutation matrix testing. This library will be imported by strategies (like strategy12.8) to resolve fill ambiguity when multiple events could occur within a single candle.
todos:
  - id: create-file-structure
    content: Create src/lib/intrabar/directional.ts with type definitions including verbose documentation fields (pathExplanation, whyThisOutcome)
    status: completed
  - id: implement-helpers
    content: Implement selectPath() and crossesLevel() helper functions with edge cases
    status: completed
  - id: implement-main-resolution
    content: Implement resolveIntrabarDirectional() main orchestration logic following algorithm
    status: completed
  - id: create-verbose-permutation-matrix
    content: Build getDirectionalIntrabarPermutationSpecs() with 40+ explicit, verbosely documented test cases (each with detailed pathExplanation and whyThisOutcome)
    status: completed
  - id: add-comprehensive-jsdoc
    content: Add complete JSDoc to all exported functions with usage examples for strategies
    status: completed
  - id: create-verbose-tests
    content: Create comprehensive test suite in __tests__/directional.test.ts with verbose console logging for each permutation
    status: completed
---

# Modular Intrabar Fill Policy Implementation

## Overview

Create a single, comprehensive intrabar resolution helper library that strategies can import to resolve fill ambiguity using directional path heuristics. This library will be used by strategy implementations like `strategy12.8` when a candle's range contains multiple relevant price levels (entry trigger, stop, target).

## Architecture & Integration

### Single File: `src/lib/intrabar/directional.ts`

All intrabar logic consolidated into one importable file containing:

1. Type definitions
2. Helper functions (path selection, crossing detection)
3. Main resolution function
4. **Verbosely documented explicit permutation matrix for testing**
5. Comprehensive JSDoc

### Usage by Strategies

Strategies will import and use this helper module like:

```typescript
// In strategy12dot8.ts or similar
import { resolveIntrabarDirectional } from '@/lib/intrabar/directional';

// Inside strategy logic, when checking a candle for entry/exit:
const resolution = resolveIntrabarDirectional({
  candle: { O: candle.open, H: candle.high, L: candle.low, C: candle.close, V: candle.volume },
  side: direction, // 'long' or 'short'
  entryLevel: triggerPrice,
  stopLevel: slPrice,
  targetLevel: tpPrice,
  neutralPathChoice: 'red' // optional
});

// Then use resolution to determine what happened:
if (resolution.event === 'NO_FILL') {
  // Skip this candle, no entry
} else if (resolution.event === 'FILL_STOP_SAME_BAR') {
  // Entry and exit on same candle
  const entryPrice = resolution.entryFill;
  const exitPrice = resolution.exitFill;
  // Generate Open and Close rows
} else if (resolution.event === 'FILL_AND_SURVIVE') {
  // Entry only, continue scanning for exit
  const entryPrice = resolution.entryFill;
  // Generate Open row, keep scanning
}
```

This replaces the current hardcoded logic in strategy12.8 lines 522-534 where it handles ambiguous cases by simply choosing "SL wins".

## Core API Design

```typescript
// Main entry point - pure, deterministic
export function resolveIntrabarDirectional(params: IntrabarParams): IntrabarResolution

// Permutation specs for testing
export function getDirectionalIntrabarPermutationSpecs(): PermutationSpec[]

// Helper functions (exported for testing but can be used standalone)
export function selectPath(O, H, L, C, neutralChoice?): PathSegment[]
export function crossesLevel(from, to, level): CrossingResult
```

### Type Definitions (in same file)

```typescript
export type IntrabarParams = {
  candle: { O: number, H: number, L: number, C: number, V: number }
  side: 'long' | 'short'
  entryLevel: number      // The trigger price that opens position
  stopLevel: number       // Stop-loss price (only active after entry)
  targetLevel?: number    // Take-profit price (optional, only active after entry)
  neutralPathChoice?: 'green' | 'red'  // default: 'red'
}

export type IntrabarResolution = {
  event: 'NO_FILL' | 'FILL_ONLY' | 'FILL_STOP_SAME_BAR' | 
         'FILL_TARGET_SAME_BAR' | 'FILL_AND_SURVIVE'
  entryFill?: number      // Entry price if filled (trigger ± slippage)
  exitFill?: number       // Exit price if exited same bar
  exitReason?: 'SL' | 'TP'
  metadata: {
    assumedPath: string   // e.g., "O→L→H→C"
    entryPathIndex?: number
    exitPathIndex?: number
  }
}

export type PermutationSpec = {
  id: string
  description: string
  
  // VERBOSE documentation for each permutation
  pathExplanation: string  // Detailed explanation of path traversal
  whyThisOutcome: string   // Why this expected outcome occurs
  
  inputs: {
    candle: { O: number, H: number, L: number, C: number }
    side: 'long' | 'short'
    entryLevel: number
    stopLevel: number
    targetLevel?: number
    neutralPathChoice?: 'green' | 'red'
  }
  expected: {
    event: IntrabarResolution['event']
    entryFill?: number
    exitFill?: number
    exitReason?: 'SL' | 'TP'
    assumedPath: string
  }
}

type PathSegment = { from: number, to: number, label: string }
type CrossingResult = { crossed: boolean, crossPoint?: number }
```

## Verbose Permutation Matrix Documentation

Each permutation spec must include:

1. **id**: Unique stable identifier (e.g., "green-long-entry-blocked-by-stop")
2. **description**: One-line summary
3. **pathExplanation**: Multi-line detailed explanation of how price traverses the path and where each level is crossed
4. **whyThisOutcome**: Explanation of why the expected outcome occurs based on the rules
5. **inputs**: All input parameters
6. **expected**: All expected output values

Example permutation spec:

```typescript
{
  id: 'green-long-entry-blocked-by-stop',
  description: 'Long entry and stop both reachable, but stop hit first on path blocks entry',
  pathExplanation: `
    Candle: O=100, H=110, L=90, C=108 (GREEN, C > O)
    Path: O(100) → L(90) → H(110) → C(108)
    
    Entry level: 105
    - Would be crossed between L(90) and H(110) at path index 1
    
    Stop level: 95
    - Crossed between O(100) and L(90) at path index 0
    
    Path ordering: Stop index 0 < Entry index 1
  `,
  whyThisOutcome: `
    NO_FILL occurs because:
    1. Stop level (95) is crossed at path segment 0 (O→L)
    2. Entry level (105) is crossed at path segment 1 (L→H)
    3. Stop occurs BEFORE entry on the assumed path
    4. Since stop is only active AFTER entry, this means entry never happens
    5. The trader's entry order never fills on this candle
  `,
  inputs: {
    candle: { O: 100, H: 110, L: 90, C: 108 },
    side: 'long',
    entryLevel: 105,
    stopLevel: 95,
    targetLevel: 130,
  },
  expected: {
    event: 'NO_FILL',
    assumedPath: 'O→L→H→C',
  }
}
```

## Permutation Matrix Coverage

Must include at least 40-50 permutations covering:

### Long Side - Green Candles (10-12 cases)

1. Entry not in range [L,H] → NO_FILL
2. Entry in range, no exits reachable → FILL_AND_SURVIVE
3. Entry + Stop both reachable, stop first on path → NO_FILL
4. Entry + Stop both reachable, entry first → FILL_STOP_SAME_BAR
5. Entry + Target only → FILL_TARGET_SAME_BAR
6. Entry + both exits, stop wins → FILL_STOP_SAME_BAR
7. Edge: Entry == O
8. Edge: Entry == L
9. Edge: Entry == H
10. Edge: Stop == Entry
11. Edge: Target == Entry

### Long Side - Red Candles (8-10 cases)

Similar structure but with O→H→L→C path

### Short Side - Green Candles (8-10 cases)

Mirror of long logic with inverted levels

### Short Side - Red Candles (8-10 cases)

Mirror of long logic with O→H→L→C path

### Neutral Candles (6-8 cases)

Both long and short with explicit path choice showing how outcome changes

Each permutation includes verbose pathExplanation and whyThisOutcome.

## Test File Structure

Create `src/lib/intrabar/__tests__/directional.test.ts` with verbose output:

```typescript
import { describe, it, expect } from 'vitest';
import {
  resolveIntrabarDirectional,
  getDirectionalIntrabarPermutationSpecs,
  selectPath,
  crossesLevel,
} from '../directional';

describe('Intrabar Directional Policy', () => {
  
  describe('Helper Functions', () => {
    describe('selectPath()', () => {
      it('selects green path (O→L→H→C) when C > O', () => {
        const path = selectPath(100, 110, 95, 108);
        expect(path).toHaveLength(3);
        expect(path[0]).toEqual({ from: 100, to: 95, label: 'O→L' });
        expect(path[1]).toEqual({ from: 95, to: 110, label: 'L→H' });
        expect(path[2]).toEqual({ from: 110, to: 108, label: 'H→C' });
      });

      it('selects red path (O→H→L→C) when C < O', () => {
        const path = selectPath(100, 110, 95, 96);
        expect(path).toHaveLength(3);
        expect(path[0]).toEqual({ from: 100, to: 110, label: 'O→H' });
        expect(path[1]).toEqual({ from: 110, to: 95, label: 'H→L' });
        expect(path[2]).toEqual({ from: 95, to: 96, label: 'L→C' });
      });

      it('uses red path by default for neutral candle (C == O)', () => {
        const path = selectPath(100, 110, 95, 100);
        expect(path[0].label).toBe('O→H');
      });

      it('respects neutralPathChoice parameter for neutral candles', () => {
        const path = selectPath(100, 110, 95, 100, 'green');
        expect(path[0].label).toBe('O→L');
      });
    });

    describe('crossesLevel()', () => {
      it('detects crossing in ascending segment', () => {
        const result = crossesLevel(100, 110, 105);
        expect(result.crossed).toBe(true);
        expect(result.crossPoint).toBe(105);
      });

      it('detects crossing in descending segment', () => {
        const result = crossesLevel(110, 100, 105);
        expect(result.crossed).toBe(true);
        expect(result.crossPoint).toBe(105);
      });

      it('treats touch (level == endpoint) as crossing', () => {
        expect(crossesLevel(100, 110, 100).crossed).toBe(true);
        expect(crossesLevel(100, 110, 110).crossed).toBe(true);
      });

      it('returns not crossed when level outside segment', () => {
        expect(crossesLevel(100, 110, 95).crossed).toBe(false);
        expect(crossesLevel(100, 110, 115).crossed).toBe(false);
      });
    });
  });

  describe('Permutation Matrix - Comprehensive Coverage', () => {
    const specs = getDirectionalIntrabarPermutationSpecs();

    it('provides at least 40 permutation specs', () => {
      expect(specs.length).toBeGreaterThanOrEqual(40);
    });

    it('covers all event types', () => {
      const events = new Set(specs.map(s => s.expected.event));
      expect(events.has('NO_FILL')).toBe(true);
      expect(events.has('FILL_AND_SURVIVE')).toBe(true);
      expect(events.has('FILL_STOP_SAME_BAR')).toBe(true);
      expect(events.has('FILL_TARGET_SAME_BAR')).toBe(true);
    });

    it('covers both long and short sides', () => {
      const hasLong = specs.some(s => s.inputs.side === 'long');
      const hasShort = specs.some(s => s.inputs.side === 'short');
      expect(hasLong).toBe(true);
      expect(hasShort).toBe(true);
    });

    it('covers green, red, and neutral candles', () => {
      const candleTypes = specs.map(s => {
        const { O, C } = s.inputs.candle;
        return C > O ? 'green' : C < O ? 'red' : 'neutral';
      });
      expect(candleTypes.includes('green')).toBe(true);
      expect(candleTypes.includes('red')).toBe(true);
      expect(candleTypes.includes('neutral')).toBe(true);
    });

    // Run each permutation as a test
    specs.forEach(spec => {
      describe(`${spec.id}`, () => {
        it(`${spec.description}`, () => {
          // Log verbose documentation for test output
          console.log('\n' + '='.repeat(70));
          console.log(`TEST: ${spec.id}`);
          console.log('='.repeat(70));
          console.log(`\nDescription: ${spec.description}`);
          console.log(`\nPath Explanation:\n${spec.pathExplanation}`);
          console.log(`\nWhy This Outcome:\n${spec.whyThisOutcome}`);
          console.log('='.repeat(70) + '\n');

          const result = resolveIntrabarDirectional({
            candle: { ...spec.inputs.candle, V: 1000 },
            side: spec.inputs.side,
            entryLevel: spec.inputs.entryLevel,
            stopLevel: spec.inputs.stopLevel,
            targetLevel: spec.inputs.targetLevel,
            neutralPathChoice: spec.inputs.neutralPathChoice,
          });

          // Verbose assertions with helpful error messages
          expect(result.event).toBe(spec.expected.event);
          
          if (spec.expected.entryFill !== undefined) {
            expect(result.entryFill).toBe(spec.expected.entryFill);
          }
          
          if (spec.expected.exitFill !== undefined) {
            expect(result.exitFill).toBe(spec.expected.exitFill);
          }
          
          if (spec.expected.exitReason) {
            expect(result.exitReason).toBe(spec.expected.exitReason);
          }

          expect(result.metadata.assumedPath).toContain(
            spec.expected.assumedPath.includes('→') ? '→' : '-'
          );
        });
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles entry level exactly at open', () => {
      const result = resolveIntrabarDirectional({
        candle: { O: 100, H: 110, L: 95, C: 108, V: 1000 },
        side: 'long',
        entryLevel: 100,  // Exactly at open
        stopLevel: 90,
        targetLevel: 130,
      });
      expect(result.event).not.toBe('NO_FILL');
    });

    it('handles stop level exactly at entry level', () => {
      const result = resolveIntrabarDirectional({
        candle: { O: 100, H: 110, L: 90, C: 108, V: 1000 },
        side: 'long',
        entryLevel: 105,
        stopLevel: 105,  // Same as entry
        targetLevel: 130,
      });
      // Should have defined behavior per spec
      expect(['NO_FILL', 'FILL_STOP_SAME_BAR']).toContain(result.event);
    });

    it('handles very wide range candle with all levels reachable', () => {
      const result = resolveIntrabarDirectional({
        candle: { O: 100, H: 150, L: 50, C: 140, V: 1000 },
        side: 'long',
        entryLevel: 105,
        stopLevel: 95,
        targetLevel: 130,
      });
      // Stop should win on green path (O→L→H→C)
      expect(result.event).toBe('FILL_STOP_SAME_BAR');
    });
  });
});
```

## Implementation Steps

### 1. Create File with Structure

Create `src/lib/intrabar/directional.ts` with:

- Type definitions (including verbose `pathExplanation` and `whyThisOutcome` fields)
- Path selection helper
- Crossing detection helper
- Main resolution function
- Empty permutation matrix (to be filled)

### 2. Implement Helper Functions

Complete `selectPath()` and `crossesLevel()` with proper logic and edge case handling.

### 3. Implement Main Resolution

Complete `resolveIntrabarDirectional()` following the algorithm outlined in JSDoc.

### 4. Build Verbose Permutation Matrix

Populate `getDirectionalIntrabarPermutationSpecs()` with 40-50 explicit test cases, each including:

- Clear description
- Detailed pathExplanation
- Clear whyThisOutcome explanation
- All input and expected values

### 5. Create Test File with Verbose Output

Create comprehensive test suite that:

- Tests helpers individually
- Logs verbose documentation for each permutation test
- Validates each case with clear assertions
- Ensures complete coverage

### 6. Document Integration Pattern

Add comments showing how strategies should import and use this module.

## File Changes Summary

**New files to create:**

- `src/lib/intrabar/directional.ts` - Single comprehensive intrabar helper module (~600-900 lines including verbose permutation matrix)
- `src/lib/intrabar/__tests__/directional.test.ts` - Comprehensive test suite with verbose logging

**Files to update (future integration):**

- `src/lib/backtest/strategies/strategy12dot8.ts` - Import and use `resolveIntrabarDirectional()` helper

## Key Design Principles

1. **Single File**: All logic in one place for easy import by strategies
2. **Helper Module**: Designed to be called by strategy implementations
3. **Verbose Documentation**: Every permutation explained in detail
4. **Pure Functions**: No side effects, state, or I/O
5. **Deterministic**: Same inputs → same outputs
6. **Self-Documenting**: Types, JSDoc, and detailed permutation specs tell complete story
7. **Test Transparency**: Tests log verbose explanations for understanding

## Acceptance Criteria

- [x] Single file `directional.ts` contains all intrabar logic
- [x] Can be imported by strategies: `import { resolveIntrabarDirectional } from '@/lib/intrabar/directional'`
- [x] `resolveIntrabarDirectional()` handles all permutation specs correctly
- [x] `getDirectionalIntrabarPermutationSpecs()` provides 40+ explicit test cases
- [x] **Every permutation spec includes verbose `pathExplanation` and `whyThisOutcome`**
- [x] **Tests log detailed explanations during execution**
- [x] Comprehensive JSDoc on all exports
- [x] All tests pass
- [x] Zero coupling to strategy state or stores
- [x] Ready for integration into strategy12.8 and future strategies