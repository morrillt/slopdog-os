#!/usr/bin/env node
// focus-question-watch — T-478. Run every few seconds by a standing systemd timer
// (focus-question-watch.timer). No-ops at once unless context.yaml's `focus_mode: on` (the
// same gate unstucker.mjs's --mode focus uses). While on: polls the board's own ticket list
// (GET /api/runner/tickets, the same source the board's own client poll hits), finds any
// open question not from Todd, not a reply, not resolved (openQuestionsOf's own definition —
// the board's GET already filters to this shape) that this machine hasn't seen before, and
// queues it. If no "Focus question" popup window is open, pops the next queued question and
// launches focus-question-popup.mjs for it. One popup at a time; a second question waits.
//
//   node focus-question-watch.mjs             one pass (what the timer calls)
//   node focus-question-watch.mjs --dry-run   say what it would do, queue nothing, open nothing
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import yaml from "js-yaml";

const dryRun = process.argv.includes("--dry-run");
const HERE = dirname(fileURLToPath(import.meta.url));
const POPUP_SCRIPT = join(HERE, "focus-question-popup.mjs");
const CONTEXT_FILE = join(homedir(), "slopdog/v2/context.yaml");
const STATE_FILE = join(homedir(), "slopdog/v2/.focus-question-watch.json");
const BOARD_API = "http://localhost:3008";
const TITLE = "Focus question";

let ctx = {};
try { ctx = yaml.load(readFileSync(CONTEXT_FILE, "utf8")) || {}; } catch {}
if (ctx.focus_mode !== "on") {
  console.log(`focus_mode is ${ctx.focus_mode || "off"}: nothing to do`);
  process.exit(0);
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { seen: [], queue: [] };
  try { return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { return { seen: [], queue: [] }; }
}
function saveState(state) {
  if (dryRun) return;
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function popupOpen() {
  try {
    const tree = JSON.parse(execFileSync("i3-msg", ["-t", "get_tree"], { encoding: "utf8" }));
    let found = false;
    const walk = (n) => {
      if (n.window && new RegExp(`^${TITLE}$`).test(n.name || "")) found = true;
      for (const k of [...(n.nodes || []), ...(n.floating_nodes || [])]) walk(k);
    };
    walk(tree);
    return found;
  } catch { return false; }
}

// The same "genuinely open, asked by a desk" test wtf-lightbox.mjs's openFocusQuestions uses.
function isOpenQuestion(it) {
  return it && it.speaker !== "user" && !it.replyTo && it.resolved !== true && (it.text || it.question);
}

async function main() {
  const res = await fetch(`${BOARD_API}/api/runner/tickets`);
  if (!res.ok) { console.log(`board GET failed: HTTP ${res.status}`); process.exit(0); }
  const tickets = await res.json();

  const state = loadState();
  const seen = new Set(state.seen);
  const queueKeys = new Set(state.queue.map((q) => `${q.filePath}#${q.questionId}`));
  const stillOpen = new Set();
  let added = 0;

  for (const t of tickets) {
    for (const q of t.openQuestions || []) {
      const key = `${t.filePath}#${q.id}`;
      stillOpen.add(key);
      if (seen.has(key) || queueKeys.has(key)) continue;
      state.queue.push({ filePath: t.filePath, questionId: q.id, ticketId: t.id });
      seen.add(key);
      added++;
    }
  }
  // Drop queued entries whose question was answered/resolved before its popup ever opened.
  state.queue = state.queue.filter((q) => stillOpen.has(`${q.filePath}#${q.questionId}`));
  state.seen = [...seen].filter((k) => stillOpen.has(k) || state.queue.some((q) => `${q.filePath}#${q.questionId}` === k));

  if (added) console.log(`queued ${added} new question(s)`);

  if (!popupOpen() && state.queue.length) {
    const next = state.queue.shift();
    console.log(`opening popup: ${next.ticketId} ${next.questionId}`);
    if (!dryRun) execFileSync(process.execPath, [POPUP_SCRIPT, next.filePath, next.questionId], { stdio: "ignore" });
  }

  saveState(state);
}

main().catch((e) => { console.error(e.message); process.exit(0); });
