// Tests for check.mjs's agent-can-do rule (Todd, 2026-10-08). Run: node --test check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDraft } from "./check.mjs";

const rules = (text, opts) => checkDraft(text, opts).map((v) => v.rule);

test("refuses asking Todd to create a Notion task", () => {
  assert.ok(rules("Question: Can you create a task in Notion for the menu work?").includes("agent-can-do"));
});

test("refuses asking Todd to run a command or install something", () => {
  assert.ok(rules("Question: You will need to run the update in a terminal.").includes("agent-can-do"));
  assert.ok(rules("Question: Could you please install the new printer driver?").includes("agent-can-do"));
  assert.ok(rules("Question: Which way?\n1. You change the setting yourself").includes("agent-can-do"));
});

test("refuses even when live, if no reason only Todd can do it", () => {
  assert.ok(rules("Question: Can you move the card in Slack?", { live: true }).includes("agent-can-do"));
});

test("live with a password or 2FA reason is allowed", () => {
  const t = "Question: Can you sign in to the bank site? It needs your password and the 2FA code on your phone.";
  assert.ok(!rules(t, { live: true }).includes("agent-can-do"));
  assert.ok(rules(t).includes("agent-can-do"), "same text without live is refused");
});

test("a plain decision question is clean", () => {
  assert.deepEqual(rules("Question: Should the daily summary come to this chat, or a separate channel?"), []);
});
