#!/usr/bin/env node
// open-on-6.mjs <url> — open a URL in a new window of Todd's Work Chromium profile
// (snap Chromium, profile "Default") on workspace 6, and leave his focus where it was.
// Chromium maps the window on whatever workspace is focused, so this finds the new
// window by diffing i3's tree, moves it, then re-asserts his workspace once the page
// has had time to load (a loading Chromium window can pull focus to itself).
import { execFileSync, spawn } from "node:child_process";

const url = process.argv[2];
if (!url) { console.error("usage: open-on-6.mjs <url>"); process.exit(2); }

const i3 = (...a) => JSON.parse(execFileSync("i3-msg", a, { encoding: "utf8" }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const windows = () => {
  const ids = new Set();
  const walk = (n) => { if (n.window) ids.add(n.window); [...(n.nodes || []), ...(n.floating_nodes || [])].forEach(walk); };
  walk(i3("-t", "get_tree"));
  return ids;
};
const focused = () => i3("-t", "get_workspaces").find((w) => w.focused).name;

const was = focused();
const before = windows();
spawn("chromium", ["--profile-directory=Default", "--new-window", url], { detached: true, stdio: "ignore" }).unref();

let id;
for (let i = 0; i < 40 && !id; i++) {
  await sleep(250);
  id = [...windows()].find((w) => !before.has(w));
}
if (!id) { console.error("no new Chromium window appeared"); process.exit(1); }

execFileSync("i3-msg", [`[id=${id}] move to workspace number 6`]);
if (was !== "6") {
  execFileSync("i3-msg", [`workspace ${was}`]);
  await sleep(3000);
  if (focused() !== was) execFileSync("i3-msg", [`workspace ${was}`]);
}
console.log(`window ${id} on workspace 6; focus left on ${focused()}`);
