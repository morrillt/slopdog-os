#!/usr/bin/env node
// pickup-report — the reading half of /slopdog:pickup (T-107; anchored on the ticket in
// hand since T-467).
//
//   pickup-report.mjs [--dir <desk folder>] [--session <id>, accepted and ignored]
//
// Reads <desk folder>/PICKUP.md (--dir, default cwd) and prints, in order:
//
//   <current-focus.md, verbatim>        (the desk's standing file, when it has one; T-711)
//   retro: on — …                       (only when <desk>/.retro-mode holds `on`; T-711)
//   desk: <path> · <T-nnn> · written <ISO>
//   answer: <text>                      (any board answer left in inbox/, T-318)
//   ticket: T-nnn · <status line> · <ticket file>
//   resume: T-nnn — read <path>/PICKUP.md
//
// The first T-nnn (or T-nnn-n) in PICKUP.md is the ticket in hand, the same rule as
// self-clear.mjs and pickup-check.mjs. The ticket line is looked up in
// ~/slopdog/tasks/tickets by front-matter `id:`, so the skill sees the board's status
// beside the note's. Exit 0 when the note exists, 2 when there is no PICKUP.md.
import { readFileSync, existsSync, statSync, readdirSync, mkdirSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { deskTaskAnchor, identityProblem } from "../../../../../scripts/lib/pickup-owner.mjs";

const HOME = process.env.HOME;
const TICKETS = `${HOME}/slopdog/tasks/tickets`;
const TICKET_RE = /\bT-\d+(?:-\d+)?\b/;   // the self-clear.mjs rule

let desk = process.cwd();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--session") i++;
  else if (argv[i].startsWith("--session=")) {}
  else if (argv[i] === "--dir") desk = argv[++i] || desk;
  else if (argv[i].startsWith("--dir=")) desk = argv[i].slice(6);
  else if (argv[i] === "--help" || argv[i] === "-h") { console.log("usage: pickup-report.mjs [--dir <desk folder>]"); process.exit(0); }
}

// The desk note first: it is the ticket in hand, and self-clear.mjs already refused to
// clear without a fresh one.
const note = resolve(desk, "PICKUP.md");
// T-711: the desk's standing file comes before everything, the same current-focus.md mode.mjs
// prints on every prompt, and then whether retro mode is on (`.retro-mode` holds on or off;
// the slopdog-tools mod's Retro toggle writes it). Printed even when there is no note.
try { const focus = readFileSync(resolve(desk, "current-focus.md"), "utf8").trim(); if (focus) console.log(focus); } catch {}
let retro = false;
try { retro = readFileSync(resolve(desk, ".retro-mode"), "utf8").trim().toLowerCase() === "on"; } catch {}
if (retro) console.log("retro: on — before resuming, run the pickup skill's retro step");
// The pickup is running: release the hold self-clear put on the desk's other wakers (lib/desk-pane.mjs pickupPending).
try { (await import("node:fs")).rmSync(resolve(desk, ".pickup-pending"), { force: true }); } catch {}
if (!existsSync(note)) { console.log(`no PICKUP.md in ${resolve(desk)} — nothing to resume`); process.exit(2); }
const noteText = readFileSync(note, "utf8");
// A note another desk wrote into this folder (Herdr.md D4): say so first, and resume nothing from it.
const crossed = identityProblem(desk, noteText);
if (crossed) { console.log(`CROSSED NOTE: ${crossed}`); console.log("resume: nothing — the note is not this desk's; tell Todd"); process.exit(3); }
const ticket = (noteText.match(TICKET_RE) || [""])[0];
// A desk with its own task system names a tasks/<name>.md under its folder instead (deskTaskAnchor).
const taskFile = ticket ? "" : deskTaskAnchor(desk, noteText);
const taskRel = taskFile ? `tasks/${taskFile.split("/").pop()}` : "";
console.log(`desk: ${note} · ${ticket || taskRel || "(no ticket named)"} · written ${statSync(note).mtime.toISOString()}`);

// T-318: a board answer this desk may have missed — the pane line is lost when the desk
// is offline, frozen, over the context hard limit, or mid another live question, but the
// board also drops the answer as a file in inbox/ (questions.ts, answerQuestion). Sweep
// for it here rather than guessing a "since last turn" window: any `-from-board-` file
// still sitting in inbox/ is one inbox-watch.mjs never got to deliver (or delivered while
// this desk could not act on it), so print it and archive it, the same as inbox-watch does.
const BOARD_ANSWER = /^\d{4}-\d{2}-\d{2}-(?:\d{4}-)?from-board-.+\.md$/i;
const inboxDir = resolve(desk, "inbox");
let answers = [];
try { answers = readdirSync(inboxDir).filter((f) => BOARD_ANSWER.test(f)).sort(); } catch {}
if (answers.length) {
  const archive = resolve(desk, "inbox-archive");
  mkdirSync(archive, { recursive: true });
  for (const f of answers) {
    let text = "";
    try { text = readFileSync(join(inboxDir, f), "utf8").trim(); } catch { continue; }
    console.log(`answer: ${text}`);
    try { renameSync(join(inboxDir, f), join(archive, f)); } catch {}
  }
}

// The ticket in hand, as the board has it now: its file and its status line.
if (taskFile) { console.log(`task: ${taskRel} · ${taskFile}`); console.log(`resume: ${taskRel} — read ${note}`); process.exit(0); }
if (!ticket) { console.log("resume: nothing — PICKUP.md names no ticket"); process.exit(0); }
let file = "", status = "(ticket file not found)";
try {
  for (const f of readdirSync(TICKETS)) {
    if (!f.endsWith(".md")) continue;
    const text = readFileSync(join(TICKETS, f), "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm || !new RegExp(`^id:\\s*["']?${ticket}["']?\\s*$`, "m").test(fm[1])) continue;
    file = join(TICKETS, f);
    const line = text.slice(fm[0].length).split("\n").find((l) => l.startsWith(`${ticket} · `));
    status = line ? line.slice(ticket.length + 3).trim() : "(no status line)";
    break;
  }
} catch {}
console.log(`ticket: ${ticket} · ${status}${file ? ` · ${file}` : ""}`);
console.log(`resume: ${ticket} — read ${note}`);
