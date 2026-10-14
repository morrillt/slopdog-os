#!/usr/bin/env node
// resume — SessionStart hook (startup|clear). Three jobs, nothing else:
//
// 1. On /clear, delete the desk's .over-ceiling (Todd's OK to run past the hard
//    context limit is spent by the clear, T-277).
// 2. On /clear, move the lane's pin (.slopdog-herdr-sessions.json in herdr, else
//    .slopdog-sessions.json) to the new session id (T-314), so the next build resumes the
//    post-clear conversation. (The desk's herdr identity is its pane label, which a clear keeps.)
// 3. Print the team focus from context.yaml (T-457-3), and point at PICKUP.md
//    when the folder has one.
//
// It used to carry the previous session's goals and goal-file Pickups onto a new
// status panel; that layer went with T-467. Continuity across a clear is PICKUP.md
// (read by /slopdog:pickup) plus jobs 1 and 2 here.
import { readLanesDocument } from '../../../scripts/lib/registry.mjs'
import { readFileSync, existsSync, realpathSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";

const HOME = process.env.HOME;
let payload = {};
try { payload = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch {}
const cwd = payload.cwd || process.cwd();
const sid = payload.session_id || "";
// A clear spends Todd's OK (written by Tyrion) to run past the hard limit (T-277): delete the desk's
// .over-ceiling. The desk folder is found the way context-rot.mjs finds it: walking up from cwd
// inside ~/slopdog/v2/desks/, the first registry lane folder or folder holding a CLAUDE.md,
// skipping a department folder that has lane folders under it (desks/build, T-684).
if (payload.source === "clear") {
  try {
    const v2home = realpathSync(`${HOME}/slopdog/v2`);
    const desks = join(v2home, "desks");
    let folders = [];
    try {
      folders = Object.values(readLanesDocument({ v2: v2home }))
        .filter((l) => l && typeof l === "object" && l.folder).map((l) => join(v2home, l.folder));
    } catch {}
    for (let d = realpathSync(cwd); d.startsWith(desks + "/"); d = dirname(d)) {
      const isLane = folders.includes(d);
      if (!isLane && folders.some((f) => f.startsWith(d + "/"))) continue;
      if (!isLane && !existsSync(join(d, "CLAUDE.md"))) continue;
      rmSync(join(d, ".over-ceiling"), { force: true });
      break;
    }
  } catch {}
  // The same clear moves the lane's pin in .slopdog-sessions.json to this new session id (T-314),
  // so the launcher's next build resumes the post-clear conversation, not the one before it.
  // The lane is the registry key whose folder is exactly this cwd. v2 is three levels up
  // from this file (plugins/slopdog/hooks/), which Node resolves through the skills symlink.
  if (sid && !process.env.BROZ_TURNLOG) {
    try {
      const v2 = realpathSync(new URL("../../..", import.meta.url).pathname);
      const lanes = readLanesDocument({ v2: v2 });
      const here = realpathSync(cwd);
      const lane = Object.keys(lanes).find((k) => k !== "_" && !lanes[k].host && join(v2, lanes[k].folder || k) === here);
      if (lane) {
        const { pinLane } = await import(join(v2, "scripts", "session-pin.mjs"));
        // A herdr desk keeps its pin in its own file (herdr-swarm.mjs), never the tmux screen's.
        pinLane(join(v2, process.env.HERDR_ENV === "1" ? ".slopdog-herdr-sessions.json" : ".slopdog-sessions.json"), lane, sid);
      }
    } catch {}
  }
}
if (process.env.BROZ_TURNLOG) process.exit(0);           // the summariser's own claude -p run
// A folder that carries its own .slopdog/ is a separate Slopdog variant (e.g. ~/sd on
// the Linux box) and runs its own board, not this one. Leave it alone.
if (existsSync(join(cwd, ".slopdog"))) process.exit(0);

// T-457-3: the team focus, on every startup and /clear, before anything below can exit early.
// context.yaml's `focus:` line (set only by /slopdog:set-focus) and its `focus_tasks` table
// (refreshed by update-focus-tasks.mjs). One read per session start; nothing per turn.
try {
  const yaml = (await import("js-yaml")).default;
  const v2 = realpathSync(new URL("../../..", import.meta.url).pathname);
  const ctx = yaml.load(readFileSync(join(v2, "context.yaml"), "utf8")) || {};
  if (ctx.focus) {
    const rows = Array.isArray(ctx.focus_tasks) ? ctx.focus_tasks : [];
    const table = rows.length
      ? "\n\n| Ticket | Status | Toward the focus |\n| --- | --- | --- |\n" +
        rows.map((r) => `| ${r.ticket} | ${r.status ?? ""} | ${String(r.relation ?? "").replace(/\|/g, "/")} |`).join("\n")
      : "\n\nNo tickets are in flight toward it (focus_tasks is empty).";
    console.log(`## Team focus (~/slopdog/v2/context.yaml)\n\n${ctx.focus}${table}\n`);
  }
} catch {}

if (existsSync(join(cwd, "PICKUP.md"))) {
  console.log("This folder has a PICKUP.md: read it (/slopdog:pickup) and carry on from the ticket it names, unless Todd's first message says otherwise.");
}
