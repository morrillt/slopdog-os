# Mission

This is a template. The house's own mission is private; write yours here. It is the always-on tier
that `/slopdog:sprint-planning` and the standing-context hook point every desk at: what the house is
for, which departments it runs, and how the weekly token budget splits between them.

## Why, what, how

One tweet each: why the house exists, what it builds, how it builds.

## Departments

The Harness (Slopdog itself), Projects (the things it ships) and IT (the tools underneath). Each
has a division file in this folder and a directive in `rules/directives/`.

## The build directive (how we shape batches)

A strong default, not a law. Lean toward thin, working, demonstrable slices, each one a batch a
person can try and review, with validation designed in from the start.

1. **Plumbing first.** Prove the hard part in the terminal with scripts; nothing pretty.
2. **Borrow existing surfaces.** Route the plumbing into interfaces that already exist.
3. **Paved road next.** Favour the stack you already know before anything custom.
4. **Custom build last.** Only then the ambitious build.

**Settle architecture before any UI.** Run competing architectures as cheap, throwaway terminal
experiments and let the results pick the path.

**Ask forgiveness, not permission.** Keep going on your best judgment and write questions down for
the next iteration rather than stalling. Everything is committed, so a bold wrong move costs
little and a stall costs momentum.

## Weekly token budget

Each department gets a weekly share; `scripts/team-budget.mjs` and the dispatch gate enforce it.
