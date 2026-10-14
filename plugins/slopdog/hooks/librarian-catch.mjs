#!/usr/bin/env node
// librarian-catch — PostToolUse:Write hook. Logs a referenceable work product to the
// librarian inbox the moment it's created, so nothing depends on an agent remembering
// to mention it later. See notes/Slopdog/How The Mac Works/Daily Brief and Librarian
// System.md for the whole system this feeds.
//
// Every session, every project, every Write — so this must be cheap and fail silent.
// No subprocesses beyond the file checks below; exit 0 always.

import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";

const HOME = homedir();
const INBOX = join(HOME, ".claude/librarian/inbox.jsonl");
const CATALOG = join(HOME, "slopdog/notes/Slopdog/Work Products.md");

// In scope: the two trees Curly specified. Out of scope: anything that is state,
// cache, scratch, or already excluded by its own project.
const IN_SCOPE = [join(HOME, "slopdog"), join(HOME, ".local/bin")];
const SKIP_SEGMENTS = [
  "node_modules", ".cache", "/logs/", "/.git/", "/dist/", "/.claude/worktrees/",
  "/scratchpad/", "/tmp/",
];

try {
  let payload = {};
  try { payload = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch {}

  const filePath = payload?.tool_input?.file_path;
  if (!filePath || typeof filePath !== "string") process.exit(0);

  const inScope = IN_SCOPE.some((root) => filePath.startsWith(root + "/"));
  if (!inScope) process.exit(0);
  if (SKIP_SEGMENTS.some((seg) => filePath.includes(seg))) process.exit(0);
  // slopdog's own memory/, v1/* other than committed source, and any dotfile
  // directory read as noise, not a work product.
  if (/\/\.[^/]+\//.test(filePath.replace(HOME, ""))) {
    // allow ~/.local/bin itself (starts with a dot-segment by design) but not further
    // dotfiles nested inside either scoped tree
    if (!filePath.startsWith(join(HOME, ".local/bin") + "/")) process.exit(0);
  }

  // "New files only": skip if this path is already in the catalog or already queued.
  // Approximate on purpose — a hook that has to diff git state on every Write is not
  // cheap enough to run every session, every project, every write.
  const already =
    (existsSync(CATALOG) && readFileSync(CATALOG, "utf8").includes(`\`${filePath}\``)) ||
    (existsSync(INBOX) && readFileSync(INBOX, "utf8").includes(`"path":"${filePath}"`));
  if (already) process.exit(0);

  const sid = payload.session_id ? String(payload.session_id).slice(0, 8) : "?";
  const cwd = payload.cwd || process.cwd();
  const kind = /\.(md|mdx)$/i.test(filePath) ? "doc"
    : /\.(mjs|js|ts|py|sh)$/i.test(filePath) ? "script"
    : "file";

  mkdirSync(join(HOME, ".claude/librarian"), { recursive: true });
  const row = { path: filePath, kind, session: sid, cwd, ts: new Date().toISOString() };
  appendFileSync(INBOX, JSON.stringify(row) + "\n");
} catch {
  // Never let this break a Write.
}
process.exit(0);
