#!/usr/bin/env node
// repo-sweep — "is everything clean?" for the repos a session touches.
//   repo-sweep.mjs [dir ...]      default: the usual suspects below
// Prints one line per dir: clean / dirty (n files) / unpushed (n) / not a repo.
// Exit 1 if anything is dirty or unpushed.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const HOME = process.env.HOME;
const DEFAULT = [
  `${HOME}/.claude`, `${HOME}/.slopdog`, `${HOME}/slopdog/notes`,
  `${HOME}/slopdog`, `${HOME}/slopdog/tasks`, `${HOME}/slopdog/dev`,
];
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const git = (d, ...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

let bad = 0;
for (const d of dirs) {
  if (!existsSync(d)) continue;
  let top;
  try { top = git(d, "rev-parse", "--show-toplevel"); } catch { console.log(`not a repo   ${d}`); continue; }
  if (top !== d.replace(/\/$/, "")) { console.log(`inside repo  ${d}  (→ ${top})`); continue; }
  const dirty = git(d, "status", "--porcelain").split("\n").filter(Boolean);
  let unpushed = [];
  try { unpushed = git(d, "log", "--oneline", "@{u}..HEAD").split("\n").filter(Boolean); } catch { unpushed = ["(no upstream)"]; }
  const parts = [];
  if (dirty.length) parts.push(`dirty (${dirty.length}): ${dirty.slice(0, 4).map((l) => l.trim()).join(", ")}${dirty.length > 4 ? ", …" : ""}`);
  if (unpushed.length) parts.push(`unpushed (${unpushed.length})`);
  if (parts.length) { bad++; console.log(`NOT CLEAN    ${d}  ${parts.join("; ")}`); }
  else console.log(`clean        ${d}  ${git(d, "log", "--oneline", "-1")}`);
}
process.exit(bad ? 1 : 0);
