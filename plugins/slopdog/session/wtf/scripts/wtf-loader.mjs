#!/usr/bin/env node
// wtf-loader — the context for /slopdog:wtf (T-443): every ticket, project and batch in
// ~/slopdog/tasks touched in the last N hours, as one compact text for the answer.
// A ticket counts when its file changed in the window; it prints its board status, title,
// worker, open questions and the Progress notes dated inside the window (else its latest).
//
//   wtf-loader.mjs [--hours 6] [--tasks ~/slopdog/tasks]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

const { values: opt } = parseArgs({
  options: { hours: { type: "string", default: "6" }, tasks: { type: "string", default: join(homedir(), "slopdog/tasks") } },
});
const hours = Number(String(opt.hours).replace(/h$/, "")) || 6;
const since = Date.now() - hours * 3600_000;
const TASKS = opt.tasks;
const NOTES_PER_TICKET = 4;
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const recent = (dir) => {
  let names = [];
  try { names = readdirSync(dir); } catch { return []; }
  return names.filter((n) => n.endsWith(".md") && n !== "TEMPLATE.md")
    .map((n) => ({ path: join(dir, n), mtime: statSync(join(dir, n)).mtimeMs }))
    .filter((f) => f.mtime >= since)
    .sort((a, b) => b.mtime - a.mtime);
};

// Board status per ticket file, from its task-list.md row: "| 🟡 | [title](tickets/x.md)".
const status = new Map();
for (const line of readFileSync(join(TASKS, "task-list.md"), "utf8").split("\n")) {
  const m = line.match(/^\|\s*(\S+)\s*\|\s*\[[^\]]*\]\((tickets\/[^)]+)\)/);
  if (m) status.set(m[2], m[1]);
}

const front = (s, key) => s.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?`, "m"))?.[1]?.trim() ?? "";
const title = (s) => s.match(/^# (.+)$/m)?.[1]?.trim() ?? "";

// Progress notes are "- YYYY-MM-DD HH:MM · Who · text" (UTC), newest first.
function notes(s) {
  const sec = s.split(/^## Progress notes\s*$/m)[1];
  if (!sec) return [];
  const body = sec.split(/^## /m)[0];
  return body.split(/\n(?=- \d{4}-\d{2}-\d{2} \d{2}:\d{2})/).map((b) => b.trim())
    .filter((b) => /^- \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(b))
    .map((b) => {
      const t = Date.parse(b.slice(2, 18).replace(" ", "T") + ":00Z");
      return { t, text: b.slice(2).replace(/\s+/g, " ") };
    });
}

const out = [`# Slopdog activity, last ${hours}h (since ${new Date(since).toISOString().slice(0, 16)}Z)`, ""];

// Board counts from the row marks (T-661): ready to build never includes a paused ticket,
// and paused is its own number beside it.
const marks = {};
for (const m of status.values()) marks[m] = (marks[m] || 0) + 1;
const paused = Object.entries(marks).filter(([m]) => m.startsWith("⏸")).reduce((n, [, c]) => n + c, 0);
out.push(`Board: ${marks["🔵"] || 0} ready to build · ${paused} paused · ${marks["🟡"] || 0} being built · ${marks["🔴"] || 0} blocked · ${marks["🟠"] || 0} waiting on Todd`, "");

const tickets = recent(join(TASKS, "tickets"));
out.push(`## Tickets (${tickets.length})`);
for (const f of tickets) {
  const s = readFileSync(f.path, "utf8");
  const rel = relative(TASKS, f.path);
  const openQ = (s.match(/resolved:\s*false/g) || []).length;
  const head = [status.get(rel) ?? "?", front(s, "id"), title(s)].join(" ");
  const meta = [front(s, "worker") && `worker ${front(s, "worker")}`, front(s, "priority") && `priority ${front(s, "priority")}`,
    openQ && `${openQ} open question(s) for Todd`].filter(Boolean).join(" · ");
  out.push(`- ${clip(head, 160)}${meta ? ` [${meta}]` : ""}`);
  const all = notes(s);
  const inWindow = all.filter((n) => n.t >= since);
  for (const n of (inWindow.length ? inWindow : all.slice(0, 1)).slice(0, NOTES_PER_TICKET)) out.push(`  - ${clip(n.text, 400)}`);
}

const archived = recent(join(TASKS, "tickets/archive"));
if (archived.length) {
  out.push("", `## Archived in the window (${archived.length})`);
  for (const f of archived) { const s = readFileSync(f.path, "utf8"); out.push(`- ${front(s, "id")} ${clip(title(s), 140)}`); }
}

for (const [dir, label] of [["projects", "Projects"], ["batches", "Batches"]]) {
  const files = recent(join(TASKS, dir));
  if (!files.length) continue;
  out.push("", `## ${label} changed (${files.length})`);
  for (const f of files) out.push(`- ${relative(TASKS, f.path)}: ${clip(title(readFileSync(f.path, "utf8")), 140)}`);
}

console.log(out.join("\n"));
