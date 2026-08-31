Update Architecture Documentation. (Trigger: `broz:updatedocs`)

Do this EXACTLY in order:
1) Read `~/.slopdog/plans/context.yaml`
2) Set `project.current_mode: docs` in `~/.slopdog/plans/context.yaml`
3) Read `~/.slopdog/rules/broz/workflows/docs/update_architecture.mdc`
4) Run the workflow: "Workflow: Docs > Update Architecture"

This command updates the main architecture doc and changelog after changes are made.
