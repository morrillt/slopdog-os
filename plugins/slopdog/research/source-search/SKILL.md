---
name: source-search
description: Look something up on one named outside site and hand back the answer — Reddit (what people think of X, via Gemini's Google Search grounding, no Reddit login) or GitHub (the official repo for a library or tool already named). Use when Todd says "/slopdog:source-search reddit <topic>", "what does Reddit think about X", "find the GitHub repo for X", or names a site to look something up on. YouTube is a separate skill, /slopdog:youtube-search, that only runs when asked. General search tactics are /slopdog:web-search; a full buying trip is /slopdog:shopping-research.
---

# source-search — one lookup on the site you name

Usage: `/slopdog:source-search <site> <what to look up>`, where `<site>` is `reddit` or
`github`. For YouTube, use `/slopdog:youtube-search` instead — it stays out of this skill
so it never runs as a side effect of a Reddit or GitHub lookup.

1. **Pick the site.** Take it from the first argument, or from Todd's words ("Reddit",
   "the repo"). No site named and none implied: ask once, as a menu of the two.
2. **Read that site's reference, and only that one**, then follow it:

   | Site | Reference | What it hands back |
   |---|---|---|
   | reddit | `${CLAUDE_SKILL_DIR}/references/reddit.md` | A synthesized answer with subreddits, quoted opinions and resolved thread URLs |
   | github | `${CLAUDE_SKILL_DIR}/references/github.md` | The official repo, checked, with what it does, how to install it and whether it is maintained |

3. **Answer, then stop.** Give the lookup's result with its sources. No follow-up
   research Todd didn't ask for.

The scripts for every site live in `${CLAUDE_SKILL_DIR}/scripts/`.
