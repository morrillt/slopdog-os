Activate Build Mode. (Trigger: `broz:build`)

Do this EXACTLY in order:
1) Read `plans/context.yaml`
2) Set `project.current_mode: build` in `plans/context.yaml`
3) Read the repo style guide: `/home/broz/code/rockcap/.cursor-user/commands/styleguide.md`
4) Read `.cursor/rules/broz/mode.build.mdc`
5) Follow the mode's `<agent-activation>` steps
6) Display the numbered menu and STOP (wait for user choice)

Hard rule: code changes only allowed if `execution.current_ticket` is set.















