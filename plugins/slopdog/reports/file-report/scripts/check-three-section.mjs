#!/usr/bin/env node
// Validates designed HTML against /slopdog:file-report "Report shape: three sections".
// Usage: check-three-section.mjs <report.html>
import { readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) {
  console.error('usage: check-three-section.mjs <report.html>')
  process.exit(2)
}

const html = readFileSync(path, 'utf8')
const errors = []

const introSection =
  html.match(
    /<section[^>]*(?:aria-label="Intro"|class="[^"]*\bintro\b[^"]*")[^>]*>([\s\S]*?)<\/section>/i,
  )?.[1] ?? ''
if (!introSection) {
  errors.push('missing intro section (aria-label="Intro" or class containing intro)')
} else {
  const introText = (p) => p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const introPs = [...introSection.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
    introText(m[1]),
  ).filter(Boolean)
  if (introPs.length !== 3) {
    errors.push(`intro must have exactly 3 paragraphs, found ${introPs.length}`)
  } else {
    for (let i = 0; i < 3; i++) {
      const len = introPs[i].length
      if (len > 280) errors.push(`intro paragraph ${i + 1} is ${len} chars (max 280)`)
    }
  }
}

for (const n of [1, 2, 3]) {
  if (!html.includes(`id="s${n}"`)) errors.push(`missing main section id="s${n}"`)
}
if (/<section[^>]*\bid="s4"\b/i.test(html) || /<h[23][^>]*\bid="s4"\b/i.test(html)) {
  errors.push('found id="s4" as a main section (only §1–§3 before the appendix)')
}

for (const n of [1, 2, 3]) {
  const subs = new Set()
  for (const m of html.matchAll(new RegExp(`\\bid="s${n}([0-9]+)"`, 'g'))) {
    subs.add(Number(m[1]))
  }
  const numbered = [...subs].filter((x) => x >= 1).sort((a, b) => a - b)
  if (numbered.length > 3) {
    errors.push(`§${n} has ${numbered.length} subsections (max 3)`)
  }
  if (numbered.some((x) => x > 3)) {
    errors.push(`§${n} has a subsection numbered above .3`)
  }
}

const beforeS1 = html.split(/<section[^>]*\bid="s1"\b/i)[0] ?? ''
for (const n of [1, 2, 3]) {
  if (!beforeS1.includes(`href="#s${n}"`)) {
    errors.push(`summary before §1 must link to #s${n}`)
  }
}

const toc =
  html.match(/<nav[^>]*(?:class="[^"]*\btoc\b|aria-label="Contents")[^>]*>[\s\S]*?<\/nav>/i)?.[0] ??
  ''
if (!toc) {
  errors.push('missing table of contents (<nav class="toc"> or aria-label="Contents")')
} else {
  for (const n of [1, 2, 3]) {
    if (!toc.includes(`href="#s${n}"`)) errors.push(`table of contents missing link to #s${n}`)
  }
}

if (errors.length) {
  for (const e of errors) console.error(e)
  process.exit(1)
}
console.log('three-section report ok')
