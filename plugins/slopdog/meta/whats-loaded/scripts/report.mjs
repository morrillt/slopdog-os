#!/usr/bin/env node
// report.mjs <session_id> [cwd]
//
// Renders what instruction files are in Claude's context right now.
//
// Source 1 (ground truth): ~/.local/state/claude-instructions.jsonl, written
//   by the InstructionsLoaded hook — filtered to this session_id.
// Source 2 (fallback): reconstruct from disk by walking the CLAUDE.md chain
//   the way Claude Code does. Used when the log has no rows for this session
//   (session started before the hook existed, or the hook isn't wired).
//
// Output is markdown. Token counts are estimates (bytes / 4).

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, join, relative } from "node:path";

const HOME = homedir();
const LOG = `${HOME}/.local/state/claude-instructions.jsonl`;
const [sessionId = "", cwdArg] = process.argv.slice(2);
const cwd = cwdArg ? resolve(cwdArg) : process.cwd();

const tilde = (p) => (p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);
const tok = (b) => (b == null ? "?" : `~${Math.round(b / 4).toLocaleString()}`);
const kb = (b) => (b == null ? "?" : `${(b / 1024).toFixed(1)} kB`);
const size = (p) => { try { return statSync(p).size; } catch { return null; } };

// ---------------------------------------------------------------------------
// Source 1: the log
// ---------------------------------------------------------------------------
function fromLog() {
  if (!existsSync(LOG) || !sessionId) return [];
  const rows = readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter((r) => r && r.session_id === sessionId);
  // Same file can fire more than once (e.g. after compaction). Keep the latest row per path.
  const byPath = new Map();
  for (const r of rows) byPath.set(r.file_path, r);
  return [...byPath.values()];
}

// ---------------------------------------------------------------------------
// Source 2: reconstruct from disk
// ---------------------------------------------------------------------------
function rulesIn(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...rulesIn(p));
    else if (ent.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function importsOf(file, depth = 0, seen = new Set()) {
  // `@path` tokens anywhere in the file, up to 4 hops (docs: max depth four).
  if (depth >= 4) return [];
  let text = "";
  try { text = readFileSync(file, "utf8"); } catch { return []; }
  const out = [];
  for (const m of text.matchAll(/(?:^|\s)@((?:~|\.{0,2}\/|\/)[^\s)]+)/g)) {
    let p = m[1];
    if (p.startsWith("~")) p = HOME + p.slice(1);
    p = resolve(dirname(file), p);
    if (!existsSync(p) || seen.has(p)) continue;
    seen.add(p);
    out.push({ file_path: p, memory_type: "import", load_reason: "include", parent_file_path: file, bytes: size(p) });
    out.push(...importsOf(p, depth + 1, seen));
  }
  return out;
}

function fromDisk() {
  const rows = [];
  const push = (file_path, memory_type, load_reason) => {
    if (existsSync(file_path)) rows.push({ file_path, memory_type, load_reason, parent_file_path: null, bytes: size(file_path) });
  };
  // User scope
  push(`${HOME}/.claude/CLAUDE.md`, "User", "session_start");
  for (const r of rulesIn(`${HOME}/.claude/rules`)) push(r, "User", "session_start");
  // Project scope: every directory from / down to cwd
  const chain = [];
  for (let d = cwd; ; d = dirname(d)) { chain.unshift(d); if (d === dirname(d)) break; }
  for (const d of chain) {
    if (d === HOME) continue; // ~/CLAUDE.md would be user scope territory; skip to avoid double counting
    push(join(d, "CLAUDE.md"), "Project", "session_start");
    push(join(d, ".claude", "CLAUDE.md"), "Project", "session_start");
    for (const r of rulesIn(join(d, ".claude", "rules"))) push(r, "Project", "session_start");
    push(join(d, "CLAUDE.local.md"), "Local", "session_start");
  }
  // Imports, from every eagerly-loaded file
  const seen = new Set(rows.map((r) => r.file_path));
  for (const r of [...rows]) rows.push(...importsOf(r.file_path, 0, seen));
  return rows;
}

// ---------------------------------------------------------------------------
// Auto memory (not an InstructionsLoaded event — always read from disk)
// ---------------------------------------------------------------------------
function autoMemory() {
  const slug = cwd.replaceAll("/", "-");
  const dir = `${HOME}/.claude/projects/${slug}/memory`;
  const index = join(dir, "MEMORY.md");
  if (!existsSync(index)) return { dir, index: null, entries: [] };
  const entries = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "MEMORY.md");
  return { dir, index, indexBytes: size(index), entries };
}

// ---------------------------------------------------------------------------
// Hooks that inject context at SessionStart (from settings files)
// ---------------------------------------------------------------------------
function sessionStartHooks() {
  const files = [
    `${HOME}/.claude/settings.json`,
    join(cwd, ".claude", "settings.json"),
    join(cwd, ".claude", "settings.local.json"),
  ];
  const out = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    let s; try { s = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
    for (const group of s.hooks?.SessionStart ?? []) {
      for (const h of group.hooks ?? []) out.push({ from: f, matcher: group.matcher ?? "(all)", command: h.command });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
let rows = fromLog();
let source = "InstructionsLoaded log (ground truth for this session)";
if (rows.length === 0) {
  rows = fromDisk();
  source = "reconstructed from disk — no log rows for this session. Sessions started after the hook was wired get the real thing. Verify with `/context all`.";
}

const total = rows.reduce((n, r) => n + (r.bytes ?? 0), 0);
const order = ["User", "Managed", "Project", "Local", "import"];
rows.sort((a, b) => order.indexOf(a.memory_type) - order.indexOf(b.memory_type) || a.file_path.localeCompare(b.file_path));

const lines = [];
lines.push(`## Instruction files in context`);
lines.push(``);
lines.push(`_Source: ${source}_`);
lines.push(`_cwd: ${tilde(cwd)}${sessionId ? ` · session ${sessionId.slice(0, 8)}…` : ""}_`);
lines.push(``);
lines.push(`| File | Scope | Loaded because | Size | ≈tokens |`);
lines.push(`| --- | --- | --- | ---: | ---: |`);
for (const r of rows) {
  const why = r.load_reason === "include" && r.parent_file_path
    ? `@-imported by ${tilde(r.parent_file_path)}`
    : r.load_reason === "path_glob_match"
      ? `path rule matched${r.trigger_file_path ? ` (${tilde(r.trigger_file_path)})` : ""}`
      : r.load_reason === "nested_traversal"
        ? `lazy — read a file under it${r.trigger_file_path ? ` (${tilde(r.trigger_file_path)})` : ""}`
        : r.load_reason === "compact" ? "re-loaded after compaction" : "session start";
  lines.push(`| \`${tilde(r.file_path)}\` | ${r.memory_type} | ${why} | ${kb(r.bytes)} | ${tok(r.bytes)} |`);
}
lines.push(`| **Total** | | | **${kb(total)}** | **${tok(total)}** |`);
lines.push(``);

const am = autoMemory();
lines.push(`## Auto memory`);
lines.push(``);
if (am.index) {
  lines.push(`\`${tilde(am.index)}\` — ${kb(am.indexBytes)}, ${am.entries.length} entr${am.entries.length === 1 ? "y" : "ies"}: ${am.entries.map((e) => `\`${e}\``).join(", ") || "(none)"}`);
} else {
  lines.push(`None. Would live at \`${tilde(am.dir)}/\` (keyed to cwd, so it does not follow you to other folders).`);
}
lines.push(``);

const hooks = sessionStartHooks();
lines.push(`## SessionStart hooks (inject into Messages, not Memory files)`);
lines.push(``);
if (hooks.length === 0) lines.push(`None configured for this cwd.`);
for (const h of hooks) lines.push(`- \`${h.command.replaceAll('"', "")}\` — matcher \`${h.matcher}\` — from \`${tilde(h.from)}\``);
lines.push(``);

process.stdout.write(lines.join("\n") + "\n");
