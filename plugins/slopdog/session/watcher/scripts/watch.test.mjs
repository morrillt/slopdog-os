import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  advanceIdleQueue,
  advanceTyrionNudge,
  buildPaneState,
  hotfixQueuedRows,
  runTyrionNudge,
  TYRION_NUDGE_INTERVAL_MS,
  advanceStalledDoing,
  dispatchableQueuedRows,
  focusDoingYellowRows,
  focusQueuedRows,
  parseFocusBatches,
  resolveAmbiguousTimestamp,
  runStalledDoingCheck,
  STALL_MINUTES,
  taskListMarkById,
} from './watch.mjs';

const FIXTURE_CONTEXT = `focus: "test"
focus_batches:
  - B1-shaping
  - B2b-cost-and-the-dispatch-gate
focus_tasks: []
`;

const FIXTURE_TASK_LIST = `
| 🟡 | [Focus batch doing](tickets/focus-ticket.md)<br>#T701 #B2b-cost-and-the-dispatch-gate | doing |
| 🟡 | [Other batch doing](tickets/other-batch.md)<br>#T702 #B9-not-focus | doing |
| 🟡 | [Live builder](tickets/live-builder.md)<br>#T703 #B1-shaping | doing |
`;

test('parseFocusBatches reads list from context.yaml', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  assert.deepEqual(batches, ['B1-shaping', 'B2b-cost-and-the-dispatch-gate']);
});

test('focusDoingYellowRows keeps only 🟡 rows tagged with a focus batch', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  const rows = focusDoingYellowRows(FIXTURE_TASK_LIST, batches);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.find((r) => r.id === 'T-701'), { id: 'T-701', file: 'focus-ticket.md' });
  assert.deepEqual(rows.find((r) => r.id === 'T-703'), { id: 'T-703', file: 'live-builder.md' });
});

test('resolveAmbiguousTimestamp picks non-future local or UTC closest to now', () => {
  const now = Date.parse('2026-10-08T15:00:00.000Z');
  const t = resolveAmbiguousTimestamp('2026-10-08', '14:30', now);
  assert.equal(t, Date.parse('2026-10-08T14:30:00.000Z'));
  const futureBoth = resolveAmbiguousTimestamp('2026-10-08', '16:00', now);
  assert.equal(futureBoth, null);
});

test('stalled doing reports on second miss, not first; live builder never reported', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  const rows = focusDoingYellowRows(FIXTURE_TASK_LIST, batches);
  const focusOnly = rows.filter((r) => r.id === 'T-701');
  const liveRow = rows.filter((r) => r.id === 'T-703');
  const noBuilderCmdlines = [];
  const liveCmdlines = ['cursor-agent --file tickets/live-builder.md'];
  const t0 = Date.parse('2026-10-08T12:00:00.000Z');
  const t1 = t0 + 5 * 60 * 1000;
  const recent = { 'T-701': t0, 'T-703': t1 };

  let state = {};
  let step = advanceStalledDoing(state, focusOnly, noBuilderCmdlines, t0, recent);
  assert.equal(step.reportLines.length, 0);
  assert.equal(step.next['T-701']?.misses, 1);

  step = advanceStalledDoing(step.next, focusOnly, noBuilderCmdlines, t1, recent);
  assert.equal(step.reportLines.length, 1);
  assert.match(step.reportLines[0], /T-701: no builder/);
  assert.ok(step.stalledIds.includes('T-701'));

  step = advanceStalledDoing({}, liveRow, liveCmdlines, t1, recent);
  assert.equal(step.next['T-703'], undefined);
  assert.equal(step.reportLines.length, 0);
  assert.ok(!step.stalledIds.includes('T-703'));
});

test('runStalledDoingCheck dry-run reports when state already has one miss', () => {
  const dir = mkdtempSync(join(tmpdir(), 'watcher-stalled-'));
  const contextPath = join(dir, 'context.yaml');
  const taskListPath = join(dir, 'task-list.md');
  const statePath = join(dir, 'stalled-doing.json');
  const tasksRepo = join(dir, 'tasks');
  mkdirSync(join(tasksRepo, 'tickets'), { recursive: true });
  writeFileSync(contextPath, FIXTURE_CONTEXT);
  writeFileSync(taskListPath, FIXTURE_TASK_LIST);
  writeFileSync(join(tasksRepo, 'tickets', 'focus-ticket.md'), '## Build log\n');
  writeFileSync(statePath, JSON.stringify({ 'T-701': { misses: 1 } }));

  const now = Date.parse('2026-10-08T12:05:00.000Z');
  const result = runStalledDoingCheck({
    contextPath,
    taskListPath,
    statePath,
    tasksRepo,
    worktreeRoots: [],
    cmdlines: [],
    dry: true,
    now,
    execFile: () => {
      throw new Error('no git in test');
    },
  });
  assert.equal(result.dryWouldReport.length, 1);
  assert.match(result.dryWouldReport[0], /T-701: no builder/);
});

test('idle 10 minutes is reported, idle 9 is not', () => {
  const row = [{ id: 'T-800', file: 'idle-ticket.md' }];
  const now = Date.parse('2026-10-08T12:00:00.000Z');
  const activity9 = now - 9 * 60 * 1000;
  const activity10 = now - STALL_MINUTES * 60 * 1000;

  let r = advanceStalledDoing({}, row, [], now, { 'T-800': activity9 });
  assert.equal(r.reportLines.length, 0);
  assert.ok(!r.stalledIds.includes('T-800'));

  r = advanceStalledDoing({}, row, [], now, { 'T-800': activity10 });
  assert.equal(r.reportLines.length, 1);
  assert.match(r.reportLines[0], /idle 10 minutes/);
  assert.ok(r.stalledIds.includes('T-800'));
});

test('live builder with recent activity is never reported', () => {
  const row = [{ id: 'T-801', file: 'live-recent.md' }];
  const now = Date.parse('2026-10-08T12:00:00.000Z');
  const cmdlines = ['cursor-agent tickets/live-recent.md'];
  const r = advanceStalledDoing({}, row, cmdlines, now, { 'T-801': now - 60_000 });
  assert.equal(r.reportLines.length, 0);
  assert.equal(r.stalledIds.length, 0);
});

test('live builder idle 10 minutes is reported as idle', () => {
  const row = [{ id: 'T-802', file: 'live-idle.md' }];
  const now = Date.parse('2026-10-08T12:00:00.000Z');
  const cmdlines = ['cursor-agent tickets/live-idle.md'];
  const activity = now - STALL_MINUTES * 60 * 1000;
  const r = advanceStalledDoing({}, row, cmdlines, now, { 'T-802': activity });
  assert.equal(r.reportLines.length, 1);
  assert.match(r.reportLines[0], /T-802: idle 10 minutes/);
  assert.ok(!/no builder/.test(r.reportLines[0]));
});

test('non-focus row is ignored', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  const rows = focusDoingYellowRows(FIXTURE_TASK_LIST, batches);
  assert.ok(!rows.some((r) => r.id === 'T-702'));
});

const FIXTURE_QUEUE_LIST = `
| 🔵 | [Ready in focus](tickets/ready-focus.md)<br>#T710 #B2b-cost-and-the-dispatch-gate | ready |
| 🔵 | [Ready other batch](tickets/ready-other.md)<br>#T711 #B9-not-focus | ready |
| 🔍 | [Verify in focus](tickets/verify-focus.md)<br>#T712 #B1-shaping | verifying |
| 🔵 | [Blocked by dep](tickets/blocked-dep.md)<br>#T713 #B2b-cost-and-the-dispatch-gate | ready |
`;

test('idle queue reports after two cycles with queued work and no builders', () => {
  const ids = ['T-710', 'T-712'];
  const t0 = Date.parse('2026-10-08T12:00:00.000Z');
  const t1 = t0 + 5 * 60 * 1000;
  let step = advanceIdleQueue({}, { dispatchableIds: ids, hasBuilders: false, now: t0 });
  assert.equal(step.reportText, null);
  assert.equal(step.next.misses, 1);

  step = advanceIdleQueue(step.next, { dispatchableIds: ids, hasBuilders: false, now: t1 });
  assert.ok(step.reportText);
  assert.match(step.reportText, /T-710, T-712/);
  assert.match(step.reportText, /builders idle with work queued; dispatch now/);
});

test('idle queue does not report on first cycle only', () => {
  const step = advanceIdleQueue(
    {},
    { dispatchableIds: ['T-710'], hasBuilders: false, now: Date.parse('2026-10-08T12:00:00.000Z') },
  );
  assert.equal(step.reportText, null);
  assert.equal(step.next.misses, 1);
});

test('any live cursor-agent suppresses idle queue', () => {
  const t1 = Date.parse('2026-10-08T12:05:00.000Z');
  const afterOne = advanceIdleQueue(
    { misses: 1 },
    { dispatchableIds: ['T-710'], hasBuilders: true, now: t1 },
  );
  assert.equal(afterOne.next.misses, 0);
  assert.equal(afterOne.reportText, null);
});

test('🔵 row blocked by unfinished depends_on is not counted', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  const rows = focusQueuedRows(FIXTURE_QUEUE_LIST, batches);
  const marks = taskListMarkById(FIXTURE_QUEUE_LIST);
  const dispatchable = dispatchableQueuedRows(rows, marks, {
    'blocked-dep.md': 'depends_on: T-999\n',
  });
  assert.ok(dispatchable.some((r) => r.id === 'T-710'));
  assert.ok(dispatchable.some((r) => r.id === 'T-712'));
  assert.ok(!dispatchable.some((r) => r.id === 'T-713'));
});

test('no 🔵 or 🔍 focus rows means idle queue has nothing to report', () => {
  const batches = parseFocusBatches(FIXTURE_CONTEXT);
  const rows = focusQueuedRows('| 🟡 | [Doing](tickets/x.md)<br>#T800 #B1-shaping | doing |\n', batches);
  assert.equal(rows.length, 0);
  const step = advanceIdleQueue(
    { misses: 2 },
    { dispatchableIds: [], hasBuilders: false, now: Date.parse('2026-10-08T12:00:00.000Z') },
  );
  assert.equal(step.next.misses, 0);
  assert.equal(step.reportText, null);
});

test('runStalledDoingCheck dry-run idle queue after one prior miss in state', () => {
  const dir = mkdtempSync(join(tmpdir(), 'watcher-idle-'));
  const contextPath = join(dir, 'context.yaml');
  const taskListPath = join(dir, 'task-list.md');
  const statePath = join(dir, 'stalled-doing.json');
  const tasksRepo = join(dir, 'tasks');
  mkdirSync(join(tasksRepo, 'tickets'), { recursive: true });
  writeFileSync(contextPath, FIXTURE_CONTEXT);
  writeFileSync(taskListPath, FIXTURE_QUEUE_LIST);
  writeFileSync(join(tasksRepo, 'tickets', 'ready-focus.md'), 'id: T-710\n');
  writeFileSync(join(tasksRepo, 'tickets', 'verify-focus.md'), 'id: T-712\n');
  writeFileSync(join(tasksRepo, 'tickets', 'blocked-dep.md'), 'id: T-713\ndepends_on: T-999\n');
  writeFileSync(statePath, JSON.stringify({ _idleQueue: { misses: 1 } }));

  const now = Date.parse('2026-10-08T12:05:00.000Z');
  const result = runStalledDoingCheck({
    contextPath,
    taskListPath,
    statePath,
    tasksRepo,
    worktreeRoots: [],
    cmdlines: [],
    dry: true,
    now,
    execFile: () => {
      throw new Error('no git in test');
    },
  });
  assert.ok(result.dryWouldIdleQueueReport);
  assert.match(result.dryWouldIdleQueueReport, /builders idle with work queued; dispatch now/);
  assert.ok(result.idleQueueIds.includes('T-710'));
  assert.ok(!result.idleQueueIds.includes('T-713'));
});

const UNSTUCKER_IDLE = `2026-10-08T16:16:12.730Z unstucker --mode reset --dry-run
  ideas (w1:p1B): left alone, idle with a background agent running that will wake it
  build (w1:pAW): would nudge (idle)
  it (w2:p4): would nudge (idle)`;
const UNSTUCKER_BUSY = UNSTUCKER_IDLE.replace('build (w1:pAW): would nudge (idle)', 'build (w1:pAW): SKIPPED, a human\'s unsent text in the box: "x"');

test('buildPaneState reads Tyrion idle, busy or absent from unstucker output', () => {
  assert.equal(buildPaneState(UNSTUCKER_IDLE).state, 'idle');
  assert.equal(buildPaneState(UNSTUCKER_BUSY).state, 'busy');
  assert.equal(buildPaneState('  it (w2:p4): would nudge (idle)').state, 'absent');
});

test('advanceTyrionNudge needs ready work and an idle pane, then cools down 15 minutes', () => {
  const now = 1_000_000_000;
  assert.equal(advanceTyrionNudge({}, { readyIds: [], paneState: 'idle', now }).send, false);
  assert.equal(advanceTyrionNudge({}, { readyIds: ['T-1'], paneState: 'busy', now }).status, 'tyrion-busy');
  const first = advanceTyrionNudge({}, { readyIds: ['T-1'], paneState: 'idle', now });
  assert.equal(first.send, true);
  const second = advanceTyrionNudge(first.next, { readyIds: ['T-1'], paneState: 'idle', now: now + 5 * 60_000 });
  assert.equal(second.send, false);
  assert.match(second.status, /^cooldown 10m$/);
  const third = advanceTyrionNudge(first.next, { readyIds: ['T-1'], paneState: 'idle', now: now + TYRION_NUDGE_INTERVAL_MS });
  assert.equal(third.send, true);
});

test('runTyrionNudge: two cycles inside 15 minutes send exactly one inbox', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tyrion-nudge-'));
  const statePath = join(dir, 'tyrion-nudge.json');
  const sent = [];
  const send = (t) => sent.push(t);
  const now = Date.now();
  const a = runTyrionNudge({ readyIds: ['T-702', 'T-704'], unstuckerOut: UNSTUCKER_IDLE, statePath, now, send });
  const b = runTyrionNudge({ readyIds: ['T-702', 'T-704'], unstuckerOut: UNSTUCKER_IDLE, statePath, now: now + 5 * 60_000, send });
  assert.equal(a.status, 'sent');
  assert.match(b.status, /^cooldown/);
  assert.equal(sent.length, 1);
  assert.match(sent[0], /T-702, T-704/);
  const d = runTyrionNudge({ readyIds: ['T-702'], unstuckerOut: UNSTUCKER_IDLE, statePath: join(dir, 'dry.json'), now, send, dry: true });
  assert.equal(d.status, 'would-send');
  assert.equal(sent.length, 1);
});

test('T-710 AC-5 watcher line carries QUOTA exhausted', async () => {
  const dir = mkdtempSync(join(tmpdir(), 't710-watch-'));
  const statePath = join(dir, 'engine-quota.json');
  const now = new Date().toISOString();
  writeFileSync(statePath, JSON.stringify({
    'cursor:composer': { key: 'cursor:composer', time: now, reason: '429', resetAt: new Date(Date.now() + 3_600_000).toISOString() },
  }));
  const logPath = join(dir, 'sprint-watch.log');
  const origLog = process.env.WATCHER_LOG_PATH;
  const origQuota = process.env.DISPATCH_QUOTA_STATE_PATH;
  process.env.DISPATCH_QUOTA_STATE_PATH = statePath;
  const { runCycle } = await import('./watch.mjs');
  const line = await runCycle({ stopThresholdPct: 99, hardCeilingPct: 100, notifyPct: 99, warnPct: 99, intervalMinutes: 5 }, { dryRun: true });
  assert.match(line, /QUOTA exhausted=\[cursor:composer\]/);
  if (origQuota === undefined) delete process.env.DISPATCH_QUOTA_STATE_PATH;
  else process.env.DISPATCH_QUOTA_STATE_PATH = origQuota;
});

test('hotfixQueuedRows keeps 🔵 rows whose ticket says hotfix: true', () => {
  const list = `| 🔵 | [Hot](tickets/hot.md)<br>#T900 #B9-x | a |
| 🔵 | [Cold](tickets/cold.md)<br>#T901 #B9-x | b |
| 🟡 | [Hot doing](tickets/hot2.md)<br>#T902 #B9-x | c |`;
  const texts = { 'hot.md': '---\nhotfix: true\n---\nbody', 'cold.md': '---\ntitle: x\n---\n', 'hot2.md': '---\nhotfix: true\n---\n' };
  assert.deepEqual(hotfixQueuedRows(list, (f) => texts[f]).map((r) => r.id), ['T-900']);
});

test('buildPaneState reads a left-alone idle Tyrion as idle, not absent', () => {
  const leftAlone = UNSTUCKER_IDLE.replace(
    'build (w1:pAW): would nudge (idle)',
    'build (w1:pAW): left alone, idle with a background agent running that will wake it',
  );
  assert.equal(buildPaneState(leftAlone).state, 'idle');
});

test('swapEpisode alerts once after five minutes at or above 80 percent, and resets below it', async () => {
  const { swapEpisode, readFleetMemory } = await import('./watch.mjs');
  const m = 60000;
  let r = swapEpisode(85, {}, 0);
  assert.equal(r.alert, false);
  r = swapEpisode(85, r.state, 4 * m);
  assert.equal(r.alert, false);
  r = swapEpisode(85, r.state, 5 * m);
  assert.equal(r.alert, true);
  r = swapEpisode(95, r.state, 6 * m);
  assert.equal(r.alert, false);
  r = swapEpisode(40, r.state, 7 * m);
  assert.deepEqual(r.state, {});
  const mem = readFleetMemory('MemAvailable: 10485760 kB\nSwapTotal: 8388608 kB\nSwapFree: 2097152 kB\n');
  assert.deepEqual(mem, { availGb: 10, swapPct: 75 });
});

test('countTimeoutJobs counts exit-124 job files per engine inside the window and skips the rest', async () => {
  const { countTimeoutJobs, timeoutLines } = await import('./watch.mjs');
  const desks = mkdtempSync(join(tmpdir(), 'watch-timeouts-'));
  const job = (dir, name, fm, ageHours = 1) => {
    mkdirSync(dir, { recursive: true });
    const p = join(dir, name);
    writeFileSync(p, `---\n${fm}\n---\n\n## Task\n\nx\n`);
    const t = new Date(Date.now() - ageHours * 3600 * 1000);
    utimesSync(p, t, t);
  };
  const fin = (h) => `finished: ${new Date(Date.now() - h * 3600 * 1000).toISOString()}`;
  job(join(desks, 'build', 'sidekicks', 'gemini', 'jobs'), 'a.md', `engine: gemini\n${fin(1)}\nexit: 124`);
  job(join(desks, 'build', 'sidekicks', 'gemini', 'jobs'), 'b.md', `engine: gemini\n${fin(2)}\nexit: 124`);
  job(join(desks, 'ideas', 'sidekicks', 'gemini', 'jobs'), 'c.md', `engine: gemini\n${fin(3)}\nexit: 0`);
  job(join(desks, 'build', 'jobs'), 'd.md', `engine: grok\n${fin(1)}\nexit: 124`);
  job(join(desks, 'build', 'jobs'), 'old.md', `engine: grok\n${fin(30)}\nexit: 124`, 30);
  job(join(desks, 'build', 'notjobs'), 'e.md', `engine: grok\n${fin(1)}\nexit: 124`);
  const counts = countTimeoutJobs(desks);
  assert.deepEqual(counts, { gemini: 2, grok: 1 });
  assert.deepEqual(timeoutLines(counts), ['TIMEOUTS engine=gemini exit124=2 in 24h', 'TIMEOUTS engine=grok exit124=1 in 24h']);
  assert.deepEqual(countTimeoutJobs(join(desks, 'nothing-here')), {});
  rmSync(desks, { recursive: true, force: true });
});
