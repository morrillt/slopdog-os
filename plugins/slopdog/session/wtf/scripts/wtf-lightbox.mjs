#!/usr/bin/env node
// wtf-lightbox — shows /slopdog:wtf's answer in front of Todd (T-443). Reads a JSON answer,
// serves it as one page on a loopback port and opens it as a Chromium --app window, which
// the i3 rule for the title "What's going on" floats, centres and focuses on whatever
// workspace he is on (the T-430 capture popup's mechanism). Esc or the X closes it.
// It detaches itself, so the calling turn returns at once.
//
//   wtf-lightbox.mjs <answer.json>
//   answer.json: {"hours": 6,
//     "sections": [{"header": "What got done", "body": "..."}, {"header": "What's next", "body": "..."}, {"header": "Where you can help", "body": "..."}],
//     "work": [{"ticket": "T-nnn", "project": "project-name", "status": "...", "what": "..."}],
//     "focus": "optional — read from ~/slopdog/v2/context.yaml's focus: key if not in the JSON"}
//   The focus block also lists context.yaml's focus_tasks rows (T-457-3).
//   When a focus_tasks ticket has an open question, "Where you can help" gains a button that
//   opens the board's Questions tab with the Focus filter on, in the workspace-3 board (T-464).
//   or, for any other plain answer (same window, same i3 rule):
//               {"head": "Gist", "paragraphs": ["...", "...", "..."]}
import { createServer } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const [file, mode] = process.argv.slice(2);
if (!file) { console.error("usage: wtf-lightbox.mjs <answer.json>"); process.exit(2); }
const answer = JSON.parse(readFileSync(file, "utf8")); // fail here, in the foreground, on bad JSON

if (mode !== "--serve") {
  spawn(process.execPath, [process.argv[1], file, "--serve"], { detached: true, stdio: "ignore" }).unref();
  console.log("→ lightbox");
  process.exit(0);
}

const TITLE = "What's going on";
const GIVE_UP_MS = 15 * 60_000;

// T-524: the popup's look comes from the Artifact reports, not a bespoke palette — Todd,
// 2026-09-27: "bring the CSS over from the artifacts so our markdown looks decent in these
// pop-ups." report-style.css is lifted from the gold report's <style> block (its tokens,
// fonts, card/table/list/heading rules) and shared by any popup that wants the same look.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPORT_CSS = readFileSync(join(SCRIPT_DIR, "report-style.css"), "utf8");

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
// Inline: code spans come out first so nothing inside them gets escaped or re-matched,
// then bold/italic/links/T-tags run on the escaped text, then the spans go back in.
const inline = (s) => {
  const code = [];
  let t = String(s ?? "").replace(/`([^`]+)`/g, (_, c) => { code.push(`<code>${esc(c)}</code>`); return `@@C${code.length - 1}@@`; });
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<i>$2</i>");
  t = t.replace(/\bT-\d{2,4}(?:-\d+)?\b/g, (m) => `<span class="mono">${m}</span>`);
  return t.replace(/@@C(\d+)@@/g, (_, i) => code[+i]);
};

// T-524: a section body is markdown (bullets, numbered steps, headings, quotes, tables,
// checkboxes), not one blob of inline text — a raw ticket read as a wall of asterisks.
// Same shape as md-catppuccin.mjs's block renderer, trimmed to what a ticket section
// actually uses, and built on the inline() above so a T-tag still gets its chip.
function mdBlock(src) {
  const lines = String(src ?? "").split("\n");
  const out = [];
  let i = 0;

  const listLine = (l) => {
    const bullet = l.match(/^(\s*)[-*]\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (bullet) return { indent: bullet[1].length, ordered: false, checked: bullet[2] ? /x/i.test(bullet[2]) : undefined, text: bullet[3] };
    const num = l.match(/^(\s*)\d+[.)]\s+(.*)$/);
    if (num) return { indent: num[1].length, ordered: true, text: num[2] };
    return null;
  };

  const renderList = (items) => {
    let html = "";
    const stack = [];
    for (const it of items) {
      while (stack.length && stack[stack.length - 1].indent > it.indent) html += `</li></${stack.pop().tag}>`;
      if (!stack.length || stack[stack.length - 1].indent < it.indent) {
        const tag = it.ordered ? "ol" : "ul";
        html += `<${tag}>`;
        stack.push({ indent: it.indent, tag });
      } else {
        html += "</li>";
      }
      const body = it.checked === undefined ? inline(it.text)
        : `<input type="checkbox" disabled${it.checked ? " checked" : ""}> ${inline(it.text)}`;
      html += `<li>${body}`;
    }
    while (stack.length) html += `</li></${stack.pop().tag}>`;
    return html;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }

    if (/^```/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    // +2: an in-body "#" would collide with the section's own <h2>; report-style.css styles
    // h2..h6 anyway, so a ticket's "##"/"###" lands as the next size down, never the top one.
    if (h) { const lvl = Math.min(h[1].length + 2, 6); out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${mdBlock(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^\|/.test(line) && /^\|?[\s:|-]+\|/.test(lines[i + 1] || "")) {
      const cells = (l) => l.replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|/.test(lines[i])) body.push(cells(lines[i++]));
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
        `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    if (listLine(line)) {
      const items = [];
      while (i < lines.length && listLine(lines[i])) items.push(listLine(lines[i++]));
      out.push(renderList(items));
      continue;
    }

    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !listLine(lines[i]) &&
           !/^(#{1,6}\s|>|\||```)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

const workTable = (rows) => {
  if (!rows?.length) return "";
  return `<table><thead><tr><th>Ticket</th><th>Status</th><th>What</th></tr></thead><tbody>${
    rows.map((r) => {
      const label = r.project ? `${esc(r.project)} / ${esc(r.ticket)}` : esc(r.ticket);
      return `<tr><td><span class="tag t-id">${label}</span></td><td>${esc(r.status)}</td><td>${inline(r.what)}</td></tr>`;
    }).join("")
  }</tbody></table>`;
};

// T-457-1: focus lives in context.yaml's `focus:` key, which only /slopdog:set-focus writes.
// T-457-3: the block under it lists `focus_tasks`, the table update-focus-tasks.mjs refreshes.
const FOCUS_FILE = join(homedir(), "slopdog/v2/context.yaml");
let ctx = {};
try { ctx = yaml.load(readFileSync(FOCUS_FILE, "utf8")) || {}; } catch {}
const focus = answer.focus ?? String(ctx.focus ?? "").trim();
const focusTasks = Array.isArray(ctx.focus_tasks) ? ctx.focus_tasks : [];
const FOCUS_ROWS = 10;

// T-464: which focus tickets carry an open question, by the board's own rule (runner
// src/lib/tickets.ts: an item not from Todd, not a reply, not resolved).
const TICKETS = join(homedir(), "slopdog/tasks/tickets");
const openFocusQuestions = (() => {
  const want = new Set(focusTasks.map((r) => String(r.ticket)));
  if (!want.size) return [];
  const found = [];
  try {
    for (const f of readdirSync(TICKETS)) {
      if (!f.endsWith(".md")) continue;
      const fm = readFileSync(join(TICKETS, f), "utf8").match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      let meta; try { meta = yaml.load(fm[1]) || {}; } catch { continue; }
      if (!want.has(String(meta.id))) continue;
      const items = Array.isArray(meta.questions?.items) ? meta.questions.items : [];
      if (items.some((it) => it && it.speaker !== "user" && !it.replyTo && it.resolved !== true && (it.text || it.question)))
        found.push(meta.id);
    }
  } catch {}
  return found;
})();
const BOARD_URL = "http://localhost:3008/?view=questions&filter=focus";
const BOARD_TITLE = "Slopdog Vanilla|Slop Dog"; // the T-280 rename hasn't reached every window title

const focusButton = () => !openFocusQuestions.length ? "" :
  `<p><a id="fq" href="#" data-focus-questions>Answer the ${openFocusQuestions.length} focus ticket${openFocusQuestions.length === 1 ? "" : "s"} with open questions on the board →</a></p>`;
const sections = (items) => items.map((s) =>
  `<h2>${esc(s.header)}</h2>${mdBlock(s.body)}${/where you can help/i.test(s.header) ? focusButton() : ""}`).join("");

const focusRows = (rows) => !rows.length ? "" :
  `<table data-focus-tasks><thead><tr><th>Ticket</th><th>Status</th><th>Toward the focus</th></tr></thead><tbody>${
    rows.slice(0, FOCUS_ROWS).map((r) => `<tr><td><span class="tag t-id">${esc(r.ticket)}</span></td><td>${esc(r.status ?? "")}</td><td>${inline(r.relation ?? "")}</td></tr>`).join("")
  }</tbody></table>${rows.length > FOCUS_ROWS ? `<p>and ${rows.length - FOCUS_ROWS} more in context.yaml</p>` : ""}`;
const focusBlock = (text) => text
  ? `<div class="card focus"><h2>Team focus</h2><p>${inline(text)}</p>${focusRows(focusTasks)}</div>` : "";

// T-524: forced dark, same as before this change — the popup is a floating night-time
// window (the i3 rule for TITLE), never a light-mode surface — so data-theme="dark" picks
// the dark half of report-style.css's tokens regardless of the system's colour scheme.
const page = `<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><title>${TITLE}</title><style>
${REPORT_CSS}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg)}
${answer.zoom ? `html{zoom:${Number(answer.zoom)}}` : ""}
main{padding:22px 28px 28px;height:100%;overflow:auto}
.bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
button{background:none;border:1px solid var(--rule);color:var(--muted);border-radius:8px;width:30px;height:30px;font-size:16px;cursor:pointer}
button:hover{color:var(--ink);border-color:var(--accent)}
.focus{margin-top:20px}
.focus h2{color:var(--wait)}
.hint{margin-top:22px;font-size:11px;color:var(--muted)}
a#fq{display:inline-block;padding:8px 14px;border:1px solid var(--wait);border-radius:8px;color:var(--wait);text-decoration:none;font-size:14px}
a#fq:hover{background:var(--wait-bg)}
.tweet{font:600 20px/1.4 Fraunces,Georgia,serif;margin:0 0 22px;padding:14px 16px;background:var(--paper);border-left:4px solid var(--accent);border-radius:0 6px 6px 0;max-width:none}
</style></head><body><main class="report-body">
<div class="bar"><span class="eyebrow">${esc(answer.head ?? `What's going on · last ${answer.hours ?? 6}h`)}</span><button id="x" title="Close (Esc)">✕</button></div>
${answer.sections
  ? sections(answer.sections) + workTable(answer.work) + focusBlock(focus)
  : answer.paragraphs
    ? answer.paragraphs.map((p) => `<p class="tweet">${inline(p)}</p>`).join("")
    : `<p class="tweet">${inline(answer.tweet)}</p>`}
<div class="hint">Esc closes · ask follow-ups in the pane</div>
</main><script>
const close = () => fetch("/close", { method: "POST" }).finally(() => window.close());
addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
// Closed some other way (an i3 kill, Mod+Shift+q): tell the server, so it exits instead of waiting.
addEventListener("pagehide", () => navigator.sendBeacon("/close?gone"));
document.getElementById("x").addEventListener("click", close);
document.getElementById("fq")?.addEventListener("click", (e) => {
  e.preventDefault();
  fetch("/focus-questions", { method: "POST" }).finally(() => window.close());
});
</script></body></html>`;

// T-464: take Todd to the board and load the Focus questions view in its current tab. The board
// is the window titled Slopdog Vanilla or Slop Dog, preferring workspace 3 and never 6 (that one
// is the agents' Work-profile browser). A bare `chromium <url>` would open a new tab in whichever
// window Chromium used last, and a new one per press, so instead: focus the board with i3, check
// it really is the active window, then type the URL into its address bar with xdotool. No board
// window: open one on workspace 3, where the board lives.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function findBoard() {
  const hits = [];
  const walk = (n, ws) => {
    if (n.type === "workspace") ws = n.name;
    if (n.window && new RegExp(BOARD_TITLE).test(n.name || "") && ws !== "6") hits.push({ con: n.id, win: n.window, ws });
    for (const k of [...(n.nodes || []), ...(n.floating_nodes || [])]) walk(k, ws);
  };
  try { walk(JSON.parse(execFileSync("i3-msg", ["-t", "get_tree"], { encoding: "utf8" }))); } catch {}
  return hits.find((h) => h.ws === "3") || hits[0];
}
// Every keystroke is untargeted, so the board must still be the active window before each one:
// if focus moved (to a desk's Claude Code pane, say) Return would send the URL there as a prompt.
// A board that exists but can't be focused is left alone rather than duplicated.
const activeIs = (win) => {
  try { return execFileSync("xdotool", ["getactivewindow"], { encoding: "utf8" }).trim() === String(win); } catch { return false; }
};
async function openBoard() {
  const board = findBoard();
  if (!board) {
    try { execFileSync("i3-msg", [`workspace 3; exec --no-startup-id chromium --new-window '${BOARD_URL}'`], { stdio: "ignore" }); } catch {}
    return;
  }
  try { execFileSync("i3-msg", [`[con_id=${board.con}] focus`], { stdio: "ignore" }); } catch {}
  await sleep(300);
  const steps = [["key", "--clearmodifiers", "ctrl+l"], ["type", "--delay", "4", BOARD_URL], ["key", "Return"]];
  for (const step of steps) {
    if (!activeIs(board.win)) return;
    try { execFileSync("xdotool", step); } catch { return; }
  }
}

let done = false;
function finish(killWindow) {
  if (done) return;
  done = true;
  // Esc or ✕: window.close() usually does it; the i3 kill makes sure the window is gone.
  // The page already gone, or the give-up timer: plain exit, since by then a title match could
  // be a newer lightbox.
  setTimeout(() => {
    if (killWindow) try { execFileSync("i3-msg", [`[title="^${TITLE}$"] kill`], { stdio: "ignore" }); } catch {}
    process.exit(0);
  }, 150);
}

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/close")) { res.end("ok"); finish(req.url !== "/close?gone"); return; }
  if (req.method === "POST" && req.url === "/focus-questions") { res.end("ok"); openBoard().finally(() => finish(true)); return; }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page);
});

// One lightbox at a time: a second /slopdog:wtf replaces the first.
try { execFileSync("i3-msg", [`[title="^${TITLE}$"] kill`], { stdio: "ignore" }); } catch {}

server.listen(0, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  spawn("chromium", [`--app=${url}`, "--new-window"], { detached: true, stdio: "ignore" }).unref();
  setTimeout(() => finish(false), GIVE_UP_MS);
});
