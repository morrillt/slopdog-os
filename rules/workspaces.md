# Workspaces on the ThinkPad

Todd, 2026-09-24: "you guys are constantly opening up browsers in random workspaces and it
throws off my vibe." So the i3 workspaces have owners, and an agent opens nothing in one that
is not its own.

| Workspace | Owner | What is there |
| --- | --- | --- |
| 1, 2, 3, 5 | Todd | His windows. Never open, move or focus anything there, with one exception: `/slopdog:boot-up` opens the Slopdog Universe as a chromeless window on 1, where Todd asked for it (2026-10-11). |
| 4 (SD-UI) | Todd, the board | Slop Dog (renamed from the ticket runner, T-280): the Chromium window showing `http://localhost:3008` (titled "Slopdog Vanilla" now), on the main monitor (HDMI-1). Workspace 3 is "3 (swarm)", the herdr desks. The i3 workspaces are named, so a script targets `workspace "4 (SD-UI)"`; a bare `workspace 4` makes a stray empty one. It is the one window the team drives to show or click something on the board. If it is closed, `~/scripts/board-and-tray.mjs` (also in the Mod+Shift+S script menu) reopens it on 4 and brings the Gist Tray back. |
| 6 | Agents, browsing | The one place an agent drives a real browser. Every browser task runs through the `browser-driver` subagent (Sonnet), which drives the Claude in Chrome extension in Todd's Work Chromium profile, one tab per task (T-317). On a live question, when Todd presses Launch and the asking desk's pane receives `Todd pressed Launch for qN on T-nnn: open it through the Claude in Chrome extension` (T-455), the browser-driver through the Claude in Chrome extension is the only first move, and the desk talks him through the question in its own pane. When he picks Plain window from the caret beside Launch, the line reads `Todd pressed Launch (plain window) for qN on T-nnn: open it with open-on-6.mjs, not the extension` (T-454) and the desk goes straight to `open-on-6.mjs`. A plain window opened with `open-on-6.mjs` is only the fallback for a site the extension refuses: the asking desk says in one line in its pane that the extension refused the site, and any other plain window always comes with a `live: true` board question telling Todd it is up. |
| 8 | Agents | Where an agent opens anything else of its own: a preview, a glow pane, a test terminal. Open it there (`i3-msg 'workspace 8; exec …'` or move it there right after), and never leave it on the workspace Todd is looking at. |
| 9 | Moonlight | The Mac, streamed. Nothing else goes there. |
| 10 | Headed Playwright | Never shown. Playwright runs headless: every `playwright.config.ts` defaults to it, and a headed run (`--headed` or `PLAYWRIGHT_HEADLESS=0`) refuses to start without `PW_HEADED_REASON="why"`, which it announces to Todd as a terminal line and a notify-send. A deliberate headed window launches with `--class=PlaywrightChromium`, and the i3 config assigns that class here with `no_focus`. Because 10 is never visible, Chromium's activation request after a page load only marks it urgent; on a visible workspace (8 on the left monitor, say) i3 would grant it and move Todd's focus. `~/.config/i3/scripts/check-playwright-class.mjs` exits 1 naming any config that defaults to headed, skips the reason gate or lacks the class (T-434). |

**One bot per site.** Two agents on one site at once trips bot detection (Todd, 2026-09-26), so every browser visit goes through `/slopdog:browse`: it claims the site, tells the desks, hands the task to the `browser-driver` and releases the site after.

How to open something on 6 or 8 without stealing focus (a browser: the `browser-driver`, or for a site the extension refuses `/slopdog:browse`'s `open-on-6.mjs` fallback, since Chromium maps on the focused workspace whatever `exec` says): `i3-msg -t get_workspaces` to remember the
focused workspace, `i3-msg 'workspace 6; exec --no-startup-id <cmd>'` (or 8), then
`i3-msg 'workspace <the one he was on>'`. The i3 config pins 3 and 8 to the left monitor and
lives in `~/.config/i3/config` (its own repo); the hotkeys doc is
`notes/Reference/hotkey preferences.md`. A skill that opens things for Todd on the Mac
(`/slopdog:cmux-panel`) is the Mac's version of the same rule.
