---
title: "How-To: Implement CLI Mode for Cursor-Agent Webapp"
updated: "2025-01-28"
facets:
  type: how-to
  status: draft
  repo:
    path: docs/how-to/implement-cli-mode-webapp.md
  summary:
    human: "Learn how to implement CLI mode for the cursor-agent webapp. Covers XML schema parsing, UI component mapping, and rendering workflow outputs from the Build > Execute Ticket workflow."
    vector: "This how-to document teaches AI agents building the cursor-agent webapp how to implement CLI mode output parsing and rendering. The Broz OS workflow system supports two output modes: app mode (markdown with emoji for Cursor IDE) and cli mode (structured XML for programmatic parsing by webapp GUI). The document uses the Build > Execute Ticket workflow (rules/broz/workflows/build/continue.mdc) as the reference implementation. This workflow executes development tickets through 5 steps: Mode Detection (Step 0), Context Loading & Validation (Step 1), Execution Loop with Plan/Implement/Mark cycle (Step 2), Completion & Verification including tests/build/lint (Step 3), and Handoff to Review status (Step 4). Nine XML output types are defined: StepStatus (<step>) for workflow progress, ProgressUpdate (<progress>) for task/AC tracking, ActionLog (<action-log>) for plan/implement/decision entries, Completion (<completion>) for final handoff, Prompt (<prompt>) for user input requests, Error (<error>) for validation/test/build failures, Thinking (<thinking>) for agent reasoning display, ThinkingStream (<thinking-stream>) for live streaming updates, and Observation (<observation>) for intermediate findings. Key implementation concerns include: extracting <workflow-output> blocks from agent responses, handling streaming vs complete outputs, mapping XML elements to React components (step cards, progress bars, collapsible panels, modals, alerts), and managing workflow state from XML updates. Mode detection uses flags (--mode=cli, [cli]), environment variables (CURSOR_AGENT_CLI=true), or user selection fallback."
tags:
  - doc/howto
  - cli-mode
  - webapp
  - xml-schema
  - cursor-agent
---

## Overview

This guide teaches you how to implement CLI mode parsing and rendering in the cursor-agent webapp. You will learn:

- The dual-mode output system (app vs cli)
- How to parse structured XML outputs from workflows
- How to map XML elements to React UI components
- How to manage workflow state from XML updates

## Prerequisites

- Understanding of Broz OS workflow system
- Familiarity with React component patterns
- Access to the `continue.mdc` workflow as reference

## Introduction: The Two Modes

### The Problem

Broz OS workflows run inside Cursor IDE and produce human-readable outputs (markdown with emoji). But we want to expose these same workflows via a webapp GUI, which requires structured, parseable outputs.

### The Solution: Dual-Mode Output System

Every workflow now supports two output modes:

| Mode | Format | Audience | When Used |
|------|--------|----------|-----------|
| **app** | Markdown + emoji | Human in Cursor IDE | Direct IDE execution |
| **cli** | Structured XML | Webapp rendering engine | cursor-agent CLI execution |

### Why XML?

- **Predictable structure**: Easy to parse programmatically
- **Self-documenting**: Tag names describe content
- **Nested data**: Supports complex hierarchical outputs
- **Validation**: Can be validated against schemas

## The Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User triggers workflow via cursor-agent CLI                 │
│     └─> cursor-agent run "execute ticket TICKET-001 --mode=cli" │
│                                                                 │
│  2. Agent runs workflow, emits XML outputs                      │
│     └─> <workflow-output><step>...</step></workflow-output>     │
│                                                                 │
│  3. Webapp parses XML, renders rich UI components               │
│     └─> StepCard, ProgressBar, ThinkingPanel, etc.              │
│                                                                 │
│  4. User interacts via webapp                                   │
│     └─> Responds to <prompt>, views <thinking>, sees <progress> │
│                                                                 │
│  5. Workflow completes, shows <completion> summary              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Result**: Same workflows, two UX surfaces (IDE and webapp).

## Reference Workflow: Build > Execute Ticket

### Full Path
```
~/.cursor/rules/broz/workflows/build/continue.mdc
```

### What It Does

The **Build > Execute Ticket** workflow is the core development loop. It takes a ticket from start to completion, executing tasks, running tests, and handing off for review.

### Workflow Steps

| Step | Goal | What Happens |
|------|------|--------------|
| **0** | Mode Detection | Detects `app` or `cli` mode from flags/env/prompt |
| **1** | Context Loading & Validation | Checks git status, loads ticket, validates readiness |
| **2** | Execution Loop | Plan → Implement → Mark tasks (repeats until done) |
| **3** | Completion & Verification | Runs tests, build, lint; verifies ACs met |
| **4** | Handoff | Updates ticket to Review, generates summaries |

### Why This Workflow First?

- It's the **core dev loop** (most frequently used)
- **Covers all XML types** (progress, thinking, errors, completion)
- **Good complexity** for testing UI components
- **Clear state transitions** to model in webapp

## Mode Detection

The agent determines which mode to use at Step 0:

### Detection Priority

1. **Explicit flag in prompt**: `--mode=cli` or `[cli]` → cli mode
2. **Explicit flag in prompt**: `--mode=app` or `[app]` → app mode
3. **Environment variable**: `CURSOR_AGENT_CLI=true` → cli mode
4. **Fallback**: Ask user to select

### Example Invocations

```bash
# CLI mode (for webapp)
cursor-agent run "execute ticket TICKET-001 --mode=cli"

# App mode (for IDE)
cursor-agent run "execute ticket TICKET-001 --mode=app"

# Let agent ask
cursor-agent run "execute ticket TICKET-001"
```

## XML Output Types

All CLI mode outputs are wrapped in `<workflow-output>` tags. Nine types are defined:

| Type Name | XML Element | Purpose | When Emitted |
|-----------|-------------|---------|--------------|
| **StepStatus** | `<step>` | Workflow step progress | End of each step |
| **ProgressUpdate** | `<progress>` | Task/AC completion tracking | During Step 2 loop |
| **ActionLog** | `<action-log>` | Plan/implement/decision entries | During implementation |
| **Completion** | `<completion>` | Final handoff summary | End of Step 4 |
| **Prompt** | `<prompt>` | Questions requiring user input | When input needed |
| **Error** | `<error>` | Validation/test/build failures | On failure |
| **Thinking** | `<thinking>` | Agent reasoning (collapsible) | Strategic moments |
| **ThinkingStream** | `<thinking-stream>` | Live reasoning chunks | Long operations |
| **Observation** | `<observation>` | Intermediate findings | During analysis |

## Full XML Schema Reference

### 1. StepStatus

Emitted at the end of each workflow step.

```xml
<workflow-output>
  <step number="1" goal="Context Loading &amp; Validation">
    <status>complete|in_progress|blocked|failed</status>
    <checks>
      <check id="git-status" status="pass|fail">Git status clean</check>
      <check id="ticket-loaded" status="pass|fail">Ticket loaded: TICKET-001</check>
    </checks>
    <message>Human-readable summary</message>
    <next-step number="2" goal="Execution Loop"/>
  </step>
</workflow-output>
```

**Attributes:**
- `number`: Step number (0-4 for continue workflow)
- `goal`: Human-readable step goal
- `status`: Current state (complete, in_progress, blocked, failed)

### 2. ProgressUpdate

Emitted during the execution loop (Step 2) to track task completion.

```xml
<workflow-output>
  <progress>
    <ticket id="TICKET-001">
      <tasks completed="3" total="5"/>
      <acceptance-criteria completed="1" total="3"/>
      <current-task id="task-4">Implement validation logic</current-task>
    </ticket>
  </progress>
</workflow-output>
```

### 3. ActionLog

Emitted when the agent plans, implements, or makes decisions.

```xml
<workflow-output>
  <action-log>
    <entry type="plan|implement|decision|bug|ambiguity" timestamp="2025-01-28T10:30:00Z">
      <description>What happened</description>
      <files>
        <file path="src/components/Form.tsx" action="modified"/>
        <file path="src/utils/validation.ts" action="created"/>
      </files>
    </entry>
  </action-log>
</workflow-output>
```

**Entry types:**
- `plan`: Agent's implementation plan for a task
- `implement`: Code changes made
- `decision`: Non-obvious choice with rationale
- `bug`: Bug discovered during implementation
- `ambiguity`: Spec ambiguity encountered

### 4. Completion

Emitted at the end of the workflow (Step 4).

```xml
<workflow-output>
  <completion>
    <ticket id="TICKET-001" status="review">
      <progress percent="100"/>
      <tests status="pass">
        <unit status="pass" command="npm run test"/>
        <e2e status="pass" command="npm run e2e"/>
      </tests>
      <build status="pass"/>
      <lint status="pass"/>
      <summary>
        <po-summary>Added form validation with email and required field checks</po-summary>
        <tech-summary>Used existing validation utils, added error state to form component</tech-summary>
      </summary>
      <files-changed count="3">
        <file path="src/components/Form.tsx"/>
        <file path="src/components/Form.test.tsx"/>
        <file path="src/utils/validation.ts"/>
      </files-changed>
      <ready-for>Code Review</ready-for>
    </ticket>
  </completion>
</workflow-output>
```

### 5. Prompt

Emitted when user input is required.

```xml
<workflow-output>
  <prompt type="confirmation|selection|input">
    <question>Select output mode for this workflow</question>
    <options>
      <option id="app" label="App Mode - Cursor IDE"/>
      <option id="cli" label="CLI Mode - Webapp"/>
    </options>
    <default>app</default>
  </prompt>
</workflow-output>
```

**Prompt types:**
- `confirmation`: Yes/No question
- `selection`: Choose from options
- `input`: Free-form text input

### 6. Error

Emitted when validation, tests, or build fails.

```xml
<workflow-output>
  <error type="validation|git|test|build">
    <message>Tests failed - cannot complete ticket</message>
    <action>Fix regressions before proceeding</action>
    <halt>true|false</halt>
    <details>
      <unit status="fail" output="Expected 3, received 2"/>
      <e2e status="pass"/>
    </details>
  </error>
</workflow-output>
```

**Error types:**
- `validation`: Ticket/mode validation failed
- `git`: Git status not clean
- `test`: Unit or E2E tests failed
- `build`: Build or lint failed

### 7. Thinking

Emitted to expose agent reasoning (for collapsible UI panels).

```xml
<workflow-output>
  <thinking step="2" phase="planning|analyzing|implementing|verifying">
    <context>What the agent is looking at</context>
    <reasoning>Chain of thought / analysis</reasoning>
    <hypothesis>What the agent believes or is testing</hypothesis>
    <decision>Conclusion reached (if any)</decision>
    <next-action>What the agent will do next</next-action>
  </thinking>
</workflow-output>
```

**Phases:**
- `planning`: Reading task, determining approach
- `analyzing`: Examining code, understanding context
- `implementing`: Writing/editing code
- `verifying`: Running tests, checking results

### 8. ThinkingStream

Emitted for live updates during long operations.

```xml
<workflow-output>
  <thinking-stream step="2" phase="analyzing">
    <chunk seq="1">Reading ticket requirements...</chunk>
    <chunk seq="2">Found 3 unchecked tasks...</chunk>
    <chunk seq="3">First task maps to AC-1...</chunk>
  </thinking-stream>
</workflow-output>
```

### 9. Observation

Emitted for intermediate findings during analysis.

```xml
<workflow-output>
  <observation type="code|test|file|dependency">
    <target>src/components/Form.tsx:45-60</target>
    <finding>handleSubmit has no input validation</finding>
    <relevance>high|medium|low</relevance>
    <affects>Task 1 (AC: AC-1)</affects>
  </observation>
</workflow-output>
```

## Parsing Strategy

### Extracting `<workflow-output>` Blocks

Agent responses may contain multiple XML blocks mixed with other text. Extract all `<workflow-output>` blocks:

```typescript
function extractWorkflowOutputs(response: string): string[] {
  const regex = /<workflow-output>[\s\S]*?<\/workflow-output>/g;
  return response.match(regex) || [];
}
```

### Parsing XML to Objects

Use a DOM parser or XML library:

```typescript
function parseWorkflowOutput(xml: string): WorkflowOutput {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const root = doc.querySelector('workflow-output');
  
  // Determine type from first child element
  const firstChild = root?.firstElementChild;
  const type = firstChild?.tagName; // 'step', 'progress', 'thinking', etc.
  
  return { type, element: firstChild };
}
```

### Handling Streaming vs Complete

- **Complete outputs**: Parse and render immediately
- **Streaming (`<thinking-stream>`)**: Append chunks to existing panel, update on each `<chunk>`

## UI Component Mapping

Map each XML type to a React component:

| XML Type | React Component | UI Pattern |
|----------|-----------------|------------|
| `<step>` | `<StepCard>` | Progress card with checks |
| `<progress>` | `<ProgressPanel>` | Progress bars for tasks/ACs |
| `<action-log>` | `<ActionLogEntry>` | Timeline entry with files |
| `<completion>` | `<CompletionSummary>` | Success card with details |
| `<prompt>` | `<PromptModal>` | Modal with form inputs |
| `<error>` | `<ErrorAlert>` | Alert banner (red/blocking) |
| `<thinking>` | `<ThinkingPanel>` | Collapsible reasoning panel |
| `<thinking-stream>` | `<ThinkingPanel>` | Same, with streaming append |
| `<observation>` | `<ObservationCard>` | Info card (code reference) |

### State Management

Track workflow state from XML updates:

```typescript
interface WorkflowState {
  currentStep: number;
  stepStatus: 'in_progress' | 'complete' | 'blocked' | 'failed';
  tasks: { completed: number; total: number };
  acceptanceCriteria: { completed: number; total: number };
  thinkingPanels: ThinkingEntry[];
  actionLog: ActionEntry[];
  errors: ErrorEntry[];
  pendingPrompt: PromptData | null;
}
```

Update state as XML outputs arrive:

```typescript
function updateState(state: WorkflowState, output: WorkflowOutput): WorkflowState {
  switch (output.type) {
    case 'step':
      return { ...state, currentStep: output.number, stepStatus: output.status };
    case 'progress':
      return { ...state, tasks: output.tasks, acceptanceCriteria: output.acs };
    case 'thinking':
      return { ...state, thinkingPanels: [...state.thinkingPanels, output] };
    case 'prompt':
      return { ...state, pendingPrompt: output };
    case 'error':
      return { ...state, errors: [...state.errors, output] };
    // ... etc
  }
}
```

## Example: Full continue.mdc Execution

### Step 0: Mode Detection

```xml
<workflow-output>
  <step number="0" goal="Mode Detection">
    <status>complete</status>
    <checks>
      <check id="mode-detected" status="pass">Output mode: cli</check>
    </checks>
    <next-step number="1" goal="Context Loading &amp; Validation"/>
  </step>
</workflow-output>
```

### Step 1: Context Loading

```xml
<workflow-output>
  <step number="1" goal="Context Loading &amp; Validation">
    <status>complete</status>
    <checks>
      <check id="git-status" status="pass">Git status clean</check>
      <check id="ticket-loaded" status="pass">Ticket loaded: TICKET-001</check>
      <check id="ticket-validated" status="pass">Ticket validated for execution</check>
    </checks>
    <message>Context loaded and validated successfully</message>
    <next-step number="2" goal="Execution Loop"/>
  </step>
</workflow-output>
```

### Step 2: Execution Loop (multiple outputs)

**Thinking:**
```xml
<workflow-output>
  <thinking step="2" phase="planning">
    <context>Reading task: "Add input validation to form"</context>
    <reasoning>Need to check existing validation patterns in codebase</reasoning>
    <hypothesis>Can reuse validation utils from src/utils/</hypothesis>
    <next-action>Read Form component and validation utils</next-action>
  </thinking>
</workflow-output>
```

**Progress:**
```xml
<workflow-output>
  <progress>
    <ticket id="TICKET-001">
      <tasks completed="1" total="3"/>
      <acceptance-criteria completed="0" total="2"/>
      <current-task id="task-2">Add error display to form</current-task>
    </ticket>
  </progress>
</workflow-output>
```

### Step 3: Verification

```xml
<workflow-output>
  <step number="3" goal="Completion &amp; Verification">
    <status>complete</status>
    <checks>
      <check id="acs-met" status="pass">All acceptance criteria met</check>
      <check id="tests-unit" status="pass">Unit tests passed</check>
      <check id="tests-e2e" status="pass">E2E tests passed</check>
      <check id="build" status="pass">Build successful</check>
      <check id="lint" status="pass">Lint clean</check>
    </checks>
    <next-step number="4" goal="Handoff"/>
  </step>
</workflow-output>
```

### Step 4: Completion

```xml
<workflow-output>
  <completion>
    <ticket id="TICKET-001" status="review">
      <progress percent="100"/>
      <tests status="pass">
        <unit status="pass" command="npm run test"/>
        <e2e status="pass" command="npm run e2e"/>
      </tests>
      <build status="pass"/>
      <lint status="pass"/>
      <summary>
        <po-summary>Form now validates email and required fields before submission</po-summary>
        <tech-summary>Added validation call in handleSubmit, error state display</tech-summary>
      </summary>
      <files-changed count="2">
        <file path="src/components/Form.tsx"/>
        <file path="src/components/Form.test.tsx"/>
      </files-changed>
      <ready-for>Code Review</ready-for>
    </ticket>
  </completion>
</workflow-output>
```

## Verification

You've successfully implemented CLI mode when:

- [ ] All 9 XML types are parsed correctly
- [ ] Each XML type renders to its mapped UI component
- [ ] Workflow state updates correctly as outputs arrive
- [ ] `<prompt>` renders input modal and captures response
- [ ] `<error>` with `halt=true` blocks workflow progression
- [ ] `<thinking-stream>` chunks append to panel in real-time
- [ ] Full workflow execution from Step 0→4 renders correctly

## See Also

- [Build > Execute Ticket Workflow](~/.cursor/rules/broz/workflows/build/continue.mdc) - Reference implementation with dual-mode outputs
- [Broz OS Architecture](~/.cursor/docs/how-to/broz-os-architecture.md) - Overall system architecture
- [Docs Metadata Spec](~/.cursor/templates/docs-metadata-spec.md) - Front-matter standards
