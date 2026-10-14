// T-740: past context.yaml's finish_by with a focus batch still open, the watcher hands the open
// batches to Data once per finish_by value.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseFinishBy, runSprintOverdue } from './watch.mjs';

const FINISH = '2026-10-11T18:00:00Z';
const BEFORE = Date.parse('2026-10-11T17:00:00Z');
const AFTER = Date.parse('2026-10-11T19:00:00Z');

const ticket = (id, batch, mark) => `---\nid: ${id}\nbatch: ${batch}\n---\n# ${id} title\n\n${id} · ${mark}\n`;

function setup({ finishBy = FINISH, tickets = {}, archived = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'watch-overdue-'));
  const ticketsDir = join(dir, 'tickets');
  mkdirSync(join(ticketsDir, 'archive'), { recursive: true });
  for (const [name, text] of Object.entries(tickets)) writeFileSync(join(ticketsDir, name), text);
  for (const [name, text] of Object.entries(archived)) writeFileSync(join(ticketsDir, 'archive', name), text);
  const contextPath = join(dir, 'context.yaml');
  writeFileSync(
    contextPath,
    `focus: "test"\nfocus_batches:\n  - B2a-rings\n  - B2e-chairs\n${finishBy ? `finish_by: "${finishBy}"\n` : ''}focus_tasks: []\n`,
  );
  const sent = [];
  return {
    dir,
    sent,
    statePath: join(dir, 'sprint-overdue.json'),
    run(now, extra = {}) {
      return runSprintOverdue({
        contextPath,
        ticketsDir,
        statePath: join(dir, 'sprint-overdue.json'),
        now,
        send: (text) => sent.push(text),
        ...extra,
      });
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const OPEN = {
  'a.md': ticket('T-901', '2a-rings', '🟡 doing'),
  'b.md': ticket('T-902', '2a-rings', '🟩 done'),
  'c.md': ticket('T-903', '2e-chairs', '🟢 approved'),
  'd.md': ticket('T-904', '2e-chairs', '🔵 queued'),
  'e.md': ticket('T-905', '9-other', '🔵 queued'),
};

test('parseFinishBy: quoted, bare, absent, blank and junk', () => {
  assert.equal(parseFinishBy(`finish_by: "${FINISH}"`), Date.parse(FINISH));
  assert.equal(parseFinishBy(`finish_by: ${FINISH} # set by Tyrion`), Date.parse(FINISH));
  assert.equal(parseFinishBy('focus: x\n'), null);
  assert.equal(parseFinishBy('finish_by:\n'), null);
  assert.equal(parseFinishBy('finish_by: null\n'), null);
  assert.ok(Number.isNaN(parseFinishBy('finish_by: "tomorrow-ish"\n')));
});

test('no finish_by: nothing is sent', () => {
  const s = setup({ finishBy: null, tickets: OPEN });
  try {
    assert.equal(s.run(AFTER).status, 'no-finish-by');
    assert.equal(s.sent.length, 0);
  } finally {
    s.cleanup();
  }
});

test('before finish_by: nothing is sent, even with open tickets', () => {
  const s = setup({ tickets: OPEN });
  try {
    assert.equal(s.run(BEFORE).status, 'not-yet');
    assert.equal(s.sent.length, 0);
  } finally {
    s.cleanup();
  }
});

test('after finish_by with every focus ticket done or dropped: nothing is sent', () => {
  const s = setup({
    tickets: {
      'b.md': ticket('T-902', '2a-rings', '🟩 done'),
      'c.md': ticket('T-903', '2e-chairs', '🟢 approved'),
      'e.md': ticket('T-905', '9-other', '🔵 queued'),
      // A paused ticket was parked on purpose, so it is not handed to the trusted lane.
      'g.md': ticket('T-907', '2e-chairs', '⏸️ paused'),
    },
    // An archived ticket that never finished counts as dropped (sprint-moving's loadTickets).
    archived: { 'f.md': ticket('T-906', '2a-rings', '🔵 queued') },
  });
  try {
    assert.equal(s.run(AFTER).status, 'all-done');
    assert.equal(s.sent.length, 0);
  } finally {
    s.cleanup();
  }
});

test('after finish_by with open tickets: one inbox write naming each open batch and its open ids', () => {
  const s = setup({ tickets: OPEN });
  try {
    const r = s.run(AFTER);
    assert.equal(r.status, 'sent');
    assert.equal(s.sent.length, 1);
    const text = s.sent[0];
    assert.match(text, /Sprint past its finish-by time/);
    assert.match(text, /Take these batches in the trusted lane: read the project and batch, treat tickets as hints, plan, build, verify, close\./);
    assert.match(text, /- B2a-rings: T-901 \(🟡 doing\)$/m);
    assert.match(text, /- B2e-chairs: T-904 \(🔵 queued\)$/m);
    assert.doesNotMatch(text, /T-902|T-903|T-905/);
    assert.equal(JSON.parse(readFileSync(s.statePath, 'utf8')).finishBy, new Date(FINISH).toISOString());
  } finally {
    s.cleanup();
  }
});

test('second cycle for the same finish_by: no duplicate', () => {
  const s = setup({ tickets: OPEN });
  try {
    s.run(AFTER);
    const again = s.run(AFTER + 5 * 60_000);
    assert.equal(again.status, 'already');
    assert.equal(s.sent.length, 1);
  } finally {
    s.cleanup();
  }
});

test('dry run: reports would-send with the text, sends nothing, writes no marker', () => {
  const s = setup({ tickets: OPEN });
  try {
    const r = s.run(AFTER, { dry: true });
    assert.equal(r.status, 'would-send');
    assert.match(r.text, /B2a-rings: T-901/);
    assert.equal(s.sent.length, 0);
    assert.equal(s.run(AFTER).status, 'sent');
  } finally {
    s.cleanup();
  }
});
