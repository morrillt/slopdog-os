#!/usr/bin/env node
/**
 * @inputs An idea id plus the fields to set (title, score, concern, choice, status, feature) from the ideate loop or ticket-add.
 * @outputs An updated v2/desks/ideas/ideas.json, the alignment queue the board's Ideas view reads, committed to git.
 * @starts A shaping thread's score, concern or open choice changes, or ticket-add marks an idea ticketed.
 * @ends The idea is written atomically and the file's updated stamp is moved.
 */
// ideas — the one writer of v2/desks/ideas/ideas.json, the Ideas desk's alignment
// queue that the Slop Dog board's Ideas view reads (T-281). The ideate skill
// (../SKILL.md) calls it as each shaping thread's score, concern or open choice
// changes; the ticket-add subagent calls `status <id> ticketed` once the ticket exists.
// Nothing else edits the file by hand.
//
//   ideas.mjs upsert <id> [--title ..] [--asked ..] [--score N|null] [--concern ..]
//                         [--choice-json '{"question":..,"options":[..]}'|null]
//                         [--thread ..] [--status ..] [--ticket T-nnn]
//                         [--feature <slug>|none|null] [--feature2 <slug>|null]
//                                           create the idea or merge the given fields
//   ideas.mjs status <id> <status> [--ticket T-nnn]
//   ideas.mjs list                          one line per idea: id, status, score, feature, title
//   ideas.mjs add-question <id> --text-file <path> [--asked-by <desk>]
//                                           append a board question on the idea card
//
// An id is i-<slug> (^i-[a-z0-9-]+$). A status is aligning (the default for a new
// idea), ready, ticketed, parked or dropped. A score is an integer 0-10 or null.
// A feature is a slug from the Slopdog Features registry (T-658): at most two per
// idea (feature, feature2), `none` when it touches no feature, null to clear.
// An unknown slug warns on stderr and is still written; a third slug exits 2.
//
// Options: IDEAS_FILE=<path> overrides the file (tests); --no-commit skips git.
// Each write stamps the idea's and the file's `updated`, writes a temp file beside
// the real one and renames it over, then commits the file by path (never add -A).
// A failed commit prints a warning and still exits 0. Exit 2 is a usage or input error.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkIdeaFeatures, loadFeatureSlugs } from "../../lib/idea-queue.mjs";

const HERE = dirname(realpathSync(fileURLToPath(import.meta.url)));
// v2/plugins/slopdog/session/ideate/scripts → v2
const FILE = process.env.IDEAS_FILE || resolve(HERE, "../../../../..", "desks/ideas/ideas.json");
const ID_RE = /^i-[a-z0-9-]+$/;
const TICKET_RE = /^T-\d+$/;
const STATUSES = ["aligning", "ready", "ticketed", "parked", "dropped"];
const FIELDS = ["title", "asked", "score", "concern", "choice", "thread", "status", "ticket", "feature", "feature2"];

function die(msg) { console.error(`ideas: ${msg}`); process.exit(2); }

// ── arguments ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = {};
const pos = [];
let commit = true;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--no-commit") commit = false;
  else if (a.startsWith("--")) {
    if (i + 1 >= argv.length) die(`${a} needs a value`);
    flags[a.slice(2)] = argv[++i];
  } else pos.push(a);
}
const [cmd, id, ...rest] = pos;

// ── validation: each flag becomes a field value or dies ──────────────────────
const nullish = (v) => v === "null" || v === "";
function parseField(name, raw) {
  switch (name) {
    case "score":
      if (nullish(raw)) return null;
      if (!/^\d+$/.test(raw) || +raw > 10) die(`score must be an integer 0-10 or null, got "${raw}"`);
      return +raw;
    case "status":
      if (!STATUSES.includes(raw)) die(`status must be one of ${STATUSES.join(", ")}, got "${raw}"`);
      return raw;
    case "ticket":
      if (nullish(raw)) return null;
      if (!TICKET_RE.test(raw)) die(`ticket must look like T-nnn, got "${raw}"`);
      return raw;
    case "choice-json": {
      if (nullish(raw)) return null;
      let c;
      try { c = JSON.parse(raw); } catch { die("--choice-json is not valid JSON"); }
      if (c === null) return null;
      if (typeof c?.question !== "string" || !Array.isArray(c.options) || !c.options.every((o) => typeof o === "string"))
        die('--choice-json must be {"question": "...", "options": ["(a) ...", ...]}');
      return { question: c.question, options: c.options };
    }
    case "thread":
      return nullish(raw) ? null : raw;
    default:
      return raw; // title, asked, concern: free text
  }
}
function fieldsFromFlags(allowed) {
  const out = {};
  for (const [k, v] of Object.entries(flags)) {
    if (!allowed.includes(k)) die(`unknown option --${k}`);
    out[k === "choice-json" ? "choice" : k] = parseField(k, v);
  }
  return out;
}

// ── the file ─────────────────────────────────────────────────────────────────
function load() {
  if (!existsSync(FILE)) return { updated: null, ideas: [] };
  try {
    const d = JSON.parse(readFileSync(FILE, "utf8"));
    if (!Array.isArray(d.ideas)) throw new Error("no ideas array");
    return d;
  } catch (e) { die(`${FILE} is not a valid ideas file: ${e.message}`); }
}
function git(...args) {
  return spawnSync("git", ["-C", dirname(FILE), ...args], { encoding: "utf8" });
}
function save(data, what) {
  data.updated = new Date().toISOString();
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  renameSync(tmp, FILE);
  if (!commit) return;
  const name = basename(FILE);
  // A brand-new file is untracked, so add it by path first; commit only that path.
  if (git("ls-files", "--error-unmatch", "--", name).status !== 0) git("add", "--", name);
  const r = git("commit", "-q", "-m", `ideas: ${what}`, "-m", "Auto: ideas.mjs", "--", name);
  if (r.status !== 0) console.error(`ideas: warning, commit failed: ${(r.stderr || r.stdout || "").trim().split("\n")[0]}`);
}
function featureLabel(idea) {
  return idea.feature ? [idea.feature, idea.feature2].filter(Boolean).join("+") : "untagged";
}
function stamp(idea) { idea.updated = new Date().toISOString(); return idea; }
function needId() { if (!id || !ID_RE.test(id)) die(`id must match ^i-[a-z0-9-]+$, got "${id ?? ""}"`); }

function ensureQuestionsArray(idea) {
  if (!Array.isArray(idea.questions)) idea.questions = [];
  if (idea.questions.length === 0 && idea.choice?.question) {
    const text = String(idea.choice.question).trim();
    const options = Array.isArray(idea.choice.options) ? idea.choice.options : [];
    const body = options.length
      ? `${text}\n\n${options.map((o) => String(o).trim()).filter(Boolean).join("\n")}`
      : text;
    idea.questions.push({
      id: "q1",
      asked_by: "ideas",
      timestamp: idea.updated || new Date().toISOString(),
      resolved: false,
      owner: `idea:${idea.id}`,
      text: body,
    });
  }
}

function nextQuestionId(idea) {
  const nums = (idea.questions || [])
    .map((q) => /^q(\d+)$/.exec(q?.id || ""))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `q${next}`;
}

// ── commands ─────────────────────────────────────────────────────────────────
if (cmd === "upsert") {
  needId();
  if (rest.length) die(`unexpected argument "${rest[0]}"`);
  const fields = fieldsFromFlags(["title", "asked", "score", "concern", "choice-json", "thread", "status", "ticket", "feature", "feature2"]);
  const data = load();
  let idea = data.ideas.find((x) => x.id === id);
  if (!idea) {
    idea = { id, title: "", asked: "", score: null, concern: "", choice: null, thread: null, status: "aligning", ticket: null };
    data.ideas.push(idea);
  }
  if ("feature" in fields || "feature2" in fields) {
    // T-658: setting feature alone replaces the pair; feature2 alone keeps feature.
    const primary = "feature" in fields ? fields.feature : idea.feature;
    const secondary = "feature2" in fields ? fields.feature2 : ("feature" in fields ? null : idea.feature2);
    const feat = checkIdeaFeatures({ feature: nullish(primary ?? "") ? "" : primary, feature2: nullish(secondary ?? "") ? "" : secondary }, await loadFeatureSlugs());
    if (feat.errors.length) die(feat.errors.join("; "));
    for (const w of feat.warnings) console.error(`ideas: warning, ${w}`);
    fields.feature = feat.feature;
    fields.feature2 = feat.feature2;
  }
  for (const f of FIELDS) if (f in fields) idea[f] = fields[f];
  stamp(idea);
  save(data, `upsert ${id}`);
  console.log(`${id} · ${idea.status} · ${idea.score ?? "-"}/10 · ${featureLabel(idea)} · ${idea.title}`);
} else if (cmd === "status") {
  needId();
  const [status, extra] = rest;
  if (extra) die(`unexpected argument "${extra}"`);
  const fields = fieldsFromFlags(["ticket"]);
  fields.status = parseField("status", status ?? "");
  const data = load();
  const idea = data.ideas.find((x) => x.id === id);
  if (!idea) die(`no idea ${id}; upsert it first`);
  Object.assign(idea, fields);
  stamp(idea);
  save(data, `status ${id} ${fields.status}`);
  console.log(`${id} · ${idea.status}${idea.ticket ? ` · ${idea.ticket}` : ""}`);
} else if (cmd === "list") {
  const { ideas } = load();
  if (!ideas.length) console.log("(no ideas)");
  for (const x of ideas) console.log(`${x.id}\t${x.status}\t${x.score ?? "-"}/10\t${featureLabel(x)}\t${x.title}`);
} else if (cmd === "add-question") {
  needId();
  if (rest.length) die(`unexpected argument "${rest.join(" ")}"`);
  const textFile = flags["text-file"];
  if (!textFile) die("add-question requires --text-file <path>");
  const askedBy = flags["asked-by"] || "ideas";
  let text;
  try {
    text = readFileSync(textFile, "utf8").replace(/\n+$/, "").trim();
  } catch {
    die(`cannot read --text-file ${textFile}`);
  }
  if (!text) die("question text is empty");
  const data = load();
  const idea = data.ideas.find((x) => x.id === id);
  if (!idea) die(`no idea ${id}; upsert it first`);
  ensureQuestionsArray(idea);
  const qid = nextQuestionId(idea);
  idea.questions.push({
    id: qid,
    asked_by: askedBy,
    timestamp: new Date().toISOString(),
    resolved: false,
    owner: `idea:${idea.id}`,
    text,
  });
  stamp(idea);
  save(data, `add-question ${id} ${qid}`);
  console.log(`${id} · ${qid} · ${idea.questions.length} question(s) on card`);
} else {
  die("usage: ideas.mjs upsert <id> [--field ..] | status <id> <status> [--ticket T-nnn] | add-question <id> --text-file <path> | list");
}
