#!/usr/bin/env node
/**
 * @inputs A department's unhandled intake ideas.
 * @outputs The same idea files with processing state in their front matter and appended layers of spin-out threads and open questions.
 * @starts Sprint planning step 1 runs on the picked ideas.
 * @ends Every picked idea carries a new versioned layer and status layered, with nothing earlier overwritten.
 */
// Step 1: Ideation & Layered Threads
// Processes unhandled ideas per department into markdown files with front matter
// tracking processing status, and appends non-destructive layers (spin-out threads
// and open questions with reply slots) following the project-shaper design pattern
// drafted from ~/slopdog/tasks/projects/shaping-and-delivery.md.
import fs, { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CANONICAL_EXAMPLE = '~/slopdog/tasks/projects/shaping-and-delivery.md'

export function splitFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { frontMatter: {}, rawFm: '', body: content }
  }
  const rawFm = match[1]
  const body = match[2]
  const frontMatter = parseYamlSimple(rawFm)
  return { frontMatter, rawFm, body }
}

export function parseYamlSimple(raw) {
  const result = {}
  const lines = raw.split('\n')
  let currentKey = null
  let currentArray = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed.startsWith('- ') && currentArray !== null) {
      currentArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ''))
      continue
    }

    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (kv) {
      const key = kv[1]
      const val = kv[2].trim()
      if (val === '' || val === '[]') {
        currentKey = key
        currentArray = []
        result[key] = currentArray
      } else if (val.startsWith('[') && val.endsWith(']')) {
        const items = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        result[key] = items
        currentKey = key
        currentArray = null
      } else {
        if (/^\d+$/.test(val)) {
          result[key] = parseInt(val, 10)
        } else if (val === 'true' || val === 'false') {
          result[key] = val === 'true'
        } else {
          result[key] = val.replace(/^["']|["']$/g, '')
        }
        currentKey = key
        currentArray = null
      }
    }
  }
  return result
}

export function serializeFrontMatter(fm) {
  const lines = ['---']
  for (const [key, val] of Object.entries(fm)) {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`)
      } else {
        lines.push(`${key}:`)
        for (const item of val) {
          lines.push(`  - ${typeof item === 'string' ? item : JSON.stringify(item)}`)
        }
      }
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      lines.push(`${key}: ${val}`)
    } else {
      lines.push(`${key}: "${val}"`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

export function extractOriginalTranscript(body) {
  const match = body.match(/## Original Transcript\r?\n([\s\S]*?)(?=\r?\n## Layer|\r?\n## Spin-out|$)/)
  if (match) {
    return match[1].trim()
  }
  return null
}

export function buildLayerContent({
  layerNumber = 1,
  layerTitle = 'Spin-out Threads & Open Decisions',
  timestamp = new Date().toISOString(),
  date = new Date().toISOString().split('T')[0],
  what = 'Structured exploration of the raw idea thread.',
  why = 'Disentangle multi-faceted ideas without mutating the initial input.',
  how = 'Append layered sections with callouts and question reply slots.',
  spinOutThreads = [],
  openQuestions = [],
  status = 'layered',
}) {
  const threadsText = spinOutThreads.length > 0
    ? spinOutThreads.map((t, idx) => `- **Thread ${idx + 1} (${t.title || 'Untitled'}):** ${t.description || ''}`).join('\n')
    : '- **Thread 1 (Core Capability):** Primary feature extraction from transcript.'

  let questionsText = ''
  if (openQuestions.length > 0) {
    questionsText = openQuestions.map((q, idx) => {
      const qid = q.id || `q${idx + 1}`
      return `> [!comment ${q.author || 'Todd'}|${qid}]
> **${q.title || 'Open Decision'}:** ${q.question}
> 
> > [!reply Owner|${qid}-r1]
> > ✍️ **Hey ${q.author || 'Todd'}, enter your answer here:** `
    }).join('\n\n')
  } else {
    questionsText = `> [!comment Todd|q1]
> **Scope Confirmation:** Does this thread align with the department weekly allowance?
> 
> > [!reply Owner|q1-r1]
> > ✍️ **Hey Todd, enter your answer here:** `
  }

  return `
## Layer ${layerNumber}: ${layerTitle} (${timestamp})

### Summary
- **What:** ${what}
- **Why:** ${why}
- **How:** ${how}

### Spin-out Threads
${threadsText}

### Discussion & Open Questions
${questionsText}

### Version History
- **v${layerNumber} (${date}):** Layer appended per canonical pattern drafted from \`${CANONICAL_EXAMPLE}\`. Status advanced to \`${status}\`.
`.trim()
}

export function appendIdeaLayer(originalFileContent, layerData = {}) {
  const { frontMatter, body } = splitFrontMatter(originalFileContent)
  const origTranscript = extractOriginalTranscript(body)

  const currentVersion = parseInt(frontMatter.version || '1', 10)
  const nextVersion = currentVersion + 1
  const layerNumber = layerData.layerNumber || (currentVersion === 1 ? 1 : currentVersion)

  const layerContent = buildLayerContent({
    layerNumber,
    layerTitle: layerData.layerTitle || `Layer ${layerNumber} Processing`,
    timestamp: layerData.timestamp || new Date().toISOString(),
    date: layerData.date || new Date().toISOString().split('T')[0],
    what: layerData.what,
    why: layerData.why,
    how: layerData.how,
    spinOutThreads: layerData.spinOutThreads || [],
    openQuestions: layerData.openQuestions || [],
    status: layerData.status || 'layered',
  })

  // Update front matter
  const updatedFm = {
    ...frontMatter,
    status: layerData.status || 'layered',
    updated: layerData.date || new Date().toISOString().split('T')[0],
    version: nextVersion,
    layers: [
      ...(Array.isArray(frontMatter.layers) ? frontMatter.layers : []),
      `layer-${layerNumber}: ${layerData.layerTitle || 'Layer ' + layerNumber}`,
    ],
  }

  const updatedBody = `${body.trim()}\n\n${layerContent}\n`

  // Verify non-destructive invariant: original transcript must be strictly preserved
  const verifyOrig = extractOriginalTranscript(updatedBody)
  if (origTranscript && verifyOrig !== origTranscript) {
    throw new Error('Invariant violation: Original transcript was modified during layering!')
  }

  return `${serializeFrontMatter(updatedFm)}\n\n${updatedBody}`
}

export function processIdeaFile(filePath, layerData = {}) {
  const content = fs.readFileSync(filePath, 'utf8')
  const updated = appendIdeaLayer(content, layerData)
  fs.writeFileSync(filePath, updated, 'utf8')
  return updated
}

function main() {
  const args = process.argv.slice(2)
  const ideaIndex = args.indexOf('--idea')
  if (ideaIndex === -1 || !args[ideaIndex + 1]) {
    console.log('Usage: node ideation-layer.mjs --idea <path> [--department <dept>]')
    process.exit(1)
  }
  const ideaPath = path.resolve(args[ideaIndex + 1])
  if (!fs.existsSync(ideaPath)) {
    console.error(`Idea file not found: ${ideaPath}`)
    process.exit(1)
  }
  const result = processIdeaFile(ideaPath)
  console.log(`Layer appended successfully to ${ideaPath}`)
}

if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
