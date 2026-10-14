import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { advanceUsageRungs } from './watch.mjs';

const config = {
  notifyPct: 50,
  warnPct: 60,
  stopThresholdPct: 70,
  hardCeilingPct: 75,
};
const WINDOW_A = '2026-10-12T04:00:00Z';
const WINDOW_B = '2026-10-19T04:00:00Z';

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'watch-rungs-'));
  const statePath = join(dir, 'usage-rung-state.json');
  const calls = [];
  const errors = [];
  return {
    statePath,
    calls,
    errors,
    async postSlackMessage({ text }) {
      calls.push(text);
    },
    log(message) {
      errors.push(message);
    },
    state() {
      return JSON.parse(readFileSync(statePath, 'utf8'));
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function cycle(h, pct, resetsAt, postSlackMessage = h.postSlackMessage) {
  return advanceUsageRungs({
    pct,
    resetsAt,
    config,
    statePath: h.statePath,
    postSlackMessage,
    log: h.log,
  });
}

test('each rung Slack fires once per window', async (t) => {
  const h = setup();
  t.after(() => h.cleanup());
  await cycle(h, 45, WINDOW_A);
  assert.equal(h.calls.length, 0);

  await cycle(h, 55, WINDOW_A);
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0], /notify rung/);
  assert.match(h.calls[0], /55%/);

  await cycle(h, 58, WINDOW_A);
  assert.equal(h.calls.length, 1);

  await cycle(h, 62, WINDOW_A);
  assert.equal(h.calls.length, 2);
  assert.match(h.calls[1], /warn rung/);
  assert.match(h.calls[1], /62%/);

  await cycle(h, 69, WINDOW_A);
  assert.equal(h.calls.length, 2);

  await cycle(h, 72, WINDOW_A);
  assert.equal(h.calls.length, 3);
  assert.match(h.calls[2], /stop rung/);
  assert.match(h.calls[2], /72%/);

  await cycle(h, 74, WINDOW_A);
  assert.equal(h.calls.length, 3);
});

test('a jump from 45% to 61% fires notify then warn', async (t) => {
  const h = setup();
  t.after(() => h.cleanup());
  await cycle(h, 45, WINDOW_A);
  await cycle(h, 61, WINDOW_A);
  assert.equal(h.calls.length, 2);
  assert.match(h.calls[0], /notify rung/);
  assert.match(h.calls[1], /warn rung/);
  assert.equal(h.state().fired.notify, true);
  assert.equal(h.state().fired.warn, true);
  assert.equal(h.state().fired.stop, false);
});

test('a new resets_at re-arms all rungs', async (t) => {
  const h = setup();
  t.after(() => h.cleanup());
  await cycle(h, 45, WINDOW_A);
  await cycle(h, 80, WINDOW_A);
  assert.equal(h.calls.length, 3);
  await cycle(h, 45, WINDOW_B);
  assert.equal(h.calls.length, 3);
  const armed = h.state();
  assert.equal(armed.resetsAt, WINDOW_B);
  assert.equal(armed.fired.notify, false);
  assert.equal(armed.fired.warn, false);
  assert.equal(armed.fired.stop, false);
  await cycle(h, 55, WINDOW_B);
  assert.equal(h.calls.length, 4);
  assert.match(h.calls[3], /notify rung/);
});

test('a failed Slack send leaves the rung unfired for the next cycle', async (t) => {
  const h = setup();
  t.after(() => h.cleanup());
  await cycle(h, 45, WINDOW_A);
  const failing = async () => {
    throw new Error('slack down');
  };
  await cycle(h, 55, WINDOW_A, failing);
  assert.equal(h.calls.length, 0);
  assert.equal(h.state().fired.notify, false);
  assert.ok(h.errors.some((line) => /notify/.test(line) && /slack down/.test(line)));
  await cycle(h, 55, WINDOW_A);
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0], /notify rung/);
  assert.equal(h.state().fired.notify, true);
});

test('first cycle with no state file at 65% marks notify and warn fired without Slack', async (t) => {
  const h = setup();
  t.after(() => h.cleanup());
  await cycle(h, 65, WINDOW_A);
  assert.equal(h.calls.length, 0);
  const state = h.state();
  assert.equal(state.resetsAt, WINDOW_A);
  assert.equal(state.fired.notify, true);
  assert.equal(state.fired.warn, true);
  assert.equal(state.fired.stop, false);
});
