#!/usr/bin/env node
// scoped — wrap any hook command so it only runs when the session's cwd is
// under ~/slopdog or ~/.claude (the slopdog desks and meta work). Everywhere else —
// ~/sd, or any other unrelated project — it reads the same hook JSON off
// stdin, does nothing, and exits 0 silently.
//
// Root cause this fixes: ~/.claude/skills/slopdog is a symlink to this plugin
// (bin/slopdog use vN retargets it), which makes it auto-load as a personal
// skills-dir plugin — so hooks.json fires in EVERY Claude Code session on this
// machine, not just inside ~/slopdog. goal-proposal.mjs said as much in its own
// header: "Runs on EVERY prompt in EVERY session on this machine." The
// call (2026-09-09, v1): gate it here, once, rather than editing every script. Ported to v2 by T-149.
//
// Usage in hooks.json: "scoped.mjs <script> [args...]" — reads stdin once,
// JSON.parses it for `cwd`, then re-feeds the SAME raw stdin to the wrapped
// script (child processes only get to read stdin once, so we buffer it here
// rather than piping the original stream through).
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [, , script, ...args] = process.argv;
if (!script) process.exit(0);

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const raw = Buffer.concat(chunks);

function inScope() {
  let payload;
  try { payload = JSON.parse(raw.toString("utf8") || "{}"); } catch { return false; }
  if (!payload.cwd) return false;
  let cwd;
  try { cwd = realpathSync(payload.cwd); } catch { return false; }
  const home = homedir();
  const roots = [join(home, "slopdog"), join(home, ".claude")].map((p) => {
    try { return realpathSync(p); } catch { return p; }
  });
  return roots.some((root) => cwd === root || cwd.startsWith(root + "/"));
}

if (!inScope()) process.exit(0);

const child = spawn(script, args, { stdio: ["pipe", "inherit", "inherit"] });
child.stdin.end(raw);
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  process.stderr.write(`scoped.mjs: cannot run ${script}: ${err?.code ?? err}\n`);
  process.exit(0);
});
