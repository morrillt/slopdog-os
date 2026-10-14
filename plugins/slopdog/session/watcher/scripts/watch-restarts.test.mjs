// T-728 AC-2: the Slack listener's restart-rate alert. Three or more `Started` entries for the unit
// inside one hour produce one alert naming the service and the count; two produce none; a second
// call inside the same hour produces none.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUnitStarts, restartRateAlert, restartAlertText, RESTART_UNIT } from './watch.mjs';

const H = 60 * 60 * 1000;
const now = Date.parse('2026-10-10T20:40:00Z');
const at = (minAgo) => now - minAgo * 60 * 1000;

function journalJson(entries) {
  return entries.map(([ms, message, jobType]) => JSON.stringify({
    __REALTIME_TIMESTAMP: String(ms * 1000),
    MESSAGE: message,
    ...(jobType ? { JOB_TYPE: jobType } : {}),
  })).join('\n');
}

test('parseUnitStarts keeps only the unit start entries, as epoch ms', () => {
  const text = journalJson([
    [at(50), 'Starting slack-channel.service - Slack Channel Socket Mode Listener...', 'start'],
    [at(50), 'Started slack-channel.service - Slack Channel Socket Mode Listener.', 'start'],
    [at(40), "[WARN]  socket-mode:SlackWebSocket:1 A pong wasn't received"],
    [at(30), 'slack-channel.service: Failed with result \'oom-kill\'.'],
    [at(30), 'Started slack-channel.service - Slack Channel Socket Mode Listener.', 'start'],
  ]);
  assert.deepEqual(parseUnitStarts(text), [at(50), at(30)]);
  assert.deepEqual(parseUnitStarts(''), []);
  assert.deepEqual(parseUnitStarts('not json\n{"MESSAGE":1}'), []);
});

test('three starts inside one hour produce one alert naming the service and the count', () => {
  const r = restartRateAlert([at(55), at(30), at(5)], {}, now);
  assert.equal(r.alert, true);
  assert.equal(r.count, 3);
  assert.equal(r.state.alertedAt, now);
  const text = restartAlertText(RESTART_UNIT, r.count);
  assert.match(text, /slack-channel/);
  assert.match(text, /restarted 3 times in the last hour/);
});

test('two starts inside one hour produce no alert', () => {
  const r = restartRateAlert([at(55), at(5)], {}, now);
  assert.equal(r.alert, false);
  assert.equal(r.count, 2);
});

test('starts older than an hour do not count', () => {
  const r = restartRateAlert([at(120), at(90), at(61), at(5)], {}, now);
  assert.equal(r.alert, false);
  assert.equal(r.count, 1);
});

test('a second call within the same hour produces no alert', () => {
  const first = restartRateAlert([at(55), at(30), at(5)], {}, now);
  assert.equal(first.alert, true);
  const later = now + 10 * 60 * 1000;
  const second = restartRateAlert([at(55), at(30), at(5), later - 1000], first.state, later);
  assert.equal(second.alert, false);
  assert.equal(second.count, 3, "the start 65 minutes back has left the window");
  assert.equal(second.state.alertedAt, now, 'the cooldown keeps the first alert time');
});

test('a fresh storm more than an hour after the last alert alerts again', () => {
  const later = now + H + 60 * 1000;
  const starts = [later - 50 * 60 * 1000, later - 20 * 60 * 1000, later - 60 * 1000];
  const r = restartRateAlert(starts, { alertedAt: now }, later);
  assert.equal(r.alert, true);
  assert.equal(r.state.alertedAt, later);
});
