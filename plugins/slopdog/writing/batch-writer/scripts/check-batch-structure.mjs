#!/usr/bin/env node
/**
 * Structural checklist for batch-writer output. Exit 1 names the first failure.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const path = process.argv[2];
if (!path) {
  console.error('usage: check-batch-structure.mjs <batch.md>');
  process.exit(2);
}

const text = readFileSync(path, 'utf8');
const required = [
  /^# Batch /m,
  /^## Summary$/m,
  /^## What$/m,
  /^## Why$/m,
  /^## How$/m,
  /^## Requirements$/m,
  /^## Integration tests$/m,
  /^## Cross-cutting tests$/m,
  /^## Discussion & Open Questions$/m,
  /^## Appendix$/m,
  /^## Members$/m,
  /^## What this batch turns off$/m,
];

const forbidden = [
  /^## Ticket tips$/m,
  /^### .*Traceability Matrix/m,
  /^```dataview/m,
  /^## Tickets$/m,
  /^\| Batch \/ Ticket \|/m,
];

for (const re of required) {
  if (!re.test(text)) {
    console.error(`missing required section: ${re}`);
    process.exit(1);
  }
}

for (const re of forbidden) {
  if (re.test(text)) {
    console.error(`forbidden scaffolding matched: ${re}`);
    process.exit(1);
  }
}

// Batch cap (Todd, 2026-10-06): at most ten non-derived members; fails, never warns.
const { batchCapReport } = await import(`${homedir()}/slopdog/tasks/bin/lib/batch-cap.mjs`);
const cap = batchCapReport(text, process.env.TASKS_ROOT || `${homedir()}/slopdog/tasks`);
for (const f of cap.failures) {
  console.error(f);
  process.exit(1);
}

// Department type (T-652): warn only, never fail.
const { departmentTypeWarnings, batchFeatureWarnings } = await import(`${homedir()}/slopdog/tasks/bin/lib/department-type.mjs`);
for (const w of [...departmentTypeWarnings(text), ...batchFeatureWarnings(text)]) console.log(`warning: ${w}`);

console.log(`batch structure ok (${cap.counted.length} counted members, ${cap.derived.length} derived excluded)`);

// Requirements hang from How (Todd, 2026-10-06): every FR names the How bullet it hangs from,
// and every How bullet names the requirements it owns. A requirement hanging from nothing means
// How is missing a bullet; a How bullet owning nothing means the tip promises what nothing
// delivers. Both fail, never warn.
const howSection = (text.match(/^## How\n([\s\S]*?)(?=^## )/m) || [, ''])[1];
const reqSection = (text.match(/^## Requirements\n([\s\S]*?)(?=^## )/m) || [, ''])[1];
const frIds = [...reqSection.matchAll(/^- \[[ x]\] \*\*(FR-\d+)/gm)].map((m) => m[1]);
const hangMap = new Map();
for (const block of reqSection.split(/^- \[[ x]\] /m).slice(1)) {
  const id = (block.match(/^\*\*(FR-\d+)/) || [])[1];
  if (!id) continue;
  const flat = block.replace(/\s+/g, ' ');
  const hang = flat.match(/hangs from How bullet (\d+)/i);
  hangMap.set(id, hang ? Number(hang[1]) : null);
}
const howBullets = howSection.split(/^- /m).slice(1);
const ownedBy = howBullets.map((b) => [...b.replace(/\s+/g, ' ').matchAll(/FR-\d+/g)].map((m) => m[0]));
const mappingFailures = [];
for (const id of frIds) {
  const n = hangMap.get(id);
  if (!n) mappingFailures.push(`${id} does not say which How bullet it hangs from`);
  else if (n > howBullets.length) mappingFailures.push(`${id} hangs from How bullet ${n}, but How has only ${howBullets.length} bullets`);
  else if (!ownedBy[n - 1].includes(id)) mappingFailures.push(`${id} hangs from How bullet ${n}, but that bullet does not name ${id}`);
}
howBullets.forEach((_, i) => {
  if (ownedBy[i].length === 0) mappingFailures.push(`How bullet ${i + 1} owns no requirement`);
});
for (const owned of ownedBy.flat()) {
  if (!frIds.includes(owned)) mappingFailures.push(`How names ${owned}, which is not a requirement of this batch`);
}
if (mappingFailures.length) {
  for (const f of mappingFailures) console.error(`requirements/How mapping: ${f}`);
  process.exitCode = 1;
}
