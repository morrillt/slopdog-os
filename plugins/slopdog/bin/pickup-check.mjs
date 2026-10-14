#!/usr/bin/env node
// pickup-check — the contract test between /slopdog:clear-to-close (writer) and
// /slopdog:pickup (reader). T-141; anchored on the ticket in hand since T-467, when the
// goal layer (and its goal-file Pickups) went away.
//
//   pickup-check.mjs [--dir <desk folder>] [--max-age <minutes>]
//
// What: <dir>/PICKUP.md (--dir, else cwd) must
//   1. be fresh: written in the last --max-age minutes (default 10, the self-clear.mjs limit);
//   2. name a ticket: the first T-nnn or T-nnn-n in it is the ticket in hand (the
//      self-clear.mjs rule);
//      A desk with its own task system (no board tickets) names a `tasks/<name>.md` under its
//      folder instead, and that file is the anchor (scripts/lib/pickup-owner.mjs deskTaskAnchor);
//   3. be newer than that ticket's file (~/slopdog/tasks/tickets/*.md whose front matter
//      `id:` matches), or than the desk task file;
//   4. be this desk's own: in a desk folder, a note whose title or "## Who" names another
//      desk is a crossed note a sidekick wrote (Herdr.md D4; scripts/lib/pickup-owner.mjs).
// A desk folder (a `folder` in the registry) with no PICKUP.md fails; any other folder
// with no PICKUP.md passes with a note, since only desks write one.
// Why: a PICKUP.md older than the ticket it describes would make /slopdog:pickup resume
//   from the wrong place.
//
// --session <id> is accepted and ignored, so older callers keep working.
// Exit 0 when everything passes (one `ok` line). Exit 1 with `FAIL ...` lines on stderr.
// Exit 2 on a usage error.
import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from "node:fs";
import { basename, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deskTaskAnchor, identityProblem } from "../../../scripts/lib/pickup-owner.mjs";
import { readLanesDocument, V2_DIR } from "../../../scripts/lib/registry.mjs";

const HOME = process.env.HOME;
const TICKETS = `${HOME}/slopdog/tasks/tickets`;
const TICKET_RE = /\bT-\d+(?:-\d+)?\b/;   // the self-clear.mjs rule

// ── args ────────────────────────────────────────────────────────────────────────
const usage = () => { console.error("usage: pickup-check.mjs [--dir <desk folder>] [--max-age <minutes>]"); process.exit(2); };
let deskDir = process.cwd();
let maxAgeMin = 10;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--session") { i++; }
  else if (a.startsWith("--session=")) { /* ignored */ }
  else if (a === "--dir") { deskDir = argv[++i] || usage(); }
  else if (a.startsWith("--dir=")) { deskDir = a.slice(6); }
  else if (a === "--max-age") { maxAgeMin = Number(argv[++i]); if (!(maxAgeMin > 0)) usage(); }
  else usage();
}

const isDesk = (dir) => {
  let lanes = {};
  try { lanes = readLanesDocument({ v2: V2_DIR }); } catch { return false; }
  const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
  const here = real(dir);
  return Object.values(lanes).some((l) => l && typeof l === "object" && l.folder && real(resolve(V2_DIR, l.folder)) === here);
};

const iso = (ms) => new Date(ms).toISOString();
const note = join(deskDir, "PICKUP.md");
if (!existsSync(note)) {
  if (isDesk(deskDir)) { console.error(`FAIL ${resolve(deskDir)} is a desk but has no PICKUP.md`); process.exit(1); }
  console.log(`no PICKUP.md in ${resolve(deskDir)} and it is not a desk folder; nothing to check`);
  process.exit(0);
}

const failures = [];
const noteMs = statSync(note).mtimeMs;
const ageMin = (Date.now() - noteMs) / 60000;
if (ageMin > maxAgeMin) failures.push(`${note} is ${Math.round(ageMin)} min old (limit ${maxAgeMin}); rewrite it`);

const noteText = readFileSync(note, "utf8");
const crossed = identityProblem(deskDir, noteText);
if (crossed) failures.push(crossed);
let id = (noteText.match(TICKET_RE) || [])[0];
let ticketFile = "";
const taskFile = id ? "" : deskTaskAnchor(deskDir, noteText);
if (taskFile) {
  id = `tasks/${basename(taskFile)}`;
  ticketFile = taskFile;
  const ms = statSync(taskFile).mtimeMs;
  if (ms > noteMs) failures.push(`PICKUP.md is older than ${taskFile} (edited ${iso(ms)} after the note at ${iso(noteMs)})`);
}
else if (!id) failures.push(`${note} names no ticket (no T-nnn, and no tasks/<name>.md under the desk); it must say what is in hand`);
else if (existsSync(TICKETS)) {
  for (const f of readdirSync(TICKETS)) {
    if (!f.endsWith(".md")) continue;
    const p = join(TICKETS, f);
    let head = "";
    try { head = readFileSync(p, "utf8").slice(0, 2000); } catch { continue; }
    const m = head.match(/^id:\s*(T-\d+(?:-\d+)?)\s*$/m);
    if (m && m[1] === id) { ticketFile = p; break; }
  }
  if (!ticketFile) failures.push(`${id} has no ticket file under ${TICKETS}`);
  else {
    const ms = statSync(ticketFile).mtimeMs;
    if (ms > noteMs) failures.push(`PICKUP.md is older than ${ticketFile} (edited ${iso(ms)} after the note at ${iso(noteMs)})`);
  }
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`ok PICKUP.md names ${id} (in hand), is ${Math.round(ageMin)} min old, and is newer than ${ticketFile}`);
