#!/usr/bin/env node
// watch.mjs — Watcher desk monitoring cycle:
// 1. USAGE AND THE STOP (weekly Claude usage from statusline cache, stop sprint if >= threshold)
// 2. STUCK AGENTS (calls unstucker.mjs --dry-run)
// 3. CLEARS (unstucker clear-stalled / cleared-no-pickup + self-clear.mjs tags in clear-pending.jsonl)
// 4. STALLED DOING (🟡 focus-batch: no live cursor-agent for two cycles, or idle >= STALL_MINUTES)
// 5. IDLE QUEUE (🔵/🔍 focus-batch dispatchable, no cursor-agent at all for two cycles → Tyrion inbox)
// 6. NUDGE TYRION (ready focus or hotfix 🔵/🔍 + build pane idle per unstucker → one inbox, 15-minute cooldown)
// 7. SPRINT OVERDUE (past context.yaml's finish_by with a focus batch still open → Data's inbox, once per finish_by)
//
// Usage:
//   node watch.mjs              # Run one cycle (default)
//   node watch.mjs --once       # Run one cycle
//   node watch.mjs --loop       # Run every intervalMinutes from config
//   node watch.mjs --dry-run    # Run one cycle without writing log or stop files
//   node watch.mjs --context <file>   # Read focus_batches and finish_by from this file, not v2/context.yaml
//
// Config: v2/desks/watcher/sprint-watch.json
// Stop:   writes v2/desks/watcher/SPRINT-STOP, notifies Tyrion (build) and Daphne (ideas)
// Log:    appends one line per cycle to v2/desks/watcher/sprint-watch.log

import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  writeFileSync,
  realpathSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { postSlackMessage, TODD_SLACK_DM } from '../../../../../scripts/openrouter-model-check.mjs';
import { exhaustedKeys, quotaStatePath } from '../../../../../scripts/lib/engine-quota.mjs';
import { resolvePaths as teamBudgetPaths, sweep as teamBudgetSweep } from '../../../../../scripts/lib/team-budget.mjs';
import { batchKey, loadTickets } from '../../../../../scripts/sprint-moving.mjs';
import { limitsPaused } from '../../../../../scripts/lib/limits.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
function findV2Dir() {
  const candidate1 = resolve(SCRIPT_DIR, '../../../../..');
  if (existsSync(join(candidate1, 'scripts', 'unstucker.mjs'))) return candidate1;
  const candidate2 = join(homedir(), 'slopdog', 'v2');
  if (existsSync(join(candidate2, 'scripts', 'unstucker.mjs'))) return candidate2;
  return candidate1;
}

const V2 = findV2Dir();
const WATCHER = join(V2, 'desks', 'watcher');
const CONFIG_PATH = join(WATCHER, 'sprint-watch.json');
const LOG_PATH = join(WATCHER, 'sprint-watch.log');
const STOP_PATH = join(WATCHER, 'SPRINT-STOP');
const RUNG_STATE_PATH = join(WATCHER, 'usage-rung-state.json');
const SLACK_ENV = join(homedir(), '.config', 'slack-channel', '.env');
const CLEAR_LOG = join(WATCHER, 'clear-pending.jsonl');
const UNSTUCKER = join(V2, 'scripts', 'unstucker.mjs');
const INBOX_WRITE = join(V2, 'scripts', 'inbox-write.mjs');
const contextFlagAt = process.argv.indexOf('--context');
const CONTEXT_PATH = contextFlagAt > -1 && process.argv[contextFlagAt + 1]
  ? resolve(process.argv[contextFlagAt + 1])
  : join(homedir(), 'slopdog', 'v2', 'context.yaml');
const TASK_LIST = join(homedir(), 'slopdog', 'tasks', 'task-list.md');
const TASKS_REPO = join(homedir(), 'slopdog', 'tasks');
const WORKTREE_ROOTS = [
  join(homedir(), 'slopdog', 'v2', '.worktrees'),
  join(homedir(), 'slopdog', '.claude', 'worktrees'),
];
const STALLED_DOING_STATE = join(WATCHER, 'stalled-doing.json');
const TYRION_NUDGE_STATE = join(WATCHER, 'tyrion-nudge.json');
const SPRINT_OVERDUE_STATE = join(WATCHER, 'sprint-overdue.json');

export const STALL_MINUTES = 10;
const STALL_MS = STALL_MINUTES * 60 * 1000;

const USAGE_FILE = process.env.SLOPDOG_USAGE_FILE || join(homedir(), '.local', 'state', 'slopdog', 'usage.json');
const MAX_USAGE_AGE_MS = Number(process.env.SLOPDOG_USAGE_MAX_AGE_MS || 30 * 60 * 1000);
const STALLED_DOING_REPORT_INTERVAL_MS = 60 * 60 * 1000;
const IDLE_QUEUE_REPORT_INTERVAL_MS = 30 * 60 * 1000;
const IDLE_QUEUE_STATE_KEY = '_idleQueue';

const args = process.argv.slice(2);
const isLoop = args.includes('--loop');
const dryRun = args.includes('--dry-run');

export function loadConfig() {
  const defaults = {
    stopThresholdPct: 50,
    hardCeilingPct: 55,
    intervalMinutes: 5,
  };
  if (!existsSync(CONFIG_PATH)) return defaults;
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return { ...defaults, ...raw };
  } catch (e) {
    console.error(`watcher: warning reading ${CONFIG_PATH} (${e.message}); using defaults`);
    return defaults;
  }
}

export function readWeeklyUsage() {
  if (!existsSync(USAGE_FILE)) {
    return { pct: null, ageMin: null, fresh: false, source: USAGE_FILE, error: 'usage file missing' };
  }
  let ageMs = Infinity;
  let ageMin = null;
  try {
    ageMs = Date.now() - statSync(USAGE_FILE).mtimeMs;
    ageMin = Math.round(ageMs / 60_000);
  } catch (e) {
    return { pct: null, ageMin: null, fresh: false, source: USAGE_FILE, error: `cannot stat: ${e.message}` };
  }

  const fresh = ageMs <= MAX_USAGE_AGE_MS;
  try {
    const u = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
    const pct = u?.seven_day?.used_percentage;
    if (typeof pct !== 'number') {
      return { pct: null, ageMin, fresh, source: USAGE_FILE, error: 'no seven_day.used_percentage in json' };
    }
    return {
      pct,
      ageMin,
      fresh,
      source: USAGE_FILE,
      resetsAt: u?.seven_day?.resets_at ?? null,
      error: fresh ? null : `stale (${ageMin}m old > 30m)`,
    };
  } catch (e) {
    return { pct: null, ageMin, fresh, source: USAGE_FILE, error: `parse error: ${e.message}` };
  }
}

// unstucker's dry run now takes over three minutes; a shorter timeout reads as stuck=0.
export const UNSTUCKER_TIMEOUT_MS = 420_000;

export function runUnstuckerDry() {
  if (!existsSync(UNSTUCKER)) {
    return `unstucker missing at ${UNSTUCKER}`;
  }
  try {
    return execFileSync(process.execPath, [UNSTUCKER, '--dry-run'], {
      encoding: 'utf8',
      cwd: V2,
      timeout: UNSTUCKER_TIMEOUT_MS,
    });
  } catch (e) {
    return `${e.stdout || ''}${e.stderr || ''}${e.message || ''}`;
  }
}

export function summarizeUnstucker(out) {
  const stuck = [];
  const clearBad = [];
  for (const rawLine of out.split('\n')) {
    const t = rawLine.trim();
    if (!/^[a-z0-9-]+ \([^)]+\):/.test(t)) continue;
    if (
      /would ask what it is waiting on|would move question to board|would re-type the \/clear|would type the pickup|would nudge \(/.test(t)
    ) {
      stuck.push(t);
    }
    if (/clear-stalled|cleared-no-pickup/.test(t) || /would re-type the \/clear that never took|would type the pickup/.test(t)) {
      clearBad.push(t);
    }
  }
  return { stuck, clearBad };
}

export function readClearTags(maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!existsSync(CLEAR_LOG)) return [];
  const cutoff = Date.now() - maxAgeMs;
  return readFileSync(CLEAR_LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((e) => e && Number.isFinite(Date.parse(e.at)) && Date.parse(e.at) > cutoff);
}

export function unconfirmedClears(tags) {
  const started = tags.filter((t) => t.phase === 'started');
  const completed = tags.filter((t) => t.phase === 'completed');
  return started.filter((p) => {
    const done = completed.some(
      (c) => c.pickup === p.pickup && Date.parse(c.at) >= Date.parse(p.at),
    );
    return !done && Date.now() - Date.parse(p.at) < 20 * 60 * 1000;
  });
}

function sendInbox(lane, slug, text) {
  if (!existsSync(INBOX_WRITE)) return;
  try {
    execFileSync(
      process.execPath,
      [INBOX_WRITE, '--to', lane, '--from', 'watcher', '--slug', slug, '--text', text],
      { encoding: 'utf8', cwd: WATCHER },
    );
  } catch (e) {
    console.error(`watcher: error sending inbox to ${lane}: ${e.message}`);
  }
}

function sendInboxStdin(lane, slug, text) {
  if (!existsSync(INBOX_WRITE)) return;
  try {
    execFileSync(process.execPath, [INBOX_WRITE, '--to', lane, '--from', 'watcher', '--slug', slug], {
      input: text,
      encoding: 'utf8',
      cwd: WATCHER,
    });
  } catch (e) {
    console.error(`watcher: error sending inbox to ${lane}: ${e.message}`);
  }
}

export function writeStop(usage, config) {
  const body =
    JSON.stringify(
      {
        at: new Date().toISOString(),
        weeklyPct: usage.pct,
        stopThresholdPct: config.stopThresholdPct,
        hardCeilingPct: config.hardCeilingPct,
        reason: `seven-day usage ${usage.pct}% >= threshold ${config.stopThresholdPct}% (hard ceiling ${config.hardCeilingPct}%)`,
      },
      null,
      2,
    ) + '\n';
  mkdirSync(WATCHER, { recursive: true });
  writeFileSync(STOP_PATH, body);

  const msg =
    `Watcher stopped the sprint: seven-day Claude usage is ${usage.pct}% ` +
    `(threshold ${config.stopThresholdPct}%, hard ceiling ${config.hardCeilingPct}%). ` +
    `Every desk's next prompt and every dispatch, hotfix: true tickets included, is refused until Todd types \`lift stop\` into a desk pane (the watcher and slack desks are exempt). That deletes v2/desks/watcher/SPRINT-STOP.`;
  sendInbox('build', 'sprint-usage-stop', msg);
  sendInbox('ideas', 'sprint-usage-stop', msg);
}

export function shouldStop(usage, config) {
  if (usage.pct == null || !usage.fresh) return false;
  return usage.pct >= config.hardCeilingPct || usage.pct >= config.stopThresholdPct;
}

export function usageRungSpecs(config) {
  return [
    { id: 'notify', phrase: 'notify rung', pct: config.notifyPct },
    { id: 'warn', phrase: 'warn rung', pct: config.warnPct },
    { id: 'stop', phrase: 'stop rung', pct: config.stopThresholdPct },
  ].filter((rung) => typeof rung.pct === 'number');
}

export function usageRungText(rung, pct, config) {
  const shown = `${pct}%`;
  if (rung.id === 'notify') {
    return `Weekly Claude usage is ${shown}. This is the notify rung at ${config.notifyPct}%. Nothing is held. Next you get a warn at ${config.warnPct}%, and the sprint stop at ${config.stopThresholdPct}% refuses every desk's prompts and every dispatch, hotfixes included, until you type lift stop in a desk pane.`;
  }
  if (rung.id === 'warn') {
    return `Weekly Claude usage is ${shown}. This is the warn rung at ${config.warnPct}%. Dispatch is still open. Next, the stop at ${config.stopThresholdPct}% refuses every desk's prompts and every dispatch, hotfixes included, until you type lift stop in a desk pane.`;
  }
  const ceiling = typeof config.hardCeilingPct === 'number' ? ` The hard ceiling is ${config.hardCeilingPct}%.` : '';
  return `Weekly Claude usage is ${shown}. This is the stop rung at ${config.stopThresholdPct}%.${ceiling} Every desk's prompts and every dispatch are refused, hotfixes included, until you type lift stop in a desk pane. I will not send this again until the weekly window resets.`;
}

function readSlackBotToken() {
  try {
    if (!existsSync(SLACK_ENV)) return '';
    const match = readFileSync(SLACK_ENV, 'utf8').match(/^SLACK_BOT_TOKEN=(.+)$/m);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

export async function sendUsageRungSlack(text) {
  await postSlackMessage({ token: readSlackBotToken(), channel: TODD_SLACK_DM, text });
}

function loadRungState(statePath) {
  if (!existsSync(statePath)) return null;
  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8'));
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
}

/**
 * One usage-rung cycle. Missing state for this resetsAt marks notify and warn
 * already passed as fired with no Slack. A failed send leaves that rung unfired.
 */
export async function advanceUsageRungs({
  pct,
  resetsAt,
  config,
  statePath,
  postSlackMessage: send = sendUsageRungSlack,
  log = console.error,
}) {
  if (typeof pct !== 'number' || !resetsAt || !statePath) return { sent: [] };
  const rungs = usageRungSpecs(config);
  const prev = loadRungState(statePath);
  const sameWindow = Boolean(prev && prev.resetsAt === resetsAt);
  const fired = { notify: false, warn: false, stop: false };
  if (sameWindow && prev.fired && typeof prev.fired === 'object') {
    for (const id of Object.keys(fired)) fired[id] = Boolean(prev.fired[id]);
  }
  const firstSight = !sameWindow;
  const sent = [];
  for (const rung of rungs) {
    if (pct < rung.pct || fired[rung.id]) continue;
    if (firstSight && (rung.id === 'notify' || rung.id === 'warn')) {
      fired[rung.id] = true;
      continue;
    }
    const text = usageRungText(rung, pct, config);
    try {
      await send({ text });
      fired[rung.id] = true;
      sent.push(rung.id);
    } catch (e) {
      log(`watcher: slack ${rung.id} failed: ${e.message}`);
      break;
    }
  }
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify({ resetsAt, fired }, null, 2)}\n`);
  return { sent, fired };
}

/** Parse `focus_batches:` list from context.yaml without pulling in js-yaml. */
export function parseFocusBatches(contextText) {
  const batches = [];
  let inSection = false;
  for (const line of contextText.split('\n')) {
    if (/^focus_batches:\s*$/.test(line)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    const item = line.match(/^\s+-\s+(\S+)/);
    if (item) {
      batches.push(item[1]);
      continue;
    }
    if (line.trim() && !line.startsWith('#') && !/^\s/.test(line)) break;
    if (line.trim() && /^\s+\w+:/.test(line)) break;
  }
  return batches;
}

export function readFocusBatches(contextPath = CONTEXT_PATH) {
  if (!existsSync(contextPath)) return [];
  return parseFocusBatches(readFileSync(contextPath, 'utf8'));
}

/** 🟡 rows in task-list that carry a tag for one of the focus batches. */
export function focusDoingYellowRows(taskListText, focusBatches) {
  if (!focusBatches?.length) return [];
  const batchTags = focusBatches.map((b) => `#${b}`);
  const out = [];
  for (const line of taskListText.split('\n')) {
    if (!line.startsWith('| 🟡 |')) continue;
    if (!batchTags.some((t) => line.includes(t))) continue;
    const fileMatch = line.match(/tickets\/([^)\s]+\.md)\)/);
    const idMatch = line.match(/#(T-?\d+)/);
    if (!fileMatch || !idMatch) continue;
    const id = idMatch[1].replace(/^T(\d)/, 'T-$1');
    out.push({ id, file: fileMatch[1] });
  }
  return out;
}

/** Board mark per ticket id from task-list.md rows. */
export function taskListMarkById(taskListText) {
  const rows = new Map();
  for (const line of taskListText.split('\n')) {
    const m = line.match(/^\|\s*(\S+)\s*\|\s*\[[^\]]+\][^|]*#T(\S+?)[\s#]/);
    if (m) rows.set(`T-${m[2]}`, m[1]);
  }
  return rows;
}

export function dependsOnOf(text) {
  const m = text.match(/^depends_on:[ \t]*(.*)\n((?:[ \t]+-[ \t]*.+\n?)*)/m);
  if (!m) return [];
  return `${m[1]} ${m[2]}`.match(/T-[\w-]+/g) || [];
}

/** 🔵 and 🔍 rows in task-list that carry a tag for one of the focus batches. */
export function focusQueuedRows(taskListText, focusBatches) {
  if (!focusBatches?.length) return [];
  const batchTags = focusBatches.map((b) => `#${b}`);
  const out = [];
  for (const line of taskListText.split('\n')) {
    const markMatch = line.match(/^\|\s*(🔵|🔍)\s*\|/);
    if (!markMatch) continue;
    if (!batchTags.some((t) => line.includes(t))) continue;
    const fileMatch = line.match(/tickets\/([^)\s]+\.md)\)/);
    const idMatch = line.match(/#T(\S+?)[\s#]/);
    if (!fileMatch || !idMatch) continue;
    out.push({ id: `T-${idMatch[1]}`, file: fileMatch[1], mark: markMatch[1] });
  }
  return out;
}

/** 🔵 blocked by unlanded depends_on is excluded; 🔍 rows always count. */
export function dispatchableQueuedRows(rows, marksById, ticketTextByFile = {}) {
  const landed = (id) => ['🟢', '🟩'].includes(marksById.get(id));
  return rows.filter((row) => {
    if (row.mark === '🔍') return true;
    const deps = dependsOnOf(ticketTextByFile[row.file] || '');
    return deps.every((dep) => landed(dep));
  });
}

/** 🔵 rows anywhere on the board whose ticket front matter says `hotfix: true` (no focus-batch filter). */
export function hotfixQueuedRows(taskListText, ticketTextByFile) {
  const out = [];
  for (const line of taskListText.split('\n')) {
    if (!/^\|\s*🔵\s*\|/.test(line)) continue;
    const fileMatch = line.match(/tickets\/([^)\s]+\.md)\)/);
    const idMatch = line.match(/#T(\S+?)[\s#]/);
    if (!fileMatch || !idMatch) continue;
    const text = ticketTextByFile(fileMatch[1]) || '';
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (fm && /^hotfix:\s*true\s*$/m.test(fm[1])) out.push({ id: `T-${idMatch[1]}`, file: fileMatch[1], mark: '🔵' });
  }
  return out;
}

/** Tyrion's (build lane) pane state, read from unstucker --dry-run output: idle | busy | absent. */
export function buildPaneState(unstuckerOut) {
  const line = unstuckerOut.split('\n').map((l) => l.trim()).find((l) => /^build \([^)]+\):/.test(l));
  if (!line) return { state: 'absent', line: null };
  return { state: /would nudge \(idle\)|left alone, idle/.test(line) ? 'idle' : 'busy', line };
}

export const TYRION_NUDGE_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Nudge Tyrion when ready 🔵/🔍 focus or hotfix work waits and his pane is idle at an empty prompt.
 * At most once per TYRION_NUDGE_INTERVAL_MS. Not held by SPRINT-STOP itself, though the sprint-stop hook refuses any prompt typed into his pane while the file exists.
 * `prev` is `{ lastNudgedAt? }`. Returns `{ next, send, status }`; status goes on the log line.
 */
export function advanceTyrionNudge(prev, { readyIds, paneState, now = Date.now() }) {
  const next = { ...(prev || {}) };
  if (!readyIds.length) return { next, send: false, status: 'no-ready' };
  if (paneState !== 'idle') return { next, send: false, status: `tyrion-${paneState}` };
  if (next.lastNudgedAt && now - next.lastNudgedAt < TYRION_NUDGE_INTERVAL_MS) {
    const left = Math.ceil((TYRION_NUDGE_INTERVAL_MS - (now - next.lastNudgedAt)) / 60_000);
    return { next, send: false, status: `cooldown ${left}m` };
  }
  next.lastNudgedAt = now;
  return { next, send: true, status: 'sent' };
}

export function hasAnyBuilder(cmdlines) {
  return cmdlines.some((c) => /(?:cursor-agent|\bdispatch\.mjs\b|\bagy\b)/.test(c));
}

export function hasAnyCursorAgent(cmdlines) {
  return hasAnyBuilder(cmdlines);
}

export function builderCmdlines(procRoot = '/proc') {
  const lines = [];
  if (!existsSync(procRoot)) return lines;
  for (const pid of readdirSync(procRoot)) {
    if (!/^\d+$/.test(pid)) continue;
    try {
      const argv = readFileSync(join(procRoot, pid, 'cmdline'), 'utf8').split('\0').join(' ');
      if (/(?:cursor-agent|\bdispatch\.mjs\b|\bagy\b)/.test(argv)) lines.push(argv);
    } catch {
      // the process exited while it was being read
    }
  }
  return lines;
}

export function cursorAgentCmdlines(procRoot = '/proc') {
  return builderCmdlines(procRoot);
}

function cmdlineMatchesId(cmdline, id) {
  if (!id) return false;
  const cleanId = id.replace(/^#/, '');
  const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^a-zA-Z0-9_-])${escaped}(?:[^a-zA-Z0-9_-]|$)`);
  if (re.test(cmdline)) return true;
  const numMatch = cleanId.match(/^T-?(\d+)/i);
  if (numMatch) {
    const num = numMatch[1];
    const altRe = new RegExp(`(?:^|[^a-zA-Z0-9_-])T-?${num}(?:[^a-zA-Z0-9_-]|$)`, 'i');
    if (altRe.test(cmdline)) return true;
  }
  return false;
}

export function ticketHasLiveBuilder(fileOrRow, cmdlines, optId = null, tasksRepo = TASKS_REPO) {
  let file = '';
  let id = '';
  if (typeof fileOrRow === 'object' && fileOrRow !== null) {
    file = fileOrRow.file || '';
    id = fileOrRow.id || '';
  } else if (typeof fileOrRow === 'string') {
    file = fileOrRow;
    id = optId || '';
    if (!id && /^T-?\d+/i.test(fileOrRow)) {
      id = fileOrRow;
    }
  }

  if (file && !id) {
    try {
      const candidates = [join(tasksRepo, 'tickets', file), file];
      for (const p of candidates) {
        if (existsSync(p)) {
          const content = readFileSync(p, 'utf8');
          const m = content.match(/^id:\s*"?(\S+?)"?\s*$/m);
          if (m) {
            id = m[1];
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return cmdlines.some((c) => {
    if (file && c.includes(file)) return true;
    if (id && cmdlineMatchesId(c, id)) return true;
    return false;
  });
}

/** Parse `YYYY-MM-DD` + `HH:MM` as local and UTC; pick non-future reading closest to now. */
export function resolveAmbiguousTimestamp(dateStr, timeStr, now = Date.now()) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  const asLocal = new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
  const candidates = [asUtc, asLocal].filter((t) => t <= now);
  if (!candidates.length) return null;
  return candidates.reduce((best, t) => (now - t < now - best ? t : best));
}

const LOG_TS_RE = /^-\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/;

export function newestSectionLogTimestampMs(ticketText, now = Date.now()) {
  let best = null;
  let inSection = false;
  for (const line of ticketText.split('\n')) {
    if (/^## Build log\s*$/.test(line) || /^## Progress notes\s*$/.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^## /.test(line)) inSection = false;
    if (!inSection) continue;
    const m = line.match(LOG_TS_RE);
    if (!m) continue;
    const t = resolveAmbiguousTimestamp(m[1], m[2], now);
    if (t != null && (best == null || t > best)) best = t;
  }
  return best;
}

export function ticketGitCommitMs(ticketFile, tasksRepo = TASKS_REPO, execFile = execFileSync) {
  try {
    const out = execFile(
      'git',
      ['-C', tasksRepo, 'log', '-1', '--format=%ct', '--', `tickets/${ticketFile}`],
      { encoding: 'utf8' },
    ).trim();
    const n = Number(out);
    return Number.isFinite(n) ? n * 1000 : null;
  } catch {
    return null;
  }
}

function ticketIdMatchesWorktree(name, branch, ticketId) {
  const num = ticketId.replace(/^T-?/i, '');
  const re = new RegExp(`t-?${num}`, 'i');
  return re.test(name) || (branch && re.test(branch));
}

function maxMtimeUnder(dir, skipNames) {
  let best = null;
  const walk = (p) => {
    let entries;
    try {
      entries = readdirSync(p, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (skipNames.has(ent.name)) continue;
      const full = join(p, ent.name);
      if (ent.isDirectory()) walk(full);
      else {
        try {
          const m = statSync(full).mtimeMs;
          if (best == null || m > best) best = m;
        } catch {
          // unreadable file
        }
      }
    }
  };
  walk(dir);
  return best;
}

export function worktreeActivityMs(ticketId, worktreeRoots = WORKTREE_ROOTS, execFile = execFileSync) {
  const skip = new Set(['node_modules', '.git']);
  let best = null;
  for (const root of worktreeRoots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      let branch = '';
      const wt = join(root, name);
      try {
        branch = execFile('git', ['-C', wt, 'branch', '--show-current'], { encoding: 'utf8' }).trim();
      } catch {
        branch = '';
      }
      if (!ticketIdMatchesWorktree(name, branch, ticketId)) continue;
      const m = maxMtimeUnder(wt, skip);
      if (m != null && (best == null || m > best)) best = m;
    }
  }
  return best;
}

export function ticketLastActivityMs(
  row,
  {
    tasksRepo = TASKS_REPO,
    ticketText = null,
    worktreeRoots = WORKTREE_ROOTS,
    execFile = execFileSync,
    now = Date.now(),
  } = {},
) {
  const parts = [];
  const gitMs = ticketGitCommitMs(row.file, tasksRepo, execFile);
  if (gitMs != null) parts.push(gitMs);
  if (ticketText != null) {
    const logMs = newestSectionLogTimestampMs(ticketText, now);
    if (logMs != null) parts.push(logMs);
  }
  const wtMs = worktreeActivityMs(row.id, worktreeRoots, execFile);
  if (wtMs != null) parts.push(wtMs);
  if (!parts.length) return null;
  return Math.max(...parts);
}

export function activityAgeMinutes(activityMs, now = Date.now()) {
  if (activityMs == null) return null;
  return Math.round((now - activityMs) / 60_000);
}

function stallSignals({ hasLive, misses, idleStalled, idleMs }) {
  const noBuilder = !hasLive && misses >= 2;
  const signals = [];
  if (noBuilder) signals.push('no builder');
  if (idleStalled) signals.push(`idle ${Math.round(idleMs / 60_000)} minutes`);
  return { stalled: noBuilder || idleStalled, noBuilder, idle: idleStalled, signals };
}

/**
 * One stalled-doing cycle: bump misses, idle check, decide inbox reports, build next state.
 * `prev` maps ticket id -> { misses, lastReportedAt? }.
 * `activityById` maps ticket id -> last activity ms (or omit for unknown).
 */
export function advanceStalledDoing(prev, rows, cmdlines, now = Date.now(), activityById = {}) {
  const next = { ...prev };
  const stalledIds = [];
  const reportLines = [];

  for (const row of rows) {
    const hasLive = ticketHasLiveBuilder(row, cmdlines);
    const activityMs = activityById[row.id] ?? null;
    const idleMs = activityMs != null ? now - activityMs : 0;
    const idleStalled = activityMs != null && idleMs >= STALL_MS;

    const was = next[row.id] || { misses: 0 };
    const misses = hasLive ? was.misses : was.misses + 1;
    const { stalled, signals } = stallSignals({ hasLive, misses, idleStalled, idleMs });

    if (hasLive && !idleStalled) {
      delete next[row.id];
      continue;
    }

    const entry = { misses: hasLive ? was.misses : misses };
    if (was.lastReportedAt) entry.lastReportedAt = was.lastReportedAt;

    if (stalled) stalledIds.push(row.id);

    const dueReport =
      stalled &&
      (!entry.lastReportedAt || now - entry.lastReportedAt >= STALLED_DOING_REPORT_INTERVAL_MS);
    if (dueReport) {
      const ageMin = activityAgeMinutes(activityMs, now);
      const ageStr = ageMin != null ? `${ageMin}m` : 'unknown';
      reportLines.push(`${row.id}: ${signals.join(', ')}, last activity ${ageStr} ago`);
      entry.lastReportedAt = now;
    }

    next[row.id] = entry;
  }

  for (const id of Object.keys(next)) {
    if (id === IDLE_QUEUE_STATE_KEY) continue;
    if (!rows.some((r) => r.id === id)) delete next[id];
  }

  return { next, stalledIds, reportLines };
}

/**
 * Idle queue: no cursor-agent anywhere while dispatchable 🔵/🔍 focus work exists for two cycles.
 * `prev` is `{ misses, lastReportedAt? }`.
 */
export function advanceIdleQueue(prev, { dispatchableIds, hasBuilders, now = Date.now() }) {
  const idle = !hasBuilders && dispatchableIds.length > 0;
  const was = { misses: 0, ...prev };
  const misses = idle ? was.misses + 1 : 0;
  const fired = idle && misses >= 2;
  const next = { misses };
  if (was.lastReportedAt) next.lastReportedAt = was.lastReportedAt;

  const dueReport =
    fired &&
    (!next.lastReportedAt || now - next.lastReportedAt >= IDLE_QUEUE_REPORT_INTERVAL_MS);
  let reportText = null;
  if (dueReport) {
    reportText = `${dispatchableIds.join(', ')}\nbuilders idle with work queued; dispatch now`;
    next.lastReportedAt = now;
  }

  return { next, fired, reportText, dispatchableIds };
}

export function loadStalledDoingState(statePath = STALLED_DOING_STATE) {
  if (!existsSync(statePath)) return {};
  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function splitStalledDoingState(raw) {
  const { [IDLE_QUEUE_STATE_KEY]: idleQueue, ...tickets } = raw;
  return { tickets, idleQueue: idleQueue || { misses: 0 } };
}

export function mergeStalledDoingState(tickets, idleQueue) {
  const out = { ...tickets };
  if (idleQueue && (idleQueue.misses > 0 || idleQueue.lastReportedAt)) {
    out[IDLE_QUEUE_STATE_KEY] = idleQueue;
  }
  return out;
}

export function runStalledDoingCheck({
  contextPath = CONTEXT_PATH,
  taskListPath = TASK_LIST,
  statePath = STALLED_DOING_STATE,
  tasksRepo = TASKS_REPO,
  worktreeRoots = WORKTREE_ROOTS,
  cmdlines = cursorAgentCmdlines(),
  dry = false,
  now = Date.now(),
  execFile = execFileSync,
} = {}) {
  const batches = readFocusBatches(contextPath);
  const taskListText = existsSync(taskListPath) ? readFileSync(taskListPath, 'utf8') : '';
  const rows = focusDoingYellowRows(taskListText, batches);
  const activityById = {};
  for (const row of rows) {
    const ticketPath = join(tasksRepo, 'tickets', row.file);
    const ticketText = existsSync(ticketPath) ? readFileSync(ticketPath, 'utf8') : '';
    activityById[row.id] = ticketLastActivityMs(row, {
      tasksRepo,
      ticketText,
      worktreeRoots,
      execFile,
      now,
    });
  }
  const rawState = loadStalledDoingState(statePath);
  const { tickets: prevTickets, idleQueue: prevIdle } = splitStalledDoingState(rawState);
  const { next: nextTickets, stalledIds, reportLines } = advanceStalledDoing(
    prevTickets,
    rows,
    cmdlines,
    now,
    activityById,
  );

  const marksById = taskListMarkById(taskListText);
  const queuedRows = focusQueuedRows(taskListText, batches);
  const ticketTextByFile = {};
  for (const row of queuedRows) {
    if (row.mark !== '🔵') continue;
    const ticketPath = join(tasksRepo, 'tickets', row.file);
    ticketTextByFile[row.file] = existsSync(ticketPath) ? readFileSync(ticketPath, 'utf8') : '';
  }
  const dispatchable = dispatchableQueuedRows(queuedRows, marksById, ticketTextByFile);
  const dispatchableIds = dispatchable.map((r) => r.id);
  const hotfixIds = hotfixQueuedRows(taskListText, (file) => {
    const p = join(tasksRepo, 'tickets', file);
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
  })
    .map((r) => r.id)
    .filter((id) => !dispatchableIds.includes(id));
  const idleStep = advanceIdleQueue(prevIdle, {
    dispatchableIds,
    hasBuilders: hasAnyCursorAgent(cmdlines),
    now,
  });
  const next = mergeStalledDoingState(nextTickets, idleStep.next);

  if (!dry) {
    try {
      mkdirSync(dirname(statePath), { recursive: true });
      writeFileSync(statePath, `${JSON.stringify(next, null, 2)}\n`);
      if (reportLines.length) {
        sendInboxStdin('build', 'stalled-doing', `${reportLines.join('\n')}\nRelaunch on Cursor.`);
      }
      if (idleStep.reportText) {
        sendInboxStdin('build', 'idle-queue', idleStep.reportText);
      }
    } catch (e) {
      console.error(`watcher: failed stalled-doing check: ${e.message}`);
    }
  }

  return {
    stalledIds,
    reportLines,
    dryWouldReport: dry ? reportLines : [],
    idleQueueIds: dispatchableIds,
    readyIds: [...dispatchableIds, ...hotfixIds],
    idleQueueReport: dry ? idleStep.reportText : null,
    dryWouldIdleQueueReport: dry ? idleStep.reportText : null,
    next,
  };
}

export function runTyrionNudge({
  readyIds,
  unstuckerOut,
  dry = false,
  statePath = TYRION_NUDGE_STATE,
  now = Date.now(),
  send = (text) => sendInboxStdin('build', 'ready-queue', text),
}) {
  let prev = {};
  try {
    if (existsSync(statePath)) prev = JSON.parse(readFileSync(statePath, 'utf8')) || {};
  } catch {
    prev = {};
  }
  const pane = buildPaneState(unstuckerOut);
  const step = advanceTyrionNudge(prev, {
    readyIds,
    paneState: pane.state,
    now,
  });
  if (step.send && !dry) {
    send(
      `Ready to dispatch: ${readyIds.join(', ')}\n` +
        `Your pane is idle at an empty prompt; dispatch the next one. (watcher, at most once per 15 minutes)`,
    );
    try {
      writeFileSync(statePath, `${JSON.stringify(step.next, null, 2)}\n`);
    } catch (e) {
      console.error(`watcher: failed to write ${statePath}: ${e.message}`);
    }
  }
  return { ...step, status: step.send && dry ? 'would-send' : step.status };
}

// T-740 (Todd, 2026-10-11: "if the batch just isn't done the sprint isn't done, we have to let the
// higher reasoning model step in"). context.yaml may carry `finish_by:` (ISO UTC), set by whoever
// starts the sprint. Past it, every focus batch with a ticket not done (🟩/🟢) and not dropped goes
// to Data, the trusted lane, in one inbox file per finish_by value. The ticket read and the
// done/dropped classification are sprint-moving.mjs's loadTickets/classify, not a second parser.

/** `finish_by:` from context.yaml as epoch ms; null when absent or blank, NaN when unparseable. */
export function parseFinishBy(contextText) {
  const m = String(contextText).match(/^finish_by:[ \t]*['"]?([^'"#\n]*?)['"]?[ \t]*(#.*)?$/m);
  const v = m?.[1]?.trim();
  if (!v || /^(null|~)$/i.test(v)) return null;
  return Date.parse(v);
}

/** Focus batches with tickets still open: [{ batch, open: [{ id, status }] }]; empty when all are done or dropped. */
export function openFocusBatches(focusBatches, tickets) {
  const out = [];
  for (const batch of focusBatches) {
    const open = tickets
      .filter((t) => t.batch && batchKey(t.batch) === batchKey(batch))
      .filter((t) => t.state !== 'done' && t.state !== 'dropped' && !/⏸️|paused/.test(t.status || ''))
      .map((t) => ({ id: t.id, status: t.status }));
    if (open.length) out.push({ batch, open });
  }
  return out;
}

export function sprintOverdueText(finishByIso, nowIso, open) {
  return [
    `Sprint past its finish-by time (finish_by ${finishByIso}, now ${nowIso}). Take these batches in the trusted lane: read the project and batch, treat tickets as hints, plan, build, verify, close.`,
    '',
    ...open.map((b) => `- ${b.batch}: ${b.open.map((t) => `${t.id} (${t.status || 'no status'})`).join(', ')}`),
    '',
    '(watcher, once per finish_by value, T-740)',
  ].join('\n');
}

export function runSprintOverdue({
  contextPath = CONTEXT_PATH,
  ticketsDir = join(TASKS_REPO, 'tickets'),
  statePath = SPRINT_OVERDUE_STATE,
  now = Date.now(),
  dry = false,
  send = (text) => sendInboxStdin('data', 'sprint-overdue', text),
} = {}) {
  const contextText = existsSync(contextPath) ? readFileSync(contextPath, 'utf8') : '';
  const finishBy = parseFinishBy(contextText);
  if (finishBy == null) return { status: 'no-finish-by', open: [] };
  if (Number.isNaN(finishBy)) return { status: 'bad-finish-by', open: [] };
  const finishByIso = new Date(finishBy).toISOString();
  if (now <= finishBy) return { status: 'not-yet', finishByIso, open: [] };
  const batches = parseFocusBatches(contextText);
  const open = openFocusBatches(batches, loadTickets(ticketsDir, batches));
  if (!open.length) return { status: 'all-done', finishByIso, open };
  let prev = {};
  try {
    if (existsSync(statePath)) prev = JSON.parse(readFileSync(statePath, 'utf8')) || {};
  } catch {
    prev = {};
  }
  if (prev.finishBy === finishByIso) return { status: 'already', finishByIso, open };
  const text = sprintOverdueText(finishByIso, new Date(now).toISOString(), open);
  if (dry) return { status: 'would-send', finishByIso, open, text };
  send(text);
  try {
    mkdirSync(dirname(statePath), { recursive: true });
    const record = { finishBy: finishByIso, sentAt: new Date(now).toISOString(), batches: open.map((b) => b.batch) };
    writeFileSync(statePath, `${JSON.stringify(record, null, 2)}\n`);
  } catch (e) {
    console.error(`watcher: failed to write ${statePath}: ${e.message}`);
  }
  return { status: 'sent', finishByIso, open, text };
}

// 2026-10-11 memory ceiling (Todd approved, Process Versus Direct report 3.1). Three pieces, one line:
// fleet memory and swap read from /proc/meminfo, the dispatcher's and the Watcher's own agent processes
// pinned to oom_score_adj -500 (the same `sudo choom` the Slack listener uses) so the kernel kills
// anything else first, and an alert when swap stays at or above 80% for five minutes. The pin is
// re-applied every cycle, so a restarted session is covered within one cycle.
const SWAP_STATE = join(WATCHER, 'swap-state.json');
const OOM_PIN_FOLDERS = { build: join('desks', 'build', 'tyrion'), watcher: join('desks', 'watcher') };

export function readFleetMemory(meminfo = readFileSync('/proc/meminfo', 'utf8')) {
  const kb = (k) => Number((meminfo.match(new RegExp(`^${k}:\\s+(\\d+)`, 'm')) || [])[1] || 0);
  const swapTotal = kb('SwapTotal');
  const swapUsed = swapTotal - kb('SwapFree');
  return {
    availGb: Math.round((kb('MemAvailable') / 1048576) * 10) / 10,
    swapPct: swapTotal ? Math.round((swapUsed / swapTotal) * 100) : 0,
  };
}

/** Pure: has swap stayed at or above limitPct for `minutes`? Returns the new state and whether to alert now. */
export function swapEpisode(swapPct, state, nowMs, { limitPct = 80, minutes = 5 } = {}) {
  if (swapPct < limitPct) return { state: {}, alert: false };
  const since = state.since ?? nowMs;
  const long = nowMs - since >= minutes * 60 * 1000;
  return { state: { since, alerted: state.alerted || long }, alert: long && !state.alerted };
}

export function pinDeskOomScores({ dry = false } = {}) {
  const pinned = [];
  const wanted = Object.entries(OOM_PIN_FOLDERS).map(([lane, rel]) => [lane, realpathSync(join(V2, rel))]);
  for (const name of readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const cwd = readlinkSync(`/proc/${name}/cwd`);
      const hit = wanted.find(([, dir]) => cwd === dir);
      if (!hit) continue;
      const cmd = readFileSync(`/proc/${name}/cmdline`, 'utf8').replace(/\0/g, ' ');
      if (!/(^|[ /])(claude|cursor-agent)\b/.test(cmd) || /zsh -c|mcp|npm /.test(cmd)) continue;
      const adj = Number(readFileSync(`/proc/${name}/oom_score_adj`, 'utf8'));
      if (adj > -500 && !dry) spawnSync('sudo', ['-n', '/usr/bin/choom', '-n', '-500', '-p', name], { encoding: 'utf8' });
      if (!pinned.includes(hit[0])) pinned.push(hit[0]);
    } catch { /* the process went away between listing and reading */ }
  }
  return pinned;
}

// Exit-124 jobs per engine (2026-10-11 quick task: five of seven Gemma jobs timed out while the
// board still said "started"). dispatch.mjs writes one job file per run under any desk's
// jobs/ folder with `engine:` and `exit:` in its front matter; this counts the ones that exited
// 124 inside the window. Only the file head is read, and files untouched since the window opened
// are skipped without opening them.
export const TIMEOUT_WINDOW_HOURS = 24;
export function countTimeoutJobs(desksDir = join(V2, 'desks'), { now = Date.now(), hours = TIMEOUT_WINDOW_HOURS } = {}) {
  const since = now - hours * 60 * 60 * 1000;
  const counts = {};
  const walk = (dir, inJobs, depth) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < 6 && !['node_modules', '.git', '.worktrees', 'inbox', 'inbox-archive', 'reports'].includes(e.name)) walk(p, e.name === 'jobs', depth + 1);
      } else if (inJobs && e.name.endsWith('.md')) {
        try {
          if (statSync(p).mtimeMs < since) continue;
          const head = readFileSync(p, 'utf8').slice(0, 1500);
          const fm = head.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (!fm || !/^exit:\s*124\s*$/m.test(fm[1])) continue;
          const finished = fm[1].match(/^finished:\s*(\S+)/m)?.[1];
          if (finished && Date.parse(finished) < since) continue;
          const engine = fm[1].match(/^engine:\s*(\S+)/m)?.[1] || 'unknown';
          counts[engine] = (counts[engine] || 0) + 1;
        } catch { /* an unreadable job file is not a timeout we can count */ }
      }
    }
  };
  walk(desksDir, false, 0);
  return counts;
}
export function timeoutLines(counts, hours = TIMEOUT_WINDOW_HOURS) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([engine, n]) => `TIMEOUTS engine=${engine} exit124=${n} in ${hours}h`);
}

function runMemoryCheck({ dry }) {
  const mem = readFleetMemory();
  const pinned = pinDeskOomScores({ dry });
  let prior = {};
  try { prior = JSON.parse(readFileSync(SWAP_STATE, 'utf8')); } catch { /* first run */ }
  const ep = swapEpisode(mem.swapPct, prior, Date.now());
  if (!dry) {
    try { writeFileSync(SWAP_STATE, JSON.stringify(ep.state)); } catch { /* state is advisory */ }
    if (ep.alert) {
      const msg = `Swap has been at ${mem.swapPct}% for five minutes or more, with ${mem.availGb} GB of memory available. The kernel's out-of-memory killer is next. Close idle opencode sessions or Cursor desks, or hold new builders; the cap on concurrent builders is maxConcurrentBuilders in desks/watcher/sprint-watch.json.`;
      sendInbox('it', 'swap-high', msg);
      sendInbox('build', 'swap-high', msg);
    }
  }
  const alertStr = ep.alert ? 'FIRED' : ep.state.since ? 'rising' : 'no';
  return `avail=${mem.availGb}G swap=${mem.swapPct}% pinned=${pinned.join(',') || 'none'} alert=${alertStr}`;
}

// T-728: the Slack listener restart-rate alert. The kernel's OOM killer took slack-channel.service
// 11 times on 2026-10-10 and nobody heard until Varys went quiet. Count the unit's `Started`
// entries in the journal (NRestarts resets on a manual restart, so the journal is the record),
// and when more than two land inside an hour send Todd one Slack DM, at most once an hour. The post
// goes over the bot's HTTP token, so it works while the Socket Mode listener itself is down.
export const RESTART_UNIT = 'slack-channel.service';
export const RESTART_LIMIT = 2;
const RESTART_WINDOW_MS = 60 * 60 * 1000;
const RESTART_STATE = join(WATCHER, 'restart-rate.json');

/** Pure: epoch ms of each `Started <unit>` entry in `journalctl -o json` output. */
export function parseUnitStarts(journalText) {
  const out = [];
  for (const line of String(journalText || '').split('\n')) {
    if (!line.trim()) continue;
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (typeof j.MESSAGE !== 'string' || !j.MESSAGE.startsWith('Started ')) continue;
    const us = Number(j.__REALTIME_TIMESTAMP);
    if (Number.isFinite(us)) out.push(Math.round(us / 1000));
  }
  return out;
}

/** Pure: starts inside the last hour, and whether to alert now (count > limit, no alert in the last hour). */
export function restartRateAlert(startsMs, state, nowMs, { limit = RESTART_LIMIT, windowMs = RESTART_WINDOW_MS } = {}) {
  const count = startsMs.filter((t) => t > nowMs - windowMs && t <= nowMs).length;
  const cooling = state?.alertedAt && nowMs - state.alertedAt < windowMs;
  const alert = count > limit && !cooling;
  return { count, alert, state: alert ? { alertedAt: nowMs } : { ...(state || {}) } };
}

export function restartAlertText(unit, count) {
  const name = unit.replace(/\.service$/, '');
  return `The Slack listener (${name}) restarted ${count} times in the last hour. Varys misses Slack messages while it is down. Check journalctl --user -u ${name} for oom-kill, and free -m for swap.`;
}

function readUnitStarts(unit = RESTART_UNIT) {
  const r = spawnSync('journalctl', ['--user', '-u', unit, '--since', '-1h', '-o', 'json', '--no-pager'], { encoding: 'utf8', timeout: 20_000 });
  return parseUnitStarts(r.stdout);
}

async function runRestartCheck({ dry }) {
  let prior = {};
  try { prior = JSON.parse(readFileSync(RESTART_STATE, 'utf8')); } catch { /* first run */ }
  const r = restartRateAlert(readUnitStarts(), prior, Date.now());
  if (r.alert && !dry) {
    try {
      await sendUsageRungSlack(restartAlertText(RESTART_UNIT, r.count));
      writeFileSync(RESTART_STATE, JSON.stringify(r.state));
    } catch (e) {
      console.error(`watcher: restart alert failed: ${e.message}`);
      return `RESTARTS slack-channel=${r.count}/1h alert=FAILED`;
    }
  }
  return `RESTARTS slack-channel=${r.count}/1h alert=${r.alert ? (dry ? 'would-fire' : 'FIRED') : 'no'}`;
}

/** T-678: one warning per department per window into Tyrion's inbox when a team nears its share. */
function runTeamBudget({ dry }) {
  try {
    const out = teamBudgetSweep({ paths: teamBudgetPaths(), send: (slug, text) => sendInbox('build', slug, text), dryRun: dry });
    return { field: out.summary, lines: out.lines };
  } catch (e) {
    return { field: `BUDGET unreadable (${e.message.split('\n')[0]})`, lines: [] };
  }
}

export async function runCycle(config, { dryRun: dry = false } = {}) {
  const ts = new Date().toISOString();
  const usage = readWeeklyUsage();
  const unstuckerOut = runUnstuckerDry();
  const unstucker = summarizeUnstucker(unstuckerOut);
  const tags = readClearTags();
  const pending = unconfirmedClears(tags);

  let stopFlag = 'no';
  if (shouldStop(usage, config)) {
    if (limitsPaused()) {
      stopFlag = 'limits paused';   // the limits switch (v2/LIMITS-OFF): log the usage, write no SPRINT-STOP
    } else if (existsSync(STOP_PATH)) {
      stopFlag = 'already';
    } else if (!dry) {
      writeStop(usage, config);
      stopFlag = 'fired';
    } else {
      stopFlag = 'would-fire';
    }
  }

  if (!dry && usage.pct != null && usage.fresh && usage.resetsAt) {
    try {
      await advanceUsageRungs({
        pct: usage.pct,
        resetsAt: usage.resetsAt,
        config,
        statePath: RUNG_STATE_PATH,
      });
    } catch (e) {
      console.error(`watcher: usage rungs failed: ${e.message}`);
    }
  }

  let usageStr;
  if (usage.pct != null && usage.fresh) {
    usageStr = `weekly=${usage.pct}% fresh=true age=${usage.ageMin}m stop=${stopFlag}`;
  } else if (usage.pct != null && !usage.fresh) {
    usageStr = `weekly=${usage.pct}% UNTRUSTWORTHY (stale: age=${usage.ageMin}m > 30m) stop=${stopFlag}`;
  } else {
    usageStr = `weekly=? UNREADABLE (${usage.error || 'unknown error'}) stop=${stopFlag}`;
  }

  const stuckSummary = unstucker.stuck.length
    ? ` [${unstucker.stuck.slice(0, 3).join(' | ')}]`
    : '';
  const stuckStr = `stuck=${unstucker.stuck.length}${stuckSummary}`;

  const badSummary = unstucker.clearBad.length
    ? ` [${unstucker.clearBad.slice(0, 2).join(' | ')}]`
    : '';
  const pendingSummary = pending.length
    ? ` unconfirmed=${pending.map((p) => p.lane || p.pickup).join(',')}`
    : '';
  const clearStr = `clears bad=${unstucker.clearBad.length} pending=${pending.length}${badSummary}${pendingSummary}`;

  const doing = runStalledDoingCheck({ dry });
  const doingSummary = doing.stalledIds.length ? ` [${doing.stalledIds.join(', ')}]` : '';
  const doingStr = `DOING stalled=${doing.stalledIds.length}${doingSummary}`;

  const queueSummary = doing.idleQueueIds.length ? ` [${doing.idleQueueIds.join(', ')}]` : '';
  const queueStr = `QUEUE idle=${doing.idleQueueIds.length}${queueSummary}`;

  const nudge = runTyrionNudge({ readyIds: doing.readyIds, unstuckerOut, dry });
  const nudgeStr = `NUDGE tyrion=${nudge.status}${nudge.send ? ` [${doing.readyIds.join(', ')}]` : ''}`;

  const overdue = runSprintOverdue({ dry });
  const handed = ['sent', 'would-send', 'already'].includes(overdue.status)
    ? ` data=[${overdue.open.map((b) => b.batch).join(', ')}]`
    : '';
  const overdueStr = `OVERDUE ${overdue.status}${overdue.finishByIso ? ` finish_by=${overdue.finishByIso}` : ''}${handed}`;

  const quotaList = exhaustedKeys({ statePath: process.env.DISPATCH_QUOTA_STATE_PATH || quotaStatePath() });
  const quotaStr = `QUOTA exhausted=[${quotaList.join(',')}]`;
  const memStr = `MEM ${runMemoryCheck({ dry })}`;
  const timeoutCounts = countTimeoutJobs();
  const timeoutTotal = Object.values(timeoutCounts).reduce((a, b) => a + b, 0);
  const timeoutStr = `TIMEOUTS ${timeoutTotal === 0 ? 'none' : Object.entries(timeoutCounts).map(([e, n]) => `${e}=${n}`).join(',')} (${TIMEOUT_WINDOW_HOURS}h)`;
  const budget = runTeamBudget({ dry });
  const restartStr = await runRestartCheck({ dry });
  const line = `${ts} | USAGE ${usageStr} | STUCK ${stuckStr} | CLEARS ${clearStr} | ${doingStr} | ${queueStr} | ${nudgeStr} | ${overdueStr} | ${quotaStr} | ${memStr} | ${timeoutStr} | ${budget.field} | ${restartStr}`;

  if (!dry) {
    try {
      mkdirSync(WATCHER, { recursive: true });
      appendFileSync(LOG_PATH, `${line}\n`);
    } catch (e) {
      console.error(`watcher: failed to append to log ${LOG_PATH}: ${e.message}`);
    }
  }

  console.log(line);
  if (overdue.status === 'would-send') console.log(`OVERDUE would write data's inbox (sprint-overdue):\n${overdue.text}`);
  for (const l of timeoutLines(timeoutCounts)) console.log(l);
  for (const l of budget.lines) console.log(l);
  return line;
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const config = loadConfig();
  if (!isLoop) {
    await runCycle(config, { dryRun });
  } else {
    const intervalMs = (config.intervalMinutes || 5) * 60 * 1000;
    while (true) {
      await runCycle(config, { dryRun });
      if (existsSync(STOP_PATH)) {
        console.log(`watcher: stop file exists (${STOP_PATH}); exiting loop`);
        break;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, intervalMs);
    }
  }
}
