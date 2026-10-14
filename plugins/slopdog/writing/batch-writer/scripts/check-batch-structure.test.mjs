import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-batch-structure.mjs');

const SECTIONS = [
  'Summary',
  'What',
  'Why',
  'How',
  'Requirements',
  'Integration tests',
  'Cross-cutting tests',
  'Discussion & Open Questions',
  'Appendix',
];

const HOW_AND_REQ = `## How

- Does the batch work. *(Owns FR-1.)*

## Requirements

Every requirement hangs from one bullet of How, named in its heading.

- [ ] **FR-1 (Cap placeholder) — hangs from How bullet 1:** I can run the structural check on this file.

  - *Verify:* A command exits non-zero when the file is missing a section.
  - *Verify:* A command exits non-zero when How owns no requirement.
  - *Verify:* A command exits zero on a valid fixture batch.

`;

function fixture(tickets, members, { howAndReq = HOW_AND_REQ } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'batchcap-'));
  fs.mkdirSync(path.join(root, 'tickets'));
  for (const [id, origin, ext] of tickets) {
    fs.writeFileSync(
      path.join(root, 'tickets', `${id}.md`),
      `---\nid: ${id}\norigin: ${origin}\n${ext ? `extends: ${ext}\n` : ''}---\n`,
    );
  }
  const middle = SECTIONS.filter((s) => s !== 'How' && s !== 'Requirements')
    .map((s) => `## ${s}\nx\n\n`)
    .join('');
  const batch =
    '# Batch 1-x\ntype: slopdog\nfeature: ticket-shaping\n\n' +
    middle +
    howAndReq +
    `## Members\n${members.map((id, i) => `${i + 1}. ${id} · title`).join('\n')}\n\n## What this batch turns off\n\nNothing.\n`;
  const file = path.join(root, 'batch.md');
  fs.writeFileSync(file, batch);
  return { root, file };
}

function run({ root, file }) {
  return spawnSync('node', [script, file], { encoding: 'utf8', env: { ...process.env, TASKS_ROOT: root } });
}

const asked = (n) => Array.from({ length: n }, (_, i) => [`T-${100 + i}`, 'todd-asked']);

test('ten asked-for members pass', () => {
  const t = asked(10);
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /10 counted members, 0 derived excluded/);
});

test('eleven asked-for members fail naming the count', () => {
  const t = asked(11);
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /11 non-derived members, over the cap of 10/);
});

test('derived members ride free and are named as excluded', () => {
  const t = [...asked(10), ['T-200', 'derived', 'T-100'], ['T-201', 'derived', 'T-200']];
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /10 counted members, 2 derived excluded/);
});

test('failure message lists the excluded derived members', () => {
  const t = [...asked(11), ['T-200', 'derived', 'T-100']];
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /1 derived excluded: T-200/);
});

test('a derived ticket with a broken chain still counts', () => {
  const t = [...asked(10), ['T-200', 'derived', 'T-999']];
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /11 non-derived members/);
});

test('missing Integration tests section fails', () => {
  const t = asked(1);
  const { root, file } = fixture(t, t.map((x) => x[0]));
  const text = fs.readFileSync(file, 'utf8').replace(/^## Integration tests\nx\n\n/m, '');
  fs.writeFileSync(file, text);
  const r = run({ root, file });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing required section:.*Integration tests/);
});

test('missing Cross-cutting tests section fails', () => {
  const t = asked(1);
  const { root, file } = fixture(t, t.map((x) => x[0]));
  const text = fs.readFileSync(file, 'utf8').replace(/^## Cross-cutting tests\nx\n\n/m, '');
  fs.writeFileSync(file, text);
  const r = run({ root, file });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing required section:.*Cross-cutting tests/);
});

test('requirement that does not name a How bullet fails', () => {
  const t = asked(1);
  const orphanReq = HOW_AND_REQ.replace('— hangs from How bullet 1:', ':');
  const r = run(fixture(t, t.map((x) => x[0]), { howAndReq: orphanReq }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /FR-1 does not say which How bullet it hangs from/);
});

test('How bullet that owns no requirement fails', () => {
  const t = asked(1);
  const extraHow = HOW_AND_REQ.replace(
    '## Requirements',
    '- Second bullet with no owned FR.\n\n## Requirements',
  );
  const r = run(fixture(t, t.map((x) => x[0]), { howAndReq: extraHow }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /How bullet 2 owns no requirement/);
});

test('a batch with one feature: line gets no feature warning', () => {
  const t = asked(1);
  const r = run(fixture(t, t.map((x) => x[0])));
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /warning: (feature|type):/);
});

test('a batch with no feature: line warns and still exits 0', () => {
  const t = asked(1);
  const fx = fixture(t, t.map((x) => x[0]));
  fs.writeFileSync(fx.file, fs.readFileSync(fx.file, 'utf8').replace('feature: ticket-shaping\n', ''));
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /warning: feature: missing \(every batch names exactly one feature/);
});

test('a batch with two feature: lines warns that it names exactly one', () => {
  const t = asked(1);
  const fx = fixture(t, t.map((x) => x[0]));
  fs.writeFileSync(fx.file, fs.readFileSync(fx.file, 'utf8').replace('feature: ticket-shaping\n', 'feature: a\nfeature: b\n'));
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /warning: feature: 2 lines found/);
});

// T-657: the slug is a Slopdog Features.md slug, or `none` when no feature is honestly true.
test('a batch naming a slug not in Slopdog Features.md warns and still exits 0', () => {
  const t = asked(1);
  const fx = fixture(t, t.map((x) => x[0]));
  fs.writeFileSync(fx.file, fs.readFileSync(fx.file, 'utf8').replace('feature: ticket-shaping\n', 'feature: made-up-slug\n'));
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /warning: feature: "made-up-slug" is not a slug in Slopdog Features\.md/);
});

test('a batch with feature: none gets no feature warning', () => {
  const t = asked(1);
  const fx = fixture(t, t.map((x) => x[0]));
  fs.writeFileSync(fx.file, fs.readFileSync(fx.file, 'utf8').replace('feature: ticket-shaping\n', 'feature: none\n'));
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /warning: feature:/);
});

test('a retired department type on a batch warns with the replacement', () => {
  const t = asked(1);
  const fx = fixture(t, t.map((x) => x[0]));
  fs.writeFileSync(fx.file, fs.readFileSync(fx.file, 'utf8').replace('type: slopdog', 'type: meta'));
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /retired department name; use slopdog/);
});
