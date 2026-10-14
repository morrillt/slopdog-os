#!/usr/bin/env node
// lane-lock-bridge — lane-lock for Cursor (cursor-agent) and the Grok TUI.
//
// lane-lock.mjs is the one lock implementation and the one lock store (v2/.locks/). This
// bridge only translates: it rewrites each engine's hook payload into Claude Code's shape,
// runs lane-lock.mjs on it, and turns the result back into what the engine understands. So a
// Claude desk, a Cursor desk and a Grok desk all collide on the same lock files.
//
//   lane-lock-bridge.mjs cursor            preToolUse (matcher Write|Delete)
//   lane-lock-bridge.mjs cursor --release  stop and sessionEnd
//   lane-lock-bridge.mjs grok              PreToolUse (matcher search_replace|write|Edit|Write)
//   lane-lock-bridge.mjs grok --release    Stop and SessionEnd
//
// Wired in ~/.cursor/hooks.json and ~/.grok/hooks/lane-lock.json (user level: cursor-agent
// treats ~/slopdog as the project, so a desk folder's .cursor/hooks.json never loads).
//
// What each engine sends (captured 2026-09-28):
// - Cursor: session_id, tool_name Write, tool_input.file_path, and no cwd; workspace_roots is
//   ~/slopdog for every desk. The hook runs in ~/.cursor, so the desk comes from the nearest
//   ancestor process whose cwd is inside ~/slopdog/v2 (the cursor-agent process). A deny is
//   exit 2 plus {permission:"deny"} on stdout; an allow must print valid JSON, since Cursor
//   blocks a permission hook whose output does not parse.
// - Grok: sessionId, cwd, toolName search_replace or write, toolInput.file_path. A deny is
//   exit 2 plus {decision:"deny", reason}.

import { readFileSync, readlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LANE_LOCK = join(HERE, 'lane-lock.mjs');
const V2 = resolve(HERE, '..', '..', '..');

const engine = process.argv[2];
const release = process.argv.includes('--release');
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* malformed: treat as empty */ }

const allow = () => {
  if (engine === 'cursor' && !release) process.stdout.write('{"permission":"allow"}\n');
  process.exit(0);
};

// The nearest ancestor process sitting in ~/slopdog/v2: for Cursor, the cursor-agent process
// started in the desk folder.
function ancestorCwd() {
  let pid = process.pid;
  for (let i = 0; i < 12 && pid > 1; i++) {
    try {
      const cwd = readlinkSync(`/proc/${pid}/cwd`);
      if (!relative(V2, cwd).startsWith('..')) return cwd;
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
      pid = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]);
    } catch { break; }
  }
  return undefined;
}

const ti = input.tool_input || input.toolInput || {};
const payload = {
  session_id: `${engine}:${input.session_id || input.sessionId || input.conversation_id || 'unknown'}`,
  cwd: input.cwd || ancestorCwd() || input.workspace_roots?.[0] || input.workspaceRoot,
  tool_input: { file_path: ti.file_path || ti.target_file || ti.path },
};

const r = spawnSync(process.execPath, [LANE_LOCK, ...(release ? ['--release'] : [])], {
  input: JSON.stringify(payload), encoding: 'utf8',
});
if (release) { if (r.stdout) process.stderr.write(r.stdout); process.exit(0); }
if (r.status !== 2) allow();

const reason = (r.stderr || 'lane-lock: another desk holds this file.').trim();
process.stderr.write(reason + '\n');
process.stdout.write(JSON.stringify(engine === 'cursor'
  ? { permission: 'deny', user_message: reason, agent_message: reason }
  : { decision: 'deny', reason }) + '\n');
process.exit(2);
