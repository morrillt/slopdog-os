#!/usr/bin/env node
// claim.mjs — one desk per site at a time (T-309).
//
//   claim.mjs claim <site> <desk>     take the site, or exit 1 naming the desk that holds it
//   claim.mjs release <site> <desk>   drop your claim (a no-op if you don't hold it)
//   claim.mjs list                    every live claim, one per line
//
// Claims live in ~/.local/state/slopdog/browse-claims.json as {site: {desk, pid, at}}.
// pid is the desk's own `claude` process (found by walking up the process tree), so a
// claim dies with its desk. A claim whose pid is gone, or that is 2 hours old, is stale
// and is taken over silently.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const FILE = process.env.SLOPDOG_BROWSE_CLAIMS ?? path.join(os.homedir(), ".local/state/slopdog/browse-claims.json");
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const [cmd, rawSite, desk] = process.argv.slice(2);

// "https://www.YouTube.com/watch?v=x" and "youtube.com" are the same site.
const siteOf = (s) => s.toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0];

const alive = (pid) => {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; }
};

// The nearest ancestor whose command is claude; the Bash tool's shell dies right after us.
const deskPid = () => {
  let pid = process.ppid;
  for (let i = 0; i < 20 && pid > 1; i++) {
    try {
      const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0");
      if (cmdline.slice(0, 2).some((a) => path.basename(a) === "claude")) return pid;
      pid = Number(fs.readFileSync(`/proc/${pid}/stat`, "utf8").split(") ")[1].split(" ")[1]);
    } catch { break; }
  }
  return process.ppid;
};

const load = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; } };
const save = (claims) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(claims, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const live = (c) => c && alive(c.pid) && Date.now() - Date.parse(c.at) < MAX_AGE_MS;
const age = (c) => `${Math.round((Date.now() - Date.parse(c.at)) / 60000)} min`;

const claims = load();

if (cmd === "list") {
  const rows = Object.entries(claims).filter(([, c]) => live(c));
  if (!rows.length) console.log("no live claims");
  for (const [site, c] of rows) console.log(`${site}\t${c.desk}\tpid ${c.pid}\t${age(c)}`);
  process.exit(0);
}

if (!["claim", "release"].includes(cmd) || !rawSite || !desk) {
  console.error("usage: claim.mjs claim|release <site> <desk>  |  claim.mjs list");
  process.exit(2);
}
const site = siteOf(rawSite);
const held = claims[site];

if (cmd === "claim") {
  if (held && held.desk !== desk && live(held)) {
    console.log(`refused: ${site} is held by ${held.desk} (pid ${held.pid}, ${age(held)}); ask ${held.desk} to release it`);
    process.exit(1);
  }
  const took = held && held.desk !== desk ? ` (took over a stale claim from ${held.desk})` : "";
  claims[site] = { desk, pid: deskPid(), at: new Date().toISOString() };
  save(claims);
  console.log(`claimed ${site} for ${desk}${took}`);
} else {
  if (held?.desk === desk) { delete claims[site]; save(claims); console.log(`released ${site}`); }
  else console.log(`${site} was not held by ${desk}; nothing to release`);
}
