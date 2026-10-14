#!/usr/bin/env node
// check-manifest — is the Skills Manifest fresh?
// Every SKILL.md under the slopdog plugin and the project skill dirs must have
// a row linking to it; every file:// link in the map must exist. Exit 1 on any
// gap so the edit-skill flow cannot finish with a stale map.
// The map's links are written with one machine's home directory in them, so a
// link's leading /Users/<user> or /home/<user> is rewritten to this machine's
// $HOME before it is checked. A link outside the trees this checker owns — the
// Slopdog OS repo at ~/.slopdog, say, which is only on the Mac — is reported as
// unverifiable here and does not fail the run.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const HOME = process.env.HOME;
const MAP = `${HOME}/slopdog/notes/Slopdog/How Slopdog Works/Skills Manifest.md`; // the only copy
const ROOTS = [
  `${HOME}/.claude/skills/slopdog`,
  `${HOME}/slopdog/.claude/skills`,
  `${HOME}/slopdog/tasks/.claude/skills`,
];

function findSkills(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (existsSync(join(p, "SKILL.md"))) out.push(join(p, "SKILL.md"));
    else findSkills(p, out);
  }
  return out;
}

// A link carries the home directory of the machine it was written on; make it local.
const localise = (p) => p.replace(/^\/(?:Users|home)\/[^/]+/, HOME);
// Trees this checker is responsible for. A dead link outside them is only a warning.
const OWNED = [`${HOME}/.claude`, `${HOME}/slopdog`];

const map = readFileSync(MAP, "utf8");
const linked = new Set([...map.matchAll(/\]\(file:\/\/(\/[^)]+)\)/g)].map((m) => localise(decodeURI(m[1]))));
const onDisk = ROOTS.flatMap((r) => findSkills(r));

const missingRows = onDisk.filter((p) => !linked.has(p));
const allDead = [...linked].filter((p) => !existsSync(p));
const deadLinks = allDead.filter((p) => OWNED.some((r) => p.startsWith(`${r}/`)));
const elsewhere = allDead.filter((p) => !deadLinks.includes(p));

for (const p of missingRows) console.log(`MISSING ROW  ${p}`);
for (const p of deadLinks) console.log(`DEAD LINK    ${p}`);
for (const p of elsewhere) console.log(`NOT HERE     ${p}  (outside this checker's trees — check it on the machine that has it)`);
if (missingRows.length || deadLinks.length) {
  console.log(`\nmanifest is stale: ${missingRows.length} skill(s) without a row, ${deadLinks.length} dead link(s) — fix ${MAP}`);
  process.exit(1);
}
console.log(`manifest is fresh: ${onDisk.length} skills on disk, all linked; ${linked.size} links, ${linked.size - elsewhere.length} resolve here, ${elsewhere.length} unverifiable on this machine`);
