#!/usr/bin/env node
// small-text — pop a thin editor pane directly above the caller's cmux pane.
//
//   small-text.mjs [--rows N] [--file PATH] [--cmd "COMMAND"] [--focus]
//
//   --rows N      height in text rows (default 5)
//   --file PATH   file to open (default ./notes.md, created if missing)
//   --cmd CMD     command to run instead of the editor (overrides --file)
//   --focus       leave the cursor in the new pane (default: hand it back)
//
// Prints the new pane and surface refs on stdout.

import { execFileSync } from "node:child_process";
import { closeSync, existsSync, openSync } from "node:fs";
import { resolve } from "node:path";

const CMUX =
  process.env.CMUX_CLAUDE_TEAMS_CMUX_BIN ||
  "/Applications/cmux.app/Contents/Resources/bin/cmux";

const args = process.argv.slice(2);
const opt = { rows: 5, file: "notes.md", cmd: null, focus: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--rows") opt.rows = Number(args[++i]);
  else if (a === "--file") opt.file = args[++i];
  else if (a === "--cmd") opt.cmd = args[++i];
  else if (a === "--focus") opt.focus = true;
  else if (a === "-h" || a === "--help") {
    console.log("usage: small-text.mjs [--rows N] [--file PATH] [--cmd CMD] [--focus]");
    process.exit(0);
  } else die(`unknown arg: ${a}`);
}
if (!Number.isInteger(opt.rows) || opt.rows < 1) die("--rows must be a positive integer");

function die(msg) { console.error(`small-text: ${msg}`); process.exit(1); }
function cmux(...a) { return execFileSync(CMUX, a, { encoding: "utf8" }).trim(); }
function cmuxJson(...a) { return JSON.parse(cmux(...a)); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Who called us — that's the pane we split above and the pane we refocus.
const me = cmuxJson("identify").caller;
const workspace = me.workspace_ref;

// Default: an editor on the notes file. $EDITOR if set, else nvim > vim > nano.
if (!opt.cmd) {
  const path = resolve(opt.file);
  if (!existsSync(path)) closeSync(openSync(path, "a"));
  const editor = process.env.EDITOR || firstOnPath("nvim", "vim", "nano") || "vi";
  opt.cmd = `${editor} ${shellQuote(path)}`;
}

// 1. split upward, unfocused
const out = cmux("new-split", "up", "--surface", me.surface_ref, "--focus", "false", "--workspace", workspace);
const surface = (out.match(/surface:\d+/) || [])[0];
if (!surface) die(`could not parse new-split output: ${out}`);
await sleep(300);

// 2. find the pane that now holds the new surface
const panes = () => cmuxJson("list-panes", "--workspace", workspace, "--json").panes;
const mine = () => panes().find((p) => p.surface_refs.includes(surface));
const caller = () => panes().find((p) => p.ref === me.pane_ref);
let pane = mine();
if (!pane) die(`new surface ${surface} not found in any pane`);

// 3. run the command in it
cmux("send", "--surface", surface, "--workspace", workspace, opt.cmd + "\n");

// 4. shrink it. Dragging the caller pane's top border up (-U) is what moves
//    the shared divider; --amount is in pixels. Two passes: cmux rounds to
//    whole cells, so measure and correct once.
const chrome = 40; // px of pane frame around the text grid, measured 2026-08-31
for (let pass = 0; pass < 2; pass++) {
  pane = mine();
  const target = opt.rows * pane.cell_height_px + chrome;
  const delta = Math.round(pane.pixel_frame.height - target);
  if (Math.abs(delta) < pane.cell_height_px / 2) break;
  cmux("resize-pane", "--pane", me.pane_ref, "--workspace", workspace, delta > 0 ? "-U" : "-D", "--amount", String(Math.abs(delta)));
  await sleep(250);
}

// 5. give the cursor back
if (!opt.focus) cmux("focus-pane", "--pane", me.pane_ref, "--workspace", workspace);
else cmux("focus-pane", "--pane", pane.ref, "--workspace", workspace);

pane = mine();
console.log(`${pane.ref} ${surface} rows=${pane.rows}`);

function firstOnPath(...names) {
  for (const n of names) {
    try { execFileSync("which", [n], { stdio: "ignore" }); return n; } catch {}
  }
  return null;
}
function shellQuote(s) { return `'${s.replace(/'/g, `'\\''`)}'`; }
