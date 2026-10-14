#!/usr/bin/env node
// check-tight — are the manifest, the plugin.json, and the folders on disk congruent?
// Prints a markdown report to stdout. Exit 0 = all clear, 1 = incongruencies found.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const HOME = process.env.HOME;
const PLUGIN = `${HOME}/.claude/skills/slopdog`;
const MANIFEST = `${HOME}/slopdog/notes/Slopdog/How Slopdog Works/Skills Manifest.md`;
const SKILLS_CONF = `${HOME}/.slopdog/skills.conf`;
const issues = [];
const note = (s) => issues.push(s);

// 1. the three lists of groups
const NOT_GROUPS = new Set(["hooks", "agents", "commands", "scripts", "output-styles"]); // plugin component dirs, not skill groups
const onDisk = readdirSync(PLUGIN).filter((n) => !n.startsWith(".") && !NOT_GROUPS.has(n) && statSync(join(PLUGIN, n)).isDirectory()).sort();
const inJson = JSON.parse(readFileSync(`${PLUGIN}/.claude-plugin/plugin.json`, "utf8")).skills.map((p) => p.replace(/^\.\//, "").replace(/\/$/, "")).sort();
const man = readFileSync(MANIFEST, "utf8");
const catSection = man.split(/^## 2 · Categories/m)[1]?.split(/^## /m)[0] ?? "";
const inManifest = [...catSection.matchAll(/^\| (\w[\w-]*) \| `([^`]+)\/` \|/gm)].map((m) => ({ name: m[1], folder: m[2] }));
for (const c of inManifest) if (c.name !== c.folder) note(`Manifest §2: category "${c.name}" points at folder "${c.folder}/" — name and folder must match`);
const manNames = inManifest.map((c) => c.name).sort();
const set = (a) => new Set(a);
for (const g of onDisk) { if (!set(inJson).has(g)) note(`Folder \`${g}/\` exists on disk but is not in plugin.json "skills" — its skills won't load`); if (!set(manNames).has(g)) note(`Folder \`${g}/\` exists on disk but has no row in Manifest §2`); }
for (const g of inJson) { if (!set(onDisk).has(g)) note(`plugin.json lists "./${g}/" but the folder doesn't exist`); if (!set(manNames).has(g)) note(`plugin.json lists "./${g}/" but Manifest §2 has no row for it`); }
for (const g of manNames) { if (!set(onDisk).has(g)) note(`Manifest §2 lists category "${g}" but \`${g}/\` doesn't exist on disk`); if (!set(inJson).has(g)) note(`Manifest §2 lists category "${g}" but plugin.json doesn't`); }

// 2. every skill dir has SKILL.md whose name: matches the folder, and a §3 row with the right category
const rows = [...man.matchAll(/^\| (\w[\w-]*) \| \[`\/slopdog:([\w-]+)`\]\(file:\/\/([^)]+)\)/gm)].map((m) => ({ cat: m[1], name: m[2], path: m[3] }));
for (const g of onDisk) for (const s of readdirSync(join(PLUGIN, g)).filter((n) => !n.startsWith("."))) {
  const dir = join(PLUGIN, g, s); if (!statSync(dir).isDirectory()) continue;
  const sk = join(dir, "SKILL.md");
  if (!existsSync(sk)) { note(`\`${g}/${s}/\` has no SKILL.md`); continue; }
  const fm = readFileSync(sk, "utf8").match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (fm && fm !== s) note(`\`${g}/${s}/SKILL.md\` says name: ${fm} — folder and name must match`);
  const row = rows.find((r) => r.name === s);
  if (!row) note(`\`/slopdog:${s}\` has no row in Manifest §3`);
  else if (row.cat !== g) note(`Manifest §3 puts \`/slopdog:${s}\` in category "${row.cat}" but it lives in \`${g}/\``);
}
for (const r of rows) if (!existsSync(r.path)) note(`Manifest §3 row \`/slopdog:${r.name}\` links to a file that doesn't exist: ${r.path}`);

// 3. installer-managed skills: their groups exist; copies match source
if (existsSync(SKILLS_CONF)) {
  for (const line of readFileSync(SKILLS_CONF, "utf8").split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [name, group] = line.split("\t");
    if (!group) note(`skills.conf: "${name}" has no group column`);
    else if (!set(onDisk).has(group)) note(`skills.conf sends "${name}" to group "${group}" which doesn't exist`);
  }
  try { execFileSync(`${HOME}/.slopdog/install.sh`, ["--check"], { stdio: "pipe" }); }
  catch (e) { note(`\`~/.slopdog/install.sh --check\` reports drift:\n\n\`\`\`\n${String(e.stdout || e.stderr).trim()}\n\`\`\``); }
}

// 4. manifest links resolve (delegates to check-manifest)
try { execFileSync("node", [`${PLUGIN}/meta/edit-skill/scripts/check-manifest.mjs`], { stdio: "pipe" }); }
catch (e) { note(`check-manifest.mjs:\n\n\`\`\`\n${String(e.stdout).trim()}\n\`\`\``); }

const when = new Date().toISOString().slice(0, 16).replace("T", " ");
console.log(`# Slopdog keep-tight — ${when}\n`);
console.log(`Checked: ${onDisk.length} groups, ${rows.length} manifest rows, plugin.json, skills.conf, install.sh --check, manifest links.\n`);
if (!issues.length) { console.log("**All clear.** Manifest, plugin.json and the folders on disk agree."); process.exit(0); }
console.log(`**${issues.length} incongruenc${issues.length === 1 ? "y" : "ies"}:**\n`);
for (const i of issues) console.log(`- ${i}`);
process.exit(1);
