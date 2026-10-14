#!/usr/bin/env node
// activity-log — the activity feed's writer (T-192, project activity-view). One JSON
// line per event to ~/slopdog/logs/activity/<YYYY-MM-DD>.jsonl, no model call anywhere.
// Registered in hooks.json behind scoped.mjs on five events:
//   UserPromptSubmit            → event "prompt"     text = the prompt
//   PreToolUse  matcher Skill   → event "skill"      name = tool_input.skill
//   PreToolUse  matcher Agent   → event "agent"      name = tool_input.name || subagent_type
//   SubagentStop                → event "agent_done" name = agent_type, text = last message
//   Stop                        → event "stop"       text = last_assistant_message
// The line: ts, session, agent, lane, event, name, ticket, text. `lane` is the
// registry key whose folder contains cwd (longest match). `ticket` is the last T-nnn
// seen in a prompt of this session, sticky: a prompt naming one sets it, every later
// line of the session carries it, read back from today's file. `text` is cut at 200
// characters with newlines collapsed. The board tails the file (T-193, T-194).
// Buffer stdin, fail silent, exit 0 always. Bails when
// SLOPDOG_TURNLOG is set (the turn-log summariser's own claude -p runs fire every hook and
// are not activity) and skips a prompt that is a <task-notification> (a subagent returning,
// already covered by agent_done).

import { readLanesDocument } from '../../../scripts/lib/registry.mjs'
import { readFileSync, appendFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const HOME = homedir();
const LOG_DIR = join(HOME, "slopdog/logs/activity");
const V2 = join(HOME, "slopdog/v2");
const TEXT_MAX = 200;
const TICKET_RE = /\bT-\d{3}(?:-\d+)?\b/g;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function trim(s) {
  if (typeof s !== "string") return "";
  return s.replace(/\s*\n+\s*/g, " ").trim().slice(0, TEXT_MAX);
}

function laneFor(cwd) {
  if (!cwd) return null;
  let lanes;
  try { lanes = readLanesDocument({ v2: V2 }); } catch { return null; }
  let real = cwd;
  try { real = realpathSync(cwd); } catch {}
  let best = null, bestLen = -1;
  for (const [key, lane] of Object.entries(lanes)) {
    if (!lane || typeof lane !== "object" || !lane.folder) continue;
    let folder = resolve(HOME, "slopdog/v2", lane.folder);
    try { folder = realpathSync(folder); } catch {}
    if ((real === folder || real.startsWith(folder + "/")) && folder.length > bestLen) {
      best = key; bestLen = folder.length;
    }
  }
  return best;
}

function lastTicket(text) {
  const all = String(text || "").match(TICKET_RE);
  return all ? all[all.length - 1] : null;
}

function stickyTicket(file, session) {
  if (!existsSync(file)) return null;
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
      const row = JSON.parse(lines[i]);
      if (row.session === session && row.ticket) return row.ticket;
    } catch {}
  }
  return null;
}

if (process.env.SLOPDOG_TURNLOG) process.exit(0);

try {
  let p = {};
  try { p = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }
  if (!p || typeof p !== "object") process.exit(0);

  const hook = p.hook_event_name;
  const input = p.tool_input || {};
  let event = null, name = null, text = "";
  if (hook === "UserPromptSubmit") {
    if (/^\s*<task-notification/.test(String(p.prompt || ""))) process.exit(0);
    event = "prompt"; text = trim(p.prompt);
  } else if (hook === "PreToolUse" && p.tool_name === "Skill") {
    event = "skill"; name = input.skill || null; text = trim(input.args);
  } else if (hook === "PreToolUse" && p.tool_name === "Agent") {
    event = "agent"; name = input.name || input.subagent_type || null; text = trim(input.description);
  } else if (hook === "SubagentStop") {
    event = "agent_done"; name = p.agent_type || null; text = trim(p.last_assistant_message);
  } else if (hook === "Stop") {
    event = "stop"; text = trim(p.last_assistant_message);
  }
  if (!event) process.exit(0);

  const session = p.session_id ? String(p.session_id).slice(0, 8) : "?";
  const file = join(LOG_DIR, `${today()}.jsonl`);
  let ticket = event === "prompt" ? lastTicket(p.prompt) : null;
  if (!ticket) ticket = stickyTicket(file, session);

  const row = {
    ts: new Date().toISOString(),
    session,
    agent: p.agent_id ? String(p.agent_id) : null,
    lane: laneFor(p.cwd),
    event,
    name,
    ticket,
    text,
  };
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(file, JSON.stringify(row) + "\n");
} catch {
  // Never let this break a turn.
}
process.exit(0);
