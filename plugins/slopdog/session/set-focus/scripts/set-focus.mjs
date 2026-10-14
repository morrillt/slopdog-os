#!/usr/bin/env node
// set-focus — writes the `focus:` key, `focus_batches:` and/or `finish_by:` in ~/slopdog/v2/context.yaml.
// Never touches `focus_tasks`. Round-trips the file through js-yaml so
// comments at the top survive (yaml.dump would drop them), by rewriting
// just the target sections with regex/line splices instead of a full re-serialize.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";

const CONTEXT_FILE = process.env.CONTEXT_FILE || join(homedir(), "slopdog/v2/context.yaml");

// Todd, 2026-10-10: at most three batches run at once ("it's been very problematic to do more
// than that"). Temporary, so it is one constant here, the only writer of focus_batches.
const MAX_FOCUS_BATCHES = 3;

let batchesArg = null;
let hasBatches = false;
let finishByArg = null;
let hasFinishBy = false;
const remaining = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--finish-by") {
    hasFinishBy = true;
    finishByArg = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : "";
  } else if (arg.startsWith("--finish-by=")) {
    hasFinishBy = true;
    finishByArg = arg.slice("--finish-by=".length);
  } else if (arg === "--batches") {
    hasBatches = true;
    batchesArg = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : "";
  } else if (arg.startsWith("--batches=")) {
    hasBatches = true;
    batchesArg = arg.slice("--batches=".length);
  } else {
    remaining.push(arg);
  }
}
const focus = remaining.join(" ").trim();

if (!hasBatches && !hasFinishBy && !focus) {
  console.error("usage: set-focus.mjs [--batches <tag,tag>] [--finish-by <ISO UTC|none>] [new focus line]");
  process.exit(1);
}

// T-740: the sprint's finish-by time. Past it, the Watcher hands any focus batch still open to Data.
// "none" or an empty value removes the line.
let finishByIso = null;
if (hasFinishBy && finishByArg && finishByArg.trim().toLowerCase() !== "none") {
  const ms = Date.parse(finishByArg.trim());
  if (Number.isNaN(ms)) {
    console.error(`refused: --finish-by "${finishByArg}" is not a date (use ISO UTC, e.g. 2026-10-11T23:00:00Z); nothing was changed.`);
    process.exit(1);
  }
  finishByIso = new Date(ms).toISOString();
}
if (!existsSync(CONTEXT_FILE)) {
  console.error(`missing ${CONTEXT_FILE} — run T-457-1's step 1 first`);
  process.exit(1);
}

const raw = readFileSync(CONTEXT_FILE, "utf8");
const parsed = yaml.load(raw);
if (typeof parsed !== "object" || parsed === null || !("focus_tasks" in parsed)) {
  console.error(`${CONTEXT_FILE} doesn't look like the expected shape (missing focus_tasks)`);
  process.exit(1);
}

export function writeFocusBatches(yamlText, tags) {
  const lines = yamlText.split("\n");
  const block = tags.length ? ["focus_batches:", ...tags.map((t) => `  - ${t}`)] : ["focus_batches: []"];
  const at = lines.findIndex((l) => /^focus_batches:/.test(l));
  if (at !== -1) {
    let end = at + 1;
    while (end < lines.length && /^\s+- /.test(lines[end])) end++;
    lines.splice(at, end - at, ...block);
  } else {
    const focusIdx = lines.findIndex((l) => /^focus:/.test(l));
    lines.splice(focusIdx === -1 ? lines.length : focusIdx + 1, 0, ...block);
  }
  return lines.join("\n");
}

export function writeFinishBy(yamlText, iso) {
  const lines = yamlText.split("\n").filter((l) => !/^finish_by:/.test(l));
  if (!iso) return lines.join("\n");
  let at = lines.findIndex((l) => /^focus_batches:/.test(l));
  if (at !== -1) {
    at++;
    while (at < lines.length && /^\s+- /.test(lines[at])) at++;
  } else {
    const focusIdx = lines.findIndex((l) => /^focus:/.test(l));
    at = focusIdx === -1 ? lines.length : focusIdx + 1;
  }
  lines.splice(at, 0, `finish_by: "${iso}"`);
  return lines.join("\n");
}

let updated = raw;

if (focus) {
  // Escape a YAML double-quoted scalar's special characters.
  const escaped = focus.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  updated = updated.replace(/^focus:.*$/m, `focus: "${escaped}"`);
  if (updated === raw && raw.match(/^focus:.*$/m) === null) {
    console.error("no `focus:` line found to replace — file may be malformed");
    process.exit(1);
  }
}

if (hasBatches) {
  const cleanArg = (batchesArg || "").trim().replace(/^\[|\]$/g, "");
  const tags = cleanArg
    ? cleanArg
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
        .map((t) => (t.startsWith("B") ? t : `B${t}`))
    : [];
  const distinct = [...new Set(tags)];
  if (distinct.length > MAX_FOCUS_BATCHES) {
    console.error(
      `refused: ${distinct.length} focus batches (${distinct.join(", ")}); at most ${MAX_FOCUS_BATCHES} run at once (Todd, 2026-10-10). ` +
        `Close or drop a batch first; nothing in context.yaml was changed.`,
    );
    process.exit(1);
  }
  updated = writeFocusBatches(updated, [...new Set(tags)]);
}

if (hasFinishBy) updated = writeFinishBy(updated, finishByIso);

writeFileSync(CONTEXT_FILE, updated);
if (focus) console.log(`focus set: ${focus}`);
if (hasBatches) console.log(`focus_batches set: ${batchesArg}`);
if (hasFinishBy) console.log(finishByIso ? `finish_by set: ${finishByIso}` : "finish_by removed");
