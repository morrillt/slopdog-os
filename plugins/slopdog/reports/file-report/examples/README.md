# Report examples

- `../templates/sprint-planning-report.md` — outline for **sprint planning** meeting reports;
  `/slopdog:sprint-planning-report` reads it every run. Worked example on disk:
  `~/slopdog/v2/reports/2026-10-03-slopdog-shaping-and-delivery-the-three-meta-batches-for-review.md`
  plus its HTML; live sprint planning layout:
  `~/slopdog/v2/reports/Sprint planning: Slopdog shaping and delivery.html`.

- `batch-report-gold.html` — "Gmail Pipeline State" (2026-09-27). Todd's gold standard for a batch report: "this is the best report that we've ever made." What he named as why: it opens with the verdict as a TLDR; then why / what / how; a graphic of which stages work today; simple cards; a visual of the tickets ready for review and how many; what has been shown to work; problems; what is waiting on his answers. His one change: end with a checklist of what Todd does next.

  Todd's second change: never assume he knows what a ticket is. Wherever the report names a ticket, give its full title and one plain sentence of the value it delivers: what the user can now do (from its user story) or, when it is not user-facing, what it lets one part of the system do with another. Full sentences, no bare T-numbers or codes.

A report on a project's state carries its own ready-to-review table; Todd should never need a second report to see what to verify (2026-09-27).

  Todd's third change (2026-09-27): the Proof column is the Verify step's method, one tweet long, in words Todd understands: what was actually done to verify, with evidence from something real of his, never "the tests pass" or "the notes say so". His example: "I saw your email come in; it was sent at this time, it arrived at this time, and the difference was five milliseconds." No extra columns; the Proof cell carries it. If no real-world check was done, the cell says so and the row is not "ready".

  Todd's fourth change (2026-09-27): a row is ready, and counts toward its batch being ready for review, only when the team ran an end-to-end test itself (Playwright, Puppeteer or the Chrome extension) against the real app. Each row says "As a user, you can now …", gives a link that opens exactly that, and its proof names the end-to-end run in plain words. A row without one is marked not ready and says which end-to-end run it still needs.

  Todd's fifth change (2026-09-27): a project report leads, right after the verdict, with the batch-level picture. That's one short paragraph per batch, saying what he can do now, what's left and what it waits on, then a one-line bottom line. Tickets come after, for detail. He cares about the batch level more than the ticket level. The model text is the "project status at the batch level" example in ~/slopdog/v2/desks/ideas/asking-todd-examples.md.
