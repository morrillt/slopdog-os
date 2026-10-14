import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ticketHasLiveBuilder,
  advanceStalledDoing,
  hasAnyCursorAgent,
  advanceIdleQueue,
} from './watch.mjs';

test('AC-1: Gemini dispatch or agy command counts as live builder and prevents stall report', () => {
  const row = [{ id: 'T-734', file: 'watcher-gemini-live-builder.md' }];
  const t0 = Date.parse('2026-10-11T12:00:00.000Z');
  const t1 = t0 + 5 * 60 * 1000;
  const recent = { 'T-734': t0 };

  // 1. Gemini dispatch process naming ticket id
  const geminiDispatchCmdlines = [
    'node ~/slopdog/v2/scripts/dispatch.mjs --engine gemini --ticket T-734',
  ];
  assert.equal(
    ticketHasLiveBuilder(row[0].file, geminiDispatchCmdlines, row[0].id),
    true,
    'ticketHasLiveBuilder recognizes Gemini dispatch naming ticket ID',
  );
  let step = advanceStalledDoing({}, row, geminiDispatchCmdlines, t0, recent);
  assert.equal(step.reportLines.length, 0);
  assert.equal(step.next['T-734']?.misses, undefined);

  // Second cycle with live dispatch still does not report stall
  step = advanceStalledDoing(step.next, row, geminiDispatchCmdlines, t1, recent);
  assert.equal(step.reportLines.length, 0);
  assert.ok(!step.stalledIds.includes('T-734'));

  // 2. agy command naming ticket file
  const agyCmdlines = [
    'agy --add-dir /worktickets tickets/watcher-gemini-live-builder.md',
  ];
  assert.equal(
    ticketHasLiveBuilder(row[0].file, agyCmdlines, row[0].id),
    true,
    'ticketHasLiveBuilder recognizes agy command naming ticket file',
  );
  step = advanceStalledDoing({}, row, agyCmdlines, t0, recent);
  assert.equal(step.reportLines.length, 0);
  assert.ok(!step.stalledIds.includes('T-734'));

  // 3. Process list naming neither reports on second cycle as before
  const neitherCmdlines = [
    'node ~/slopdog/v2/scripts/dispatch.mjs --engine gemini --ticket T-999',
    'cursor-agent tickets/other-ticket.md',
  ];
  assert.equal(
    ticketHasLiveBuilder(row[0].file, neitherCmdlines, row[0].id),
    false,
    'ticketHasLiveBuilder returns false when neither matches',
  );
  let missStep = advanceStalledDoing({}, row, neitherCmdlines, t0, recent);
  assert.equal(missStep.reportLines.length, 0);
  assert.equal(missStep.next['T-734']?.misses, 1);

  missStep = advanceStalledDoing(missStep.next, row, neitherCmdlines, t1, recent);
  assert.equal(missStep.reportLines.length, 1);
  assert.match(missStep.reportLines[0], /T-734: no builder/);
  assert.ok(missStep.stalledIds.includes('T-734'));
});

test('AC-2: Idle-queue signal does not report no builders while a Gemini dispatch process runs', () => {
  const geminiCmdlines = [
    'node ~/slopdog/v2/scripts/dispatch.mjs --engine gemini --ticket T-734',
  ];
  assert.equal(
    hasAnyCursorAgent(geminiCmdlines),
    true,
    'hasAnyCursorAgent returns true for Gemini dispatch process',
  );

  const t1 = Date.parse('2026-10-11T12:05:00.000Z');
  const step = advanceIdleQueue(
    { misses: 1 },
    {
      dispatchableIds: ['T-735'],
      hasBuilders: hasAnyCursorAgent(geminiCmdlines),
      now: t1,
    },
  );
  assert.equal(step.next.misses, 0, 'misses reset to 0 when builder is running');
  assert.equal(step.reportText, null, 'no idle queue report is generated');
});

