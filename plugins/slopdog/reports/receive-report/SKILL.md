---

Desk-to-desk ladder: SendMessage first, then inbox-write.mjs, then pane typing as the last resort and only into a named herdr agent pane. Email is for humans and the outside world, not desk to desk. See ~/slopdog/v2/CLAUDE.md (Desk file inbox).
name: receive-report
description: The Research desk's intake for a report another desk already wrote. Use when another agent or desk sends the research desk something called a "report", or anything that is already preliminary reporting (findings, a test write-up, a draft, notes "for you to file"), as opposed to a request for new research. Also when Todd says "receive report", "/slopdog:receive-report", "file this report from IT", "archive their report", or "here's a report from <desk>". It checks the draft, reshapes it into the house report template and files it in the research desk's reports archive, where every report lives.
---

# receive-report — another desk's report, checked and archived

All reports live in the research desk (Todd, 2026-10-04: "I want all of our reports to be
in your reports desk"). A desk that has done the work sends its draft here, and this skill
turns the draft into a filed report. Doing new research is not this skill: that is the
desk's normal job.

The worked example: the IT desk's draft `v2/desks/it/notes/2026-10-04-dunst-notification-test.md`
became `v2/desks/research/reports/2026-10-04-dunst-notifications.md`.

1. **Read the draft whole.** Use the path or the pasted text you were given. If the message
   arrived cut off, file what you have and ask the sender for the rest in step 6.
2. **Spot-check what is cheap to check.** Config values, file paths, version numbers and
   counts. Correct anything wrong in the reshaped report, and say in the Appendix's Methodology what you checked
   and what you corrected. Don't re-run the sender's experiments; mark those claims as
   theirs.
3. **Reshape it into the template.** The shape is the house report shape in
   `/slopdog:file-report` ("Report shape: three sections"): a three-tweet intro, a summary
   table, a table of contents, three sections of at most three subsections, then an
   Appendix. The research desk's template (`~/slopdog/v2/desks/research/CLAUDE.md`, "The
   template") says which research content goes in which section. Put the sender's main
   table or findings in a subsection. If a more specific template exists for this kind of
   report, use that one inside the same shape (a sprint report goes through
   `/slopdog:sprint-planning-report`). Name the sending desk and its people in the
   Appendix's Sources and Methodology. Keep the sender's findings; change the shape, not
   the substance.
4. **File it.** Write `~/slopdog/v2/desks/research/reports/YYYY-MM-DD-<slug>.md` with the
   frontmatter `title`, `date`, `kind: research`, `project`, `summary`. Leave the
   sender's draft where it is; the report names its path.
5. **Index and commit.** Add one line to `~/slopdog/v2/desks/research/digest.md` (date,
   title with "(from <desk>)", one-sentence verdict, path, tickets). Run
   `node ~/slopdog/tasks/bin/index-research-reports.mjs`. Commit the report and the
   digest by path in `~/slopdog`, and `reports/index.jsonl` by path in `~/slopdog/tasks`.
   Push both.
6. **Reply to the sender.** Use the desk-to-desk ladder at the top of this skill. Give the filed path, every correction, and any
   question about a truncated message. Tell Todd in one line in your pane that the report
   is filed.

## Don't

- Don't start new research from a received report. If the draft leaves a real gap, say so
  in the Appendix's Implementation notes and ask the sender.
- Don't publish an Artifact or a deck unless Todd asks; `/slopdog:file-report` does that.
- Don't file a received report anywhere but the research desk's `reports/`.
