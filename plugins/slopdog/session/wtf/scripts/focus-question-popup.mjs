#!/usr/bin/env node
// focus-question-popup — T-478. The standalone popup for one open question, shown while
// `focus_mode: on` (context.yaml), launched by focus-question-watch.mjs. Reuses
// wtf-lightbox.mjs's mechanism (loopback HTTP server + Chromium --app window, the i3 float
// rule) but, unlike that one-shot answer viewer, this window is interactive: its buttons
// write the answer through the same route the board's Questions tab uses
// (POST /api/runner/tickets/update), Explain further stays open and polls for the reply, and
// it detaches so the calling watcher returns at once.
//
//   focus-question-popup.mjs <ticketFilePath> <questionId>
//
// The board must be reachable at localhost:3008 (BOARD_API below); if the write fails the
// popup shows the error and stays open rather than closing on a lost answer.
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [ticketFilePath, questionId, mode] = process.argv.slice(2);
if (!ticketFilePath || !questionId) {
  console.error("usage: focus-question-popup.mjs <ticketFilePath> <questionId>");
  process.exit(2);
}

if (mode !== "--serve") {
  spawn(process.execPath, [process.argv[1], ticketFilePath, questionId, "--serve"], { detached: true, stdio: "ignore" }).unref();
  console.log("→ focus question popup");
  process.exit(0);
}

const TITLE = "Focus question";
const BOARD_API = "http://localhost:3008";
const GIVE_UP_MS = 15 * 60_000;

const THEME = "~/slopdog/dev/playground/runner-live/src/app/globals.css";
const c = { base: "#1e1e2e", mantle: "#181825", surface0: "#313244", surface1: "#45475a", text: "#cdd6f4",
  subtext0: "#a6adc8", overlay0: "#6c7086", overlay1: "#7f849c", mauve: "#cba6f7", blue: "#89b4fa",
  peach: "#fab387", green: "#a6e3a1", red: "#f38ba8", teal: "#94e2d5" };
try {
  for (const [, k, v] of readFileSync(THEME, "utf8").matchAll(/--color-mocha-([a-z0-9]+):\s*(#[0-9a-f]{6})/gi)) c[k] = v;
} catch {}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Same option/body split QuestionsView.tsx renders from — question-parse.ts has no imports,
// so Node's native TS type-stripping (Node 24) loads it unmodified.
const { parseQuestion } = await import("~/slopdog/dev/playground/runner-live/src/lib/question-parse.ts");

async function fetchTicket() {
  const res = await fetch(`${BOARD_API}/api/runner/tickets`);
  if (!res.ok) throw new Error(`board GET failed: HTTP ${res.status}`);
  const tickets = await res.json();
  const ticket = tickets.find((t) => t.filePath === ticketFilePath);
  if (!ticket) throw new Error(`ticket not found: ${ticketFilePath}`);
  const q = (ticket.openQuestions || []).find((q) => q.id === questionId);
  if (!q) return { ticket, q: null }; // answered/resolved elsewhere — the popup should close
  return { ticket, q };
}

function laneName(key) {
  return { laforge: "LaForge", build: "Tyrion", ideas: "Daphne", scotty: "Scotty", qa: "QA" }[key || ""]
    || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "a desk");
}

function render(ticket, q) {
  const { body, options } = parseQuestion(q.text);
  const project = ticket.metadata?.project && String(ticket.metadata.project).toLowerCase() !== "none"
    ? ticket.metadata.project : "#meta";
  const optionsHtml = options.map((o) => `
    <button type="button" class="opt" data-letter="${esc(o.letter)}" data-text="${esc(o.text)}">
      <span class="letter">(${esc(o.letter)})</span>
      <span class="opt-body"><span>${esc(o.text)}</span>${o.why ? `<span class="why">${esc(o.label || "Why")}${o.confidence ? ` (${esc(o.confidence)} confidence)` : ""}: ${esc(o.why)}</span>` : ""}</span>
    </button>`).join("");
  const explanations = (q.explanations || []).map((x) => `
    <div class="explain-reply"><div class="explain-who">${esc(laneName(q.askedBy))} explains</div>${esc(x.text)}</div>`).join("");
  const waiting = q.explainAskedAt && !(q.explanations || []).some((x) => (x.timestamp || "") >= q.explainAskedAt);

  return `<!doctype html><html><head><meta charset="utf-8"><title>${TITLE}</title><style>
:root{color-scheme:dark}
/* Chromium draws at 1.5x on this screen; zoom 2/3 makes CSS px equal screen px, and every size is 13px
   with bold only on the title (Todd, 2026-10-07: "text size 13 for everything"). */
html{zoom:.6667}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:${c.base};color:${c.text};
  font:13px/1.5 ui-sans-serif,system-ui,sans-serif}
main{padding:20px 24px 24px;height:100%;overflow:auto;display:flex;flex-direction:column;gap:12px}
.bar{display:flex;align-items:center;justify-content:space-between;gap:8px}
.meta{font:13px ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:${c.overlay1}}
.meta b{color:${c.blue}}
button.close{background:none;border:1px solid ${c.surface1};color:${c.subtext0};border-radius:8px;width:28px;height:28px;font-size:13px;cursor:pointer}
button.close:hover{color:${c.text};border-color:${c.blue}}
h1{font:700 13px/1.4 ui-sans-serif,sans-serif;margin:0;color:${c.mauve}}
.asked{font:13px ui-monospace,monospace;color:${c.overlay1}}
.body{font-size:13px;line-height:1.6;color:${c.text};white-space:pre-wrap}
.explain-reply{border-left:2px solid ${c.teal};padding-left:10px;font-size:13px;color:${c.subtext0};white-space:pre-wrap}
.explain-who{font:13px ui-monospace,monospace;color:${c.teal};margin-bottom:2px}
.waiting{font-size:13px;color:${c.overlay0}}
.opts{display:flex;flex-direction:column;gap:8px}
button.opt{text-align:left;display:flex;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid ${c.surface0};
  background:${c.mantle};color:${c.subtext0};cursor:pointer;font-size:13px}
button.opt:hover{border-color:${c.blue};background:rgba(137,180,250,.08)}
button.opt:disabled{opacity:.5;cursor:default}
.letter{font-weight:400;color:${c.blue};flex-shrink:0}
.opt-body{display:flex;flex-direction:column;gap:2px}
.why{font-size:13px;color:${c.overlay1}}
.row{display:flex;align-items:center;gap:8px}
button.explain{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid ${c.surface0};
  background:none;color:${c.subtext0};font:13px ui-sans-serif;text-transform:uppercase;letter-spacing:.04em;cursor:pointer}
button.explain:hover{border-color:${c.teal};color:${c.teal}}
button.explain:disabled{opacity:.4;cursor:default}
form{display:flex;gap:8px;margin-top:4px}
input{flex:1;background:${c.mantle};border:1px solid ${c.surface0};border-radius:8px;padding:8px 10px;color:${c.text};font-size:13px}
input:focus{outline:none;border-color:${c.blue}}
button.answer{padding:8px 14px;border-radius:8px;border:none;background:${c.blue};color:${c.base};font:13px ui-sans-serif;
  text-transform:uppercase;letter-spacing:.04em;cursor:pointer}
.error{font-size:13px;color:${c.red}}
.hint{font-size:13px;color:${c.overlay0};margin-top:auto}
</style></head><body><main>
<div class="bar"><span class="meta">Project: <b>${esc(project)}</b> · ${esc(ticket.id)} · ${esc(q.id)}</span><button class="close" id="x" title="Close (Esc)">✕</button></div>
<h1>${esc(ticket.title.replace(/^ticket:\s*/i, ""))}</h1>
<div class="asked">Asked by ${esc(laneName(q.askedBy))}${q.timestamp ? ` · ${new Date(q.timestamp).toLocaleString()}` : ""}</div>
<div class="body">${esc(body)}</div>
<div id="explanations">${explanations}</div>
${waiting ? `<div class="waiting">asked, waiting on the desk</div>` : ""}
${options.length ? `<div class="opts">${optionsHtml}</div>` : ""}
<div class="row">
  <button type="button" class="explain" id="explain">Explain further</button>
</div>
<form id="answer-form">
  <input id="free" placeholder="${options.length ? "Or answer in your own words…" : "Your answer…"}" />
  <button type="submit" class="answer">Answer</button>
</form>
<div class="error" id="err"></div>
<div class="hint">Esc closes · queues behind any answered question · answers write to the board like the Questions tab</div>
</main><script>
const err = (m) => { document.getElementById('err').textContent = m || ''; };
const busy = (b) => { document.querySelectorAll('button,input').forEach(el => el.disabled = b); };
async function post(path, body) {
  busy(true); err('');
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  } catch (e) { err(e.message); busy(false); throw e; }
}
document.querySelectorAll('.opt').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const letter = btn.dataset.letter;
    const text = btn.dataset.text;
    await post('/answer', { text: '(' + letter + ') ' + text });
    window.close();
  });
});
document.getElementById('answer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('free').value.trim();
  if (!text) return;
  await post('/answer', { text });
  window.close();
});
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
let knownExplanations = ${JSON.stringify((q.explanations || []).length)};
let pollTimer = null;
function renderExplanations(list) {
  document.getElementById('explanations').innerHTML = list.map((x) =>
    '<div class="explain-reply"><div class="explain-who">' + esc(x.who || 'the desk') + ' explains</div>' + esc(x.text) + '</div>'
  ).join('');
}
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/state');
      const data = await res.json();
      if (data.closed) { window.close(); return; }
      if (data.error) return;
      if ((data.explanations || []).length > knownExplanations) {
        knownExplanations = data.explanations.length;
        renderExplanations(data.explanations.map((x) => ({ text: x.text, who: data.askedBy })));
        document.getElementById('explain').textContent = data.waiting ? 'Asked — waiting…' : 'Explain further';
        document.getElementById('explain').disabled = !!data.waiting;
      } else if (!data.waiting && document.getElementById('explain').disabled) {
        document.getElementById('explain').textContent = 'Explain further';
        document.getElementById('explain').disabled = false;
      }
    } catch {}
  }, 3000);
}
document.getElementById('explain').addEventListener('click', async () => {
  try { await post('/explain', {}); } catch { return; }
  busy(false);
  document.getElementById('explain').textContent = 'Asked — waiting…';
  document.getElementById('explain').disabled = true;
  startPolling();
});
if (${JSON.stringify(!!waiting)}) startPolling();
const close = () => fetch('/close', { method: 'POST' }).finally(() => window.close());
addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
addEventListener('pagehide', () => navigator.sendBeacon('/close?gone'));
document.getElementById('x').addEventListener('click', close);
</script></body></html>`;
}

let done = false;
function finish(killWindow) {
  if (done) return;
  done = true;
  setTimeout(() => {
    if (killWindow) try { execFileSync("i3-msg", [`[title="^${TITLE}$"] kill`], { stdio: "ignore" }); } catch {}
    process.exit(0);
  }, 150);
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url.startsWith("/close")) { res.end("ok"); finish(req.url !== "/close?gone"); return; }
  if (req.method === "POST" && (req.url === "/answer" || req.url === "/explain")) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    try {
      const payload = req.url === "/answer"
        ? { filePath: ticketFilePath, who: "Todd", answer: { questionId, text: body.text } }
        : { filePath: ticketFilePath, who: "Todd", explain: { questionId } };
      const upstream = await fetch(`${BOARD_API}/api/runner/tickets/update`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok || !data.success) throw new Error(data.error || `HTTP ${upstream.status}`);
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (req.method === "GET" && req.url === "/state") {
    try {
      const { q } = await fetchTicket();
      if (!q) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ closed: true })); return; }
      const waiting = q.explainAskedAt && !(q.explanations || []).some((x) => (x.timestamp || "") >= q.explainAskedAt);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ explanations: q.explanations || [], waiting, askedBy: laneName(q.askedBy) }));
    } catch (e) {
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  try {
    const { ticket, q } = await fetchTicket();
    if (!q) { res.writeHead(200, { "content-type": "text/html" }); res.end(`<script>close()</script>`); finish(true); return; }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(render(ticket, q));
  } catch (e) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<pre style="color:#f38ba8;background:#1e1e2e;padding:20px">${esc(e.message)}</pre>`);
  }
});

// One popup at a time: a second call for a different question replaces this one; the watcher
// only calls this when no "Focus question" window is open, so this is a same-question refresh.
try { execFileSync("i3-msg", [`[title="^${TITLE}$"] kill`], { stdio: "ignore" }); } catch {}

server.listen(0, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  spawn("chromium", [`--app=${url}`, "--new-window"], { detached: true, stdio: "ignore" }).unref();
  setTimeout(() => finish(false), GIVE_UP_MS);
});
