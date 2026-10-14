---
name: voice-bloom
description: Turn one of Todd's raw voice recordings — a "voice bloom" — into a numbered list of idea branches with one ticket tip per branch, while the audio and its transcript stay on disk and never enter the calling desk's context. Preserves the recording, the transcript and the branch list under ~/slopdog/v2/desks/ideas/voice-blooms/<YYYY-MM-DD>-<slug>/ so a ticket can cite them. Use when Todd says "voice bloom", "/slopdog:voice-bloom", "process this recording", "transcribe my voice memo", "here's a bloom", or hands over an .mp3/.m4a of himself thinking aloud. /slopdog:ideate calls it for voice input.
---

# voice-bloom — a recording in, branches and tips out

Todd's ideas arrive as recursive clusters (`~/slopdog/v2/memory/todd-ideates-in-fractal-clusters.md`).
A fifteen-minute bloom is ~15 MB of audio and thousands of words; a desk that reads that
cannot think afterwards. So **the transcript never enters your context**: one subagent does
steps 1 and 2 and hands back only the branch list. Engine: ElevenLabs Scribe v2 with a
house vocabulary list (Samwell's benchmark, T-417; without the list every engine wrote
"Todd Morrow").

## Step 0 — get the file on disk

Input: a recording (a path, a Gmail message, or a Slack DM). Output: an audio path on disk.
The Gmail connector cannot fetch attachment bytes; download through the browser
(`/slopdog:browse`) or Gmail's "Save to Drive" plus `rclone copy`. Gmail's listed size is
about a third bigger than the file (base64). Pick a kebab-case `<slug>` from the email
subject or Todd's words, three or four words.
A voice note shared to the Slop Dog Slack DM is already on disk: the listener
(`slack-channel.mjs`) downloads it to `~/slopdog/v2/desks/ideas/voice-blooms/<date>-<slug>/recording.<ext>`
and the pane message names that path plus the `channel` and `thread_ts`. Pass that path to
`bloom.mjs` with no `--slug`; at Step 3 the branch list goes back in that thread through the listener's `reply` tool.

## Step 1 and Step 2 — one subagent transcribes and branches

Spawn **one** `general-purpose` subagent, `model: sonnet`, with this brief, filling the
two blanks. Do not read the transcript or `branches.md` yourself afterwards.

```
Run: $HOME/.claude/skills/slopdog/session/voice-bloom/scripts/bloom.mjs <audio path> --slug <slug>
(omit --slug <slug> when the path is already inside voice-blooms/; add --transcript <path> only
if a Scribe transcript of this exact recording already exists).
It copies the recording (unless it is already in voice-blooms/) and writes transcript.txt into the folder it prints.

Read transcript.txt. Todd thinks in recursive clusters: one ask opens five or six related
threads, depth-first, jumping up to the abstract and back down. Split it into numbered
branches, one per distinct idea; a sub-idea opened inside a branch is its own sub-branch
(1.1, 1.2). For each branch write: a title of a few words, one sentence on what Todd
wants in plain words, and a ticket tip — the one-line title a ticket for it would carry,
or "no ticket: <why>" when it is a remark, a principle or a feeling rather than work —
and a feature line, `feature: <slug>`: the one Slopdog feature the branch touches, picked
from the `slugs:` list at the top of
~/slopdog/notes/Slopdog/How Slopdog Works/Slopdog Features.md (read only that list),
`feature: <slug>, <slug>` only when it is genuinely about two, never three, and
`feature: none` when it touches no feature rather than forcing the nearest one.
Transcription errors are likely on names; read for intent.

Write that list to branches.md in the same folder, under a header naming the recording
and today's date. Reply with ONLY: the folder path, then the numbered list (title, tip
and feature per line). No quote from the recording longer than one short phrase, no summary
paragraph, no transcript text.
```

## Step 3 — hand the list on

Input: the subagent's list. Output: the list in front of whoever asked.
- Called by `/slopdog:ideate`: the branches are its threads; carry on at its step 2. Each
  branch's `feature:` is ideate's proposed slug for that thread (T-658): Todd can correct it in
  the pane, and the confirmed slug is what `capture-idea.mjs --feature` writes into the intake
  front matter.
- Called directly: show Todd the numbered list and the folder path, then route the
  branches with `/slopdog:ideate`.
- Came from the Slack DM: post the numbered list in the same thread (`channel`, `thread_ts`)
  through the listener's `reply` tool as well.
- A ticket that grows out of a branch cites `voice-blooms/<folder>/branches.md` and the
  branch number, so the source stays addressable.

## What the folder holds

`recording.<ext>` (gitignored: audio stays on the machine that made it), `transcript.txt`
and `branches.md` (committed with the slopdog repo by path). Re-running on the same slug
reuses the transcript on disk; Scribe is only called once per recording.

## Don't

- Don't `cat`, `Read` or grep the transcript in the desk, and don't `git diff` or `git show` a
  commit that adds one: either prints the whole transcript. That is the whole point.
- Don't hard-code a second engine. A new one is a ticket with a benchmark behind it.
- Don't commit the audio.
