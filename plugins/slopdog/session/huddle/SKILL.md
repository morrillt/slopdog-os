---

Desk-to-desk ladder: SendMessage first, then inbox-write.mjs, then pane typing as the last resort and only into a named herdr agent pane. Email is for humans and the outside world, not desk to desk. See ~/slopdog/v2/CLAUDE.md (Desk file inbox).
name: huddle
description: Call a huddle from the Ideas desk — set the night's focus in one sentence, send every live desk its ordered ticket queue and the one outcome Todd should wake up to, collect a one-line ack of each desk's first ticket, and record it all in one dated file. Use when Todd says "huddle", "/slopdog:huddle", "call a huddle", "get everyone on the same page", "get everybody on goal", or "set the focus for the night".
disable-model-invocation: true
---

# huddle — one focus, every desk on it, written down

Todd, 2026-09-27: "call Huddle where we set the focus for the night, and keep it,
get everybody on goal." Run from the Ideas desk (Daphne).

1. **Focus.** Take the focus as one sentence from `$ARGUMENTS`, or from the
   conversation if empty. Set it with `/slopdog:set-focus` (it writes
   `~/slopdog/v2/context.yaml`).
2. **Desks.** Always Tyrion (`build`, the dispatcher of the one building team) and Scotty
   (`scotty`, the IT desk), plus any other lane in `~/slopdog/v2/lanes.json` whose pane is live
   (`herdr agent list` shows them, one agent named `herdr-<lane>` per desk).
3. **Queues.** For each desk, pick its ordered queue from
   `~/slopdog/tasks/task-list.md`: ticket id and full title, in order, the ones
   that serve the focus first. Name the one outcome Todd should wake up to.
4. **Send.** One short note per desk: the focus, its queue, the wake-up outcome,
   and "reply with one line confirming your first ticket." Send it by the desk-to-desk ladder at the top of this skill.
5. **Record.** Write `~/slopdog/v2/desks/ideas/huddles/YYYY-MM-DD-HHMM.md` (local
   time from `date`): the focus, one section per desk with its queue and outcome,
   and an Acks line per desk, filled in as replies arrive ("no reply" if none).
   Commit that path only, and push.
6. **Tell Todd** in one line: focus set, how many desks huddled, the file path.

Don't: write tickets here (that is `ticket-add`), change ticket statuses, or
message a desk more than once per huddle unless it asks.
