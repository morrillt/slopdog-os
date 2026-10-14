# AGENTS.md

This repo is the Slopdog harness for Claude Code, published to read. Start with `README.md`.

- The rules every desk loads are in `rules/`; read `principles.md` and `output-style.md` first.
- Skills live in `plugins/slopdog/<group>/<name>/SKILL.md` and run as `/slopdog:<name>`.
- Paths written `~/slopdog/v2/...` inside the files mean this repo's root.
- Scripts are Node `.mjs` with a header comment; run `node --test` on a `*.test.mjs` beside one.
