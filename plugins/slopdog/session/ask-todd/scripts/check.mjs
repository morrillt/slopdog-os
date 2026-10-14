#!/usr/bin/env node
// check — T-491's do's-and-don'ts scan over a drafted board question, before it is ever
// written to a ticket. Exported so ask-todd.mjs can call it, and runnable stand-alone for a
// dry test: `node check.mjs <file>` or `node check.mjs -` (stdin).
//
// Flags, one rule per line of the draft:
//   file-name       a path or a bare "<word>.md" — Todd never sees which file backs a fact
//   other-question  a reference to another question by its qN id, or "close/resolve q1"
//   code-identifier a backtick span, or a bare snake_case/camelCase token outside a title
//   step-or-fact    "step N", "fact N" pulled from inside a ticket's own numbering
//   stacked-clause  a sentence (opening line especially) with 3+ commas/semicolons — the
//                   T-471 q1 failure mode of three ideas jammed into one line
//   third-person    "Todd" used where "you" belongs, in the opening decision sentence
//   agent-can-do    asks Todd to do something an agent has the access to do itself:
//                   create/edit/move in Notion, Slack, Gmail, Calendar, Drive, run a
//                   command, change a setting, install something (Todd, 2026-10-08: "stop
//                   asking me to do things that you can do"). Exempt only when the item is
//                   live (opts.live) AND the draft says why only Todd can (password, 2FA,
//                   a device only he holds, a sign-in screen).
//
// Returns an array of { rule, line, text }, empty when the draft is clean.
const ACTION = String.raw`(?:create|make|add|edit|update|move|install|run|change|set up|setup|configure|flip|toggle|enable|disable|paste|post|send|delete|archive|rename|share|invite|log in|sign in|type)`;
const ASKS_TODD = new RegExp([
  String.raw`\b(?:can|could|would|will)\s+you\s+(?:please\s+)?${ACTION}\b`,
  String.raw`\b(?:need|want|ask|asking)\s+you\s+to\s+${ACTION}\b`,
  String.raw`\byou(?:'ll|\s+will)?\s+(?:need|have)\s+to\s+${ACTION}\b`,
  String.raw`\bplease\s+${ACTION}\b`,
  String.raw`^\s*(?:[-*]|\d+[.)])?\s*you\s+${ACTION}\b`,
].join("|"), "i");
const ONLY_TODD_REASON = /password|\b2fa\b|two[- ]factor|one[- ]time code|device only you|your phone|sign-in screen|only you (?:can|hold|have)/i;
export const AGENT_CAN_DO_HINT =
  "do it yourself: the MCP connector (Notion, Slack, Gmail, Calendar, Drive), the browser-driver in his Work Chromium, or your own shell; ask only as live: true with why only Todd can (password, 2FA, his device, a sign-in screen)";

export function checkDraft(text, opts = {}) {
  const violations = [];
  const lines = text.split("\n");
  const push = (rule, i, t) => violations.push({ rule, line: i + 1, text: t.trim() });

  lines.forEach((line, i) => {
    if (/`[^`]+`/.test(line)) push("code-identifier", i, line);
    if (/\b[a-z][a-z0-9]*(_[a-z0-9]+)+\b/.test(line)) push("code-identifier", i, line);
    if (/\b[a-z]+[A-Z][a-zA-Z0-9]*\b/.test(line)) push("code-identifier", i, line);
    if (/[\w.-]+\/[\w./-]+/.test(line) || /\b[\w-]{2,}\.[a-zA-Z]{2,6}\b/.test(line)) push("file-name", i, line);
    if (/\bstep\s+\d+/i.test(line) || /\bfact\s+\d+/i.test(line)) push("step-or-fact", i, line);
    if (/\bq\d+\b/i.test(line) && /\b(close|resolve|answer|open|leave)\b/i.test(line)) {
      push("other-question", i, line);
    }
    if (ASKS_TODD.test(line) && !(opts.live && ONLY_TODD_REASON.test(text))) push("agent-can-do", i, line);
    const commaCount = (line.match(/[,;]/g) || []).length;
    if (commaCount >= 3) push("stacked-clause", i, line);
  });

  // Third-person check: only the opening decision sentence (first non-blank line
  // starting with "Question:") matters — later Context bullets may name Todd factually.
  const opening = lines.find((l) => /^Question:/i.test(l.trim()));
  if (opening && /\bTodd\b/.test(opening) && !/\byou\b/i.test(opening)) {
    push("third-person", lines.indexOf(opening), opening);
  }

  return violations;
}

// SKILL.md's own usage line calls this through the ~/.claude/skills/slopdog symlink, so
// import.meta.url (the resolved realpath) never string-equals file://<argv[1]> (the symlink
// path) — compare realpaths instead (Daphne's T-491 verify finding).
const { readFileSync, realpathSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");
const isMain = process.argv[1] && (() => {
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]); }
  catch { return false; }
})();

if (isMain) {
  const live = process.argv.includes("--live");
  const src = process.argv.slice(2).find((a) => a !== "--live");
  if (!src) { console.error("usage: check.mjs <file>|- [--live]"); process.exit(2); }
  const text = src === "-" ? readFileSync(0, "utf8") : readFileSync(src, "utf8");
  const violations = checkDraft(text, { live });
  if (!violations.length) { console.log("clean: no do's-and-don'ts violations"); process.exit(0); }
  for (const v of violations) console.log(`${v.rule} (line ${v.line}): ${v.text}`);
  if (violations.some((v) => v.rule === "agent-can-do")) console.log(`agent-can-do: ${AGENT_CAN_DO_HINT}`);
  process.exit(1);
}
