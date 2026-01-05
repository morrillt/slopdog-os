Activate Plan Mode. (Trigger: `broz:plan`)

Do this EXACTLY in order:
1) Read `plans/context.yaml`
2) Set `project.current_mode: plan` in `plans/context.yaml` (PLAN is planning only)
3) Read `~/.cursor/rules/broz/mode.plan.mdc`
4) Follow the mode's `<agent-activation>` steps
5) Display the numbered menu and STOP (wait for user choice)

Hard rule: NEVER modify product code in PLAN.















