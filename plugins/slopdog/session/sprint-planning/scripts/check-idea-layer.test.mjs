import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  splitFrontMatter,
  extractOriginalTranscript,
  appendIdeaLayer,
} from './ideation-layer.mjs'

const FIXTURE_ORIGINAL_TRANSCRIPT = `Todd dictated on 2026-10-03:
We need a unified intake pipeline for department ideas.
The team should be able to spin out multiple threads, log questions,
and ensure nothing gets lost or prematurely stamped as a ticket.`

const FIXTURE_IDEA_FILE = `---
id: idea-meta-001
title: Unified Intake Pipeline
department: meta
status: captured
created: 2026-10-03
updated: 2026-10-03
version: 1
layers: []
---

# Unified Intake Pipeline

## Original Transcript

${FIXTURE_ORIGINAL_TRANSCRIPT}
`

test('AC-1: idea-layer appends non-destructive layers with spin-out threads and questions citing shaping-and-delivery.md', () => {
  const originalTranscriptBefore = extractOriginalTranscript(splitFrontMatter(FIXTURE_IDEA_FILE).body)
  assert.equal(originalTranscriptBefore, FIXTURE_ORIGINAL_TRANSCRIPT.trim())

  const layerData = {
    layerNumber: 1,
    layerTitle: 'Spin-out Analysis & Question Formulation',
    what: 'Process raw voice memo into candidate threads.',
    why: 'Prevents premature ticket generation and clarifies department scope.',
    how: 'Obsidian callouts for questions and structured threads.',
    spinOutThreads: [
      { title: 'Intake Hook', description: 'Capture memos automatically into department inbox.' },
      { title: 'Triage Gate', description: 'Weekly sprint planning review.' },
    ],
    openQuestions: [
      {
        id: 'q1',
        title: 'Department Allocation',
        author: 'Todd',
        question: 'Should IT and Meta share a weekly token budget or hold independent quotas?',
      },
    ],
    status: 'layered',
  }

  const updatedContent = appendIdeaLayer(FIXTURE_IDEA_FILE, layerData)

  // 1. Verify front matter tracks state
  const { frontMatter, body } = splitFrontMatter(updatedContent)
  assert.equal(frontMatter.status, 'layered')
  assert.equal(frontMatter.version, 2)
  assert.ok(frontMatter.layers.length > 0)
  assert.ok(frontMatter.layers.some((l) => l.includes('layer-1')))

  // 2. Verify original transcript was NOT modified (strictly identical)
  const originalTranscriptAfter = extractOriginalTranscript(body)
  assert.equal(originalTranscriptAfter, FIXTURE_ORIGINAL_TRANSCRIPT.trim())
  assert.ok(body.includes('## Original Transcript'))

  // 3. Verify spin-out threads and questions were appended
  assert.ok(body.includes('## Layer 1: Spin-out Analysis & Question Formulation'))
  assert.ok(body.includes('### Spin-out Threads'))
  assert.ok(body.includes('Intake Hook'))
  assert.ok(body.includes('Triage Gate'))
  assert.ok(body.includes('### Discussion & Open Questions'))
  assert.ok(body.includes('> [!comment Todd|q1]'))
  assert.ok(body.includes('✍️ **Hey Todd, enter your answer here:**'))

  // 4. Verify canonical reference to ~/slopdog/tasks/projects/shaping-and-delivery.md
  assert.ok(body.includes('~/slopdog/tasks/projects/shaping-and-delivery.md'))
  assert.ok(body.includes('Version History'))
})
