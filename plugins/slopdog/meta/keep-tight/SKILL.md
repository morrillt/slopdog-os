---
name: keep-tight
description: Check that the Skills Manifest, the slopdog plugin.json and the folders on disk agree — same groups, same names, every skill has a row, every link resolves, installer copies match — and email Todd the incongruencies or an all-clear. Runs weekly from launchd; also on demand when Todd says "keep it tight", "/slopdog:keep-tight", "are the skills tight", "check the manifest", "is the manifest in sync", or "audit the skills".
allowed-tools:
  - Bash
  - mcp__claude_ai_Gmail__send_message
disable-model-invocation: true
---

# keep-tight — manifest, plugin.json and folders must agree

Todd's word for it: "keeping it tight." Three things describe the skill set —
the Manifest's §2/§3 tables, the plugin's `skills` array, and the folders on
disk — and they drift apart one edit at a time. This checks all three against
each other, plus the installer copies and the manifest links, and reports.

**Step 1 — run the check.**

```bash
node ~/.claude/skills/slopdog/meta/keep-tight/scripts/check-tight.mjs
```

Prints a markdown report; exit 0 = all clear, 1 = incongruencies. The report
is the deliverable — don't rewrite it, don't add to it.

**Step 2 — file it.**

```bash
mkdir -p ~/slopdog/logs/keep-tight
node ~/.claude/skills/slopdog/meta/keep-tight/scripts/check-tight.mjs > ~/slopdog/logs/keep-tight/$(date +%F).md || true
```

**Step 3 — propose the fixes and file a ticket** (skip when all clear).

For each incongruency write one proposed fix — the exact `/slopdog:edit-skill`
adjust call, or the one-line manifest/plugin.json edit — as a checklist. Then
write it as a ticket in `~/slopdog/tasks`, following `/ticket-add`'s format
exactly (next unused `T-0NN` across `task-list.md` **and** `archive.md`; never
reuse an ID; new row goes first under the header separator):

- `tickets/keep-tight-<YYYY-MM-DD>.md` — title `keep-tight <date>: <n>
  incongruencies`, `## What` = the report, `## Notes` = the proposed-fixes
  checklist.
- Row: `| T-0NN | ⚪ | [keep-tight <date>](tickets/keep-tight-<date>.md) | <n> incongruencies, fixes proposed | from launchd |`

Proposing is not fixing: nothing outside `~/slopdog/tasks` and the log is
written.

**Step 4 — email it** with `mcp__claude_ai_Gmail__send_message`:

- to: Todd's own address
- subject: `Slopdog keep-tight: all clear` or `Slopdog keep-tight: <n> incongruencies`
- body: the report verbatim, then the proposed-fixes checklist, then one closing
  line with the ticket — `T-0NN · ~/slopdog/tasks/tickets/keep-tight-<date>.md` —
  and the report path.

If the Gmail tool isn't available (a session without the connector), skip
the email and say so in the reply; the ticket and the file from step 2 are
still there.

**Step 5 — one line back:** `keep-tight: all clear` or
`keep-tight: <n> incongruencies — T-0NN, emailed, <path>`. Nothing else.

## Don't

- Don't fix anything here. This audits and *proposes*; `/slopdog:edit-skill`
  fixes. Todd decides what to apply from the email and the ticket.
- Don't open the report in a panel.
- Don't soften the report. An incongruency is an incongruency.

## Schedule

`~/Library/LaunchAgents/com.slopdog.slopdog-keep-tight.plist` runs
`claude -p "Run /slopdog:keep-tight"` Mondays 09:15; log at
`~/.local/state/slopdog-keep-tight.log`. Reload after editing the plist:
`launchctl bootout gui/$(id -u)/com.slopdog.slopdog-keep-tight; launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.slopdog.slopdog-keep-tight.plist`.
