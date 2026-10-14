---
name: browse
description: Claim a website before driving a real browser on it, hand the task to the browser-driver subagent (Claude in Chrome in Todd's Work Chromium profile on workspace 6, on Sonnet), fall back to a plain window plus a live board question only for a site the extension refuses, and release the claim after. Use before ANY browser navigation of a real site — Claude in Chrome, a chromium window, a login, a sign-up, a dashboard, YouTube, X, a docs page — by a desk or a subagent, and when Todd says "/slopdog:browse", "open X in the browser", "go to the site", "log in to", or "who has the browser". Two agents on one site at once trips bot detection; this is the one-bot-per-site rule made mechanical.
---

# browse — one desk per site, on workspace 6

The rule is `~/slopdog/v2/rules/workspaces.md`: agents browse only on workspace 6, and
only one desk drives a given site at a time. This skill makes that a check and three commands.

`<desk>` is your desk key (your herdr agent name without the `herdr-` prefix, from `herdr agent list`, or your
folder's key in `~/slopdog/v2/lanes.json`). `<site>` can be a bare domain or a full URL;
`https://www.youtube.com/x` and `youtube.com` are the same site.

**Step 0 — check the extension is connected.** Before you claim anything or spawn anyone,
load `mcp__claude-in-chrome__list_connected_browsers` through `ToolSearch` and call it. A
non-empty list means go on to step 1. An empty list (or the tool missing) means stop here,
with no claim and no reader spawned, and say:

`extension not connected (signed out or Chromium down)`

An empty list does not say which: the extension in Todd's Work Chromium may be signed out (its
options page shows "Log in"), or Chromium may simply not be running. Name both, assert neither.
Then take the next move:

- **Read-only work** (reading a page, a feed, a docs site): read it through Firecrawl
  (`firecrawl_scrape` or `firecrawl_search`) instead, and say in your reply that you did.
- **Anything else** (a click, a form, a logged-in dashboard): write a `live: true` board
  question on the ticket in hand through `/slopdog:ask-todd`, asking Todd to open Chromium and
  sign the Claude in Chrome extension in, and carry on with other work until he answers.

**The other direction, and the one that gets forgotten (Todd, 2026-10-13): when the fetch path
fails, the extension is the read path.** A page that answers HTTP 402 or 403 to `WebFetch`, a
Firecrawl call that comes back out of credits, a bot-blocked or paywalled page — none of those is
a gap to write up. Claim the site and hand it to the `browser-driver`, which reads it in a real
signed-in browser where a plain fetch cannot. x.com is the standing example: it refuses every
anonymous fetch, so search-result snippets are all the fetch path ever returns, and a report that
stops there is reporting the tool's limit instead of the answer. Only say a source could not be
read after the extension has also failed on it.

**Step 1 — claim.**

```bash
node $HOME/.claude/skills/slopdog/cmux/browse/scripts/claim.mjs claim <site> <desk>
```

Exit 0 means the site is yours. Exit 1 prints the desk that holds it: stop, message that
desk, and wait for its release. Do not open the site in the meantime. A claim whose desk
has died, or that is two hours old, is taken over automatically, and the output says so.

**Step 2 — announce.** Run `claim.mjs list`. It is the record of who is browsing, and the
only desks that can clash with you are the ones holding a live claim, so send SendMessage one
line to each desk it names, other than yourself, and to no one else: `<Desk> is on <site> on
workspace 6 for T-nnn. Stay off it until I say I'm done.` When the list is empty, send nothing.
The same list is what a desk checks before it flags a clash: if `claim.mjs list` shows no other
desk on the site, there is no clash to raise. A subagent can't message desks: it returns that
line to its parent, and the parent sends it.

**Step 3 — hand it to the `browser-driver`.** Every browser task runs through the one
driver (T-317): the Claude in Chrome extension in Todd's Work profile (snap Chromium, profile
`Default`, "Browser 2" in `list_connected_browsers`) on workspace 6, driven by the
`browser-driver` subagent on Sonnet (`~/slopdog/v2/.claude/agents/browser-driver.md`). Give it
the task, the site, the ticket id, your desk key and, if a step may need Todd, a wait in
minutes. It works in its own tab and returns one line: `DONE:`, `NEEDS TODD:`, `REFUSED:`,
`TIMED OUT:` or `FAILED:`. It never types a password, key or card number, and it never clicks
through a login, a consent screen or a CAPTCHA.

**Step 4 — act on its line.**

- `DONE:` — use the answer, then go to step 5.
- `NEEDS TODD:` — its tab stays open on workspace 6. Write a `live: true` board question on
  the ticket (`rules/output-style.md`, T-313) naming the site, the tab and the one thing he has
  to do. When he answers or presses Launch, resume the same agent with SendMessage and it
  carries on, waiting up to the minutes you gave it.
- **A Launch line** (`Todd pressed Launch for qN on T-nnn: open it through the Claude in
  Chrome extension`, T-455) means the extension is the only first move: claim the site and
  hand it to the browser-driver, and talk Todd through the question in your own pane. Only if
  the driver returns `REFUSED:` do you use the fallback below, and then you say in one line in
  your pane that the extension refused the site.
- **A plain-window Launch line** (`Todd pressed Launch (plain window) for qN on T-nnn: open it
  with open-on-6.mjs, not the extension`, T-454) is Todd overriding that default for one press
  from the caret beside Launch: claim the site and go straight to the fallback below, without
  trying the extension first.
- `REFUSED:` — the extension will not drive that site (reddit.com is one). Use the fallback
  below, never a silent retry.

**Fallback, only for a site the extension refuses.** Open it in a plain window on 6:

```bash
node $HOME/.claude/skills/slopdog/cmux/browse/scripts/open-on-6.mjs <url>
```

It opens a new window in the same Work profile, moves it to workspace 6 and puts Todd's focus
back. In the same turn, write a `live: true` board question on the ticket in hand saying the
window is up on 6, what it is for and what to click, with options he can answer from there. A
window opened with no question beside it is the thing this skill exists to prevent: nobody is
watching it and nobody told him it is there.

**Step 5 — release and announce.**

```bash
node $HOME/.claude/skills/slopdog/cmux/browse/scripts/claim.mjs release <site> <desk>
```

Then send the desks you announced to one line: `<Desk> is done with <site>; it's free.` Close any
tab or window left open on 6 once no one needs it. `claim.mjs list` shows who holds what.

## Don't

- Don't open anything on workspaces 1, 2, 4 or 5. They are Todd's.
- Don't open a site with `open-on-6.mjs`, `chromium` or `xdg-open` unless the driver returned
  `REFUSED:` for it, and never without the live question.
- Don't skip the claim for a "quick look". A read-only visit still counts as a second bot.
- Don't hold a claim while waiting on Todd for hours; release it and claim again later.
