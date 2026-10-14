# Memory — what to keep, and where (Slopdog desks)

Applies in a Slopdog desk (`~/slopdog/v2/desks/<desk>/`). Full design:
`~/slopdog/v2/memory/README.md`. This is the rule you apply when a ticket finishes and the
Stop hook asks you to distil it, and any other time you learn something worth keeping.

**Two stores.** Shared is `~/slopdog/v2/memory/` (`MEMORY.md` is its index). Private is
your desk's `memory/` with your desk's `MEMORY.md` as index.

**When to write.** Two moments: when a ticket finishes (what did finishing it teach), and,
the one that's easy to miss, **the instant you're surprised**: you were wrong, a failure
was non-obvious, a constraint wasn't documented. Write that *then*, not after the ticket;
the detail fades. Capturing costs a cheap file; losing it costs a repeated mistake.

**Which one:**
- **Shared** — any other desk would need it: facts about Todd, partners, the machine,
  Slopdog's own plumbing, the Slack bot, a tool and its gotcha, roles, who owns what.
- **Private** — about doing *your* job: craft learned in your role, a thread you are
  carrying, feedback on your voice or output, your own working preferences.
- Unsure → shared. Never a secret, never a path to one beyond `~/.config/<app>/`.

**Shape:** one fact per file, kebab-case name, frontmatter `name`, `description` (one
line, used to decide relevance), `metadata.type` one of `user | feedback | project |
reference`. Feedback and project shards carry `**Why:**` and `**How to apply:**` lines.
Link related shards `[[like-this]]`. Update an existing shard rather than adding a
near-duplicate; delete one that turned out wrong; rewrite stale text, never annotate it.

**Then:** add the one-line pointer (`- [Title](file.md) — hook`) to the right `MEMORY.md`,
and commit the slopdog repo by path. Zero shards is a fine outcome; most tickets teach nothing new.

**Never** write into another desk's folder. If another desk needs to know, tell that desk.
