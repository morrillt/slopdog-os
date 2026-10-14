#!/usr/bin/env node
// ask-todd — T-491. The one way a desk writes a board question: runs the do's-and-don'ts
// check (check.mjs) on the drafted text first, and only writes the ticket's
// `questions.items` entry when the draft is clean. A dirty draft is refused, nothing
// written, so the desk rewrites and calls again.
//
//   node ask-todd.mjs <ticket-file-path> --asked-by <lane> --text-file <path>
//   node ask-todd.mjs <ticket-file-path> --asked-by <lane> --text-file <path> --force
//   --live writes live: true on the item (answering needs Todd at a real browser)
//
// --force skips the check (never used by a desk directly; only for the worked bad-example
// test in SKILL.md, which deliberately writes the known-bad T-471 q1 text to prove the
// checker would have caught it).
//
// Writes only `questions:` in the ticket's YAML frontmatter (status: open, updated: today,
// the new item appended with the next qN id, resolved: false). The ticket's body status
// line and task-list.md row are each desk's own existing job, unchanged by this skill —
// see SKILL.md's "What this doesn't do".
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { checkDraft, AGENT_CAN_DO_HINT } from "./check.mjs";

const args = process.argv.slice(2);
const ticketPath = args[0];
const opt = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const force = args.includes("--force");
const live = args.includes("--live");
const askedBy = opt("--asked-by");
const textFile = opt("--text-file");

if (!ticketPath || !askedBy || !textFile) {
  console.error("usage: ask-todd.mjs <ticket-file-path> --asked-by <lane> --text-file <path> [--live] [--force]");
  process.exit(2);
}

const text = readFileSync(textFile, "utf8").replace(/\n+$/, "");

if (!force) {
  const violations = checkDraft(text, { live });
  if (violations.length) {
    console.error(`ask-todd: draft fails the do's-and-don'ts check, nothing written:`);
    for (const v of violations) console.error(`  ${v.rule} (line ${v.line}): ${v.text}`);
    if (violations.some((v) => v.rule === "agent-can-do")) console.error(`  agent-can-do: ${AGENT_CAN_DO_HINT}`);
    process.exit(1);
  }
}

const raw = readFileSync(ticketPath, "utf8");
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (!fmMatch) { console.error(`ask-todd: no YAML frontmatter in ${ticketPath}`); process.exit(2); }

const fm = yaml.load(fmMatch[1]) || {};
fm.questions ||= { status: "none", updated: "", items: [] };
fm.questions.items ||= [];

const nextNum = fm.questions.items
  .map((it) => /^q(\d+)$/.exec(it.id || ""))
  .filter(Boolean)
  .reduce((max, m) => Math.max(max, Number(m[1])), 0) + 1;
const id = `q${nextNum}`;
const today = new Date().toISOString().slice(0, 10);
const nowIso = new Date().toISOString();

const ticketOwner = fm.id ? String(fm.id) : null;
fm.questions.items.push({
  id,
  speaker: "ai",
  asked_by: askedBy,
  timestamp: nowIso,
  resolved: false,
  ...(ticketOwner ? { owner: ticketOwner } : {}),
  ...(live ? { live: true } : {}),
  text,
});
fm.questions.status = "open";
fm.questions.updated = today;

const newFm = yaml.dump(fm, { lineWidth: -1, noRefs: true });
const newRaw = raw.slice(0, fmMatch[0].length) === fmMatch[0]
  ? `---\n${newFm}---\n` + raw.slice(fmMatch[0].length)
  : null;
if (!newRaw) { console.error("ask-todd: frontmatter boundary mismatch, refusing to write"); process.exit(2); }

writeFileSync(ticketPath, newRaw);
console.log(`wrote ${id} to ${ticketPath} (asked_by: ${askedBy})`);
