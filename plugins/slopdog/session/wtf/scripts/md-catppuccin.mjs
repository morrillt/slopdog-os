#!/usr/bin/env node
// md-catppuccin — render a markdown file as Catppuccin Mocha HTML and keep it
// in step with the file on disk.
//
//   md-catppuccin.mjs <file.md> [--open] [--watch]
//
// Why this exists: cmux's built-in markdown viewer renders on white and has no
// palette setting — its schema (cmux.schema.json, properties.markdown) exposes
// only fontSize, fontFamily and maxWidth. macOS is in dark mode, cmux's app
// appearance follows it, and the terminals are Catppuccin Mocha; the markdown
// panes are the one bright rectangle left. Todd, 2026-09-02: "anything we can
// do to just have the summary page not blind me with white".
//
// So: convert to HTML ourselves, style it, and open it as a browser surface.
// The page reloads itself every few seconds and restores scroll position, which
// is the closest thing to the built-in viewer's live reload without it.
import { readFileSync, writeFileSync, mkdirSync, watch } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, resolve } from "node:path";

const HOME = process.env.HOME;
const OUT_DIR = `${HOME}/.cache/slopdog-wtf/md-view`;
const CMUX = process.env.CMUX_CLAUDE_TEAMS_CMUX_BIN
  || "/Applications/cmux.app/Contents/Resources/bin/cmux";

const args = process.argv.slice(2);
const src = resolve(args.find((a) => !a.startsWith("--")) || "");
if (!src) { console.error("usage: md-catppuccin.mjs <file.md> [--open] [--watch]"); process.exit(1); }
const doOpen = args.includes("--open");
const doWatch = args.includes("--watch");

// Catppuccin Mocha. https://catppuccin.com/palette
const C = {
  base: "#1e1e2e", mantle: "#181825", surface0: "#313244",
  surface1: "#45475a", surface2: "#585b70", overlay1: "#7f849c",
  text: "#cdd6f4", subtext0: "#a6adc8", subtext1: "#bac2de",
  blue: "#89b4fa", lavender: "#b4befe", sapphire: "#74c7ec", sky: "#89dceb",
  yellow: "#f9e2af", peach: "#fab387", mauve: "#cba6f7",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inline: pull code spans out first so nothing rewrites inside them, then
// escape, then links and emphasis, then put the code spans back.
function inline(s) {
  const code = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    code.push(`<code>${esc(c)}</code>`);
    return `@@CODE${code.length - 1}@@`;
  });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki">$1</span>');
  s = s.replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  return s.replace(/@@CODE(\d+)@@/g, (_, i) => code[+i]);
}

function render(md) {
  const out = [];
  const lines = md.split("\n");
  let i = 0;
  const list = (tag, items) =>
    out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {                                  // fenced code
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }

    if (/^\|/.test(line) && /^\|?[\s:|-]+\|/.test(lines[i + 1] || "")) {   // table
      const cells = (l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|/.test(lines[i])) body.push(cells(lines[i++]));
      out.push(
        `<div class="tw"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
        `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      );
      continue;
    }

    if (/^>\s?/.test(line)) {                                 // blockquote / callout
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      const cal = buf[0] && buf[0].match(/^\[!(\w+)\]\s*(.*)$/);
      if (cal) buf[0] = `**${cal[1].toUpperCase()}** ${cal[2]}`;
      out.push(`<blockquote${cal ? ` class="cal ${cal[1].toLowerCase()}"` : ""}>${render(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      list("ul", items);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      list("ol", items);
      continue;
    }

    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
           !/^(#{1,6}\s|>|\||```|---+\s*$|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

// Match the terminal. Todd, 2026-09-02: "i want the text to match a bit better,
// i like this jetbrain nerd font". Propo is the proportional-spaced cut — it
// keeps the JetBrains shapes and the Nerd Font glyphs but reads as prose rather
// than a column of fixed cells; the Mono cut is kept for code and tables, where
// alignment is the point. Override either with MD_FONT / MD_FONT_MONO.
const FONT = process.env.MD_FONT
  || `"JetBrainsMono Nerd Font Propo","JetBrainsMono Nerd Font",ui-monospace,monospace`;
const FONT_MONO = process.env.MD_FONT_MONO
  || `"JetBrainsMono Nerd Font Mono","JetBrainsMono Nerd Font",ui-monospace,Menlo,monospace`;
const SIZE = +(process.env.MD_SIZE || 14);

const page = (md, title) => `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(title)}</title><style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:${C.base};color:${C.text};
  font:${SIZE}px/1.62 ${FONT};
  font-feature-settings:"calt" 1,"liga" 1;
  -webkit-font-smoothing:antialiased;
  padding:28px 32px 80px}
main{max-width:1040px;margin:0 auto}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.6em 0 .6em;font-weight:650}
h1{font-size:1.9em;color:${C.lavender};margin-top:0;border-bottom:1px solid ${C.surface0};padding-bottom:.3em}
h2{font-size:1.4em;color:${C.blue}}
h3{font-size:1.15em;color:${C.sapphire}}
h4,h5,h6{font-size:1em;color:${C.sky}}
p{margin:.75em 0}
a{color:${C.blue};text-decoration:none;border-bottom:1px solid ${C.surface1}}
a:hover{color:${C.sky};border-bottom-color:${C.sky}}
.wiki{color:${C.mauve};border-bottom:1px dashed ${C.surface2}}
strong{color:${C.text};font-weight:680}
em{color:${C.subtext1}}
del{color:${C.overlay1}}
code{background:${C.mantle};color:${C.peach};padding:.12em .38em;border-radius:5px;
  font:0.92em/1.5 ${FONT_MONO}}
pre{background:${C.mantle};border:1px solid ${C.surface0};border-radius:9px;
  padding:14px 16px;overflow-x:auto;margin:1em 0}
pre code{background:none;color:${C.subtext1};padding:0;font-size:.86em}
hr{border:0;border-top:1px solid ${C.surface0};margin:2em 0}
blockquote{margin:1em 0;padding:.6em 1em;background:${C.mantle};
  border-left:3px solid ${C.surface2};border-radius:0 8px 8px 0;color:${C.subtext0}}
blockquote p:first-child{margin-top:0}
blockquote p:last-child{margin-bottom:0}
blockquote.cal{border-left-width:4px}
blockquote.cal.warning{border-left-color:${C.yellow}}
blockquote.cal.warning strong{color:${C.yellow}}
blockquote.cal.important{border-left-color:${C.mauve}}
blockquote.cal.important strong{color:${C.mauve}}
blockquote.cal.note{border-left-color:${C.blue}}
blockquote.cal.note strong{color:${C.blue}}
ul,ol{margin:.7em 0;padding-left:1.5em}
li{margin:.3em 0}
li::marker{color:${C.overlay1}}
.tw{overflow-x:auto;margin:1.1em 0;border:1px solid ${C.surface0};border-radius:9px}
table{border-collapse:collapse;width:100%;font:.9em/1.5 ${FONT_MONO}}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid ${C.surface0};vertical-align:top}
th{background:${C.mantle};color:${C.lavender};font-weight:620;white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:${C.mantle}}
footer{max-width:980px;margin:40px auto 0;padding-top:14px;border-top:1px solid ${C.surface0};
  color:${C.overlay1};font-size:12px}
</style></head><body><main>
${render(md)}
</main><footer>${esc(basename(src))} &middot; Catppuccin Mocha &middot; re-rendered ${new Date().toLocaleTimeString()}</footer>
<script>
// Live reload without losing your place: the built-in viewer gets that free,
// a file:// page has to do it by hand.
try { var y = sessionStorage.getItem("y"); if (y) window.scrollTo(0, +y); } catch (e) {}
setInterval(function () {
  try { sessionStorage.setItem("y", window.scrollY); } catch (e) {}
  location.reload();
}, 4000);
</script></body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
const dst = `${OUT_DIR}/${basename(src).replace(/\.(md|markdown|mkd|mdx)$/i, "")}.html`;

function build() {
  const md = readFileSync(src, "utf8");
  const title = (md.match(/^#\s+(.+)$/m) || [, basename(src)])[1];
  writeFileSync(dst, page(md, title));
}

build();
console.log(dst);

if (doOpen) {
  try { execFileSync(CMUX, ["open", dst, "--focus", "false"], { stdio: "ignore", timeout: 8000 }); }
  catch (e) { console.error("cmux open failed: " + e.message); }
}

if (doWatch) {
  let t = null;
  watch(src, () => { clearTimeout(t); t = setTimeout(() => { try { build(); } catch {} }, 150); });
  setInterval(() => {}, 1 << 30);
}
