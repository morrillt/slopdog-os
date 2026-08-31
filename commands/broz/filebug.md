Activate Task Mode. (Trigger: `broz:task`)

Do this EXACTLY in order:
1) Read `~/.slopdog/rules/broz/workflows/task/file_bug.mdc`
2) Tell user X steps loaded and ready proceeding to step X - Name
3) Loop
    Follow the mode's steps!

CRITICAL (non-optional evidence):
- You MUST produce a visible screenshot artifact for key claims and embed it into the bug ticket.
- In particular, you MUST prove the ticket is discoverable in `/docs`:
  - Run the Playwright test that captures the screenshot (or equivalent MCP screenshot flow)
  - Screenshot must be saved under `tests/results/bug-fixes/` and embedded into the ticket under `### Test Evidence`.
- Do not proceed/close claims without the screenshot present in the ticket body. 
















