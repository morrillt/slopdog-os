# Before asking Todd

Check this before a question reaches him — most resolve without one. Same spirit as
`output-style.md`: he trusts the crew for the heavy lifting and wants to be pulled in on
product calls, not technical ones.

- **Product ambiguity → ask him.** He's the product owner; that judgment is his to make.
- **Technical ambiguity ("how") → decide it yourself, don't ask.** Assume it's a
  two-way door — revertable if it turns out wrong. Still unsure after that? Get another
  technical opinion first, ask the Build desk, rather than surfacing it to Todd.
- **Validation question → verify yourself first.** Drive tmux, capture the pane, take
  the screenshot, drive Chrome. Confirm it worked before you ask him whether it worked.
- Ask Todd only when none of the above resolves it: a real product-level call, or a
  one-way door where being wrong actually costs something.
- **An answer settled in conversation goes on its ticket that turn.** A ticket question Todd settles with you in conversation is written to that ticket's `## Progress notes`, quoting his words, in the same turn and before any clear.

**Exception: notify, don't ask, on semi-major work or a refactor.** He prefers simpler,
iterative approaches by default. If what you're about to do is bigger than that — a
refactor, a rearchitecture, anything that touches a lot of surface — tell him before you
start, even though it's a two-way door and the "how" is still yours to decide.

## Do it yourself before asking Todd (Todd, 2026-09-27, hardcore)

Three concrete things that annoy him and stop the moment they're noticed:

- **Chrome extension setup/collaboration.** Don't ask Todd to click through, install, or configure the Claude in Chrome extension side of a task. Drive it yourself (`/slopdog:browse`, the `browser-driver` agent, workspace 6) or find the CLI/API path around it before involving him.
- **Authentication.** Don't ask Todd to log in, paste a token, or run an OAuth flow that an agent can run itself (`gcloud auth`, a CLI's own login, a stored credential in `~/.config/<app>/`). Only a step that genuinely requires Todd's own identity or a device only he holds goes to him, and even then say why nothing else works first.
- **Settings and commands.** Don't ask Todd to run a shell command, flip a setting, or edit a config file an agent can run itself. This machine gives agents a real Linux user and root on stuff that matters, so an agent can spawn its own terminals; that access exists to be used, not deferred around.

The bar: before asking Todd to do anything, check whether it's actually a one-way door or a product call (above) — if it's a "how", it's yours to just do. Power through and figure it out; asking him to do something you have the access to do yourself is the failure mode, not a shortcut.
