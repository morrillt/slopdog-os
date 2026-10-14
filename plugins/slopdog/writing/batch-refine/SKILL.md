---
name: batch-refine
description: Refine a batch document that already exists — settle its summary and tips with Todd first, then bring its requirements and verify lines in line with the agreed why, what and how, then check its tickets for alignment and ask what new tickets the new shape needs, then settle the cross-cutting tests the new shape implies. Use when Todd says "refine the batch", "/slopdog:batch-refine", "reshape this batch", "the batch summary isn't clear", "fix the FRs", "do the requirements still reflect that", "check the tickets against the batch", or reads a batch file aloud and starts dictating changes to it. For a batch that does not exist yet, that is /slopdog:batch-writer.
---

# batch-refine — a batch already written, taken round again

Six steps, in order. Each step's output is the next step's input, and a step is not started
until the one above it is settled with Todd. The order is the point: the requirements are
derived from the tips, and the verify lines are derived from their own requirement, so working
upward wastes the pass. Run it on one batch file at a time.

**Step 1 — settle the high level: the summary and the tips, with Todd, out loud.**
Read the batch file. Say in one paragraph what its summary currently claims and where that
claim and Todd's directive disagree. Propose the rewritten summary and the rewritten why, what
and how as text he can react to, not as a description of a change. Then push: say which of his
readings you think is weaker and why, and do not settle on the first agreement. Nothing is
written to the file until he says the tips are right.

**Step 2 — get the set of requirements right, as a set.**
Before any single requirement is reworded, settle which requirements the agreed tips imply:
which are missing, which two are one requirement seen from two ends and should be squashed,
and which the new shape has orphaned. Squash rather than keep a near-duplicate — a retired
number is retired and never reused. Continue the file's existing FR sequence for anything new
and never renumber an existing FR. This step ends with an agreed list of requirement titles,
not with their final wording.

**Step 3 — refine the requirements one at a time.**
Take each requirement in turn, not the set at once. Each requirement must match the batch shape
the template and `batch-writer` example enforce: a statement in Todd's voice (long and explicit,
not a single sentence), one or more italicised labelled definition blocks for any term the
statement leans on (each block a short list of concrete bullets), and three to five `*Verify:*`
lines. Its heading must say `— hangs from How bullet N`, and the How bullet it names must end
with `*(Owns FR-n.)*` for that same FR — the two-way mapping is settled here, not left for a
later pass. Three questions per requirement, answered in the file rather than in the chat: does
its title name what the summary now claims; does its wording use the vocabulary the new tips
use; and does it promise one thing rather than several. Settle each one with Todd before moving
to the next.

**Step 4 — readjust that requirement's verify lines, before moving on.**
As soon as a requirement is solid, re-read its verify lines against it and rewrite the ones
that now test the wrong thing. Count them: three to five per requirement, each able to fail on
its own (a command that can exit non-zero, a path that can be missing, a judgment Todd could
disagree with). A verify line that cannot fail is not a verify line. This happens per
requirement, inside step 3's loop, not as a sweep at the end.

**Step 5 — the next requirement, in parallel where they do not touch.**
Requirements that share no file and no mechanism can be refined at the same time. Two that
describe one mechanism are done in sequence, because the second's wording depends on where the
first drew its boundary.

**Step 6 — re-check integration and cross-cutting tests.**
Only once every requirement and every verify line is settled. Read `## Integration tests`:
each bullet must name a concrete command derived from this batch's requirements, with an outcome
that can fail when the batch as a whole is broken. Add, drop or rewrite integration bullets when
the refined requirements change what "the batch as a whole" means. Read `## Cross-cutting tests`:
every tier-3 test from the parent project's Cross-cutting verification table that crosses this
batch must appear as one line with a link to the project page — name only, never the full
procedure — or the section must say none cross.

**Step 7 — shard the tickets for compliance with the adjusted shape.**
Only once integration tests match the settled requirements. Hand the batch file and its
member list to Composer
(`node ~/slopdog/v2/scripts/dispatch.mjs "<job>" --engine ideas-composer --dir ~/slopdog/tasks --sender <your lane>`)
and have it report, per member ticket, which requirement it delivers, where its wording
contradicts the reshaped batch, and whether it is still needed. Composer reports; it never
rewrites a ticket. Check its report against the ticket files before believing it. Then ask Todd
which new tickets the reshaped batch needs and which existing ones it has made pointless.

**Tier-3 cross-batch tests.** A refined batch may touch a chain that crosses batches. Those
tests are written once on the project page; this batch's `## Cross-cutting tests` section names
them with a link only. New tier-3 tests are added on the project page first, then named from
each batch they cross.

## Don't

- Don't write to the file during step 1. The tips are agreed in the chat first.
- Don't refine a requirement's wording before the set of requirements is agreed (step 2), and
  don't sweep the verify lines at the end — each requirement's verify lines are fixed as that
  requirement is settled.
- Don't renumber an existing FR, and don't reuse a retired FR number.
- Don't write a note in the document explaining the numbering or recording what moved where. That
  is a changelog; the batch reads as the current truth and git holds the history.
- Don't let Composer edit a ticket. It reports; the ticket is rewritten through
  the ticket writer.
- Don't restate a tier-3 cross-batch test inside a batch — link to the project page.
- Don't touch the batch's member list; `bin/render-batches.mjs` owns it.

## Reply format

Per step: what changed, what Todd still has to decide, and the commit. Step 6 names each
integration bullet and each linked tier-3 test. Nothing else.
