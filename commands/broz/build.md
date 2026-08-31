Activate Build Mode. (Trigger: `broz:build`)

Do this EXACTLY in order:
1) Read `~/.slopdog/plans/context.yaml`, if it does not exist, notify user and exit.br
2) Set `project.current_mode: build` in `~/.slopdog/plans/context.yaml`
3) Read the repo style guide: `docs/styleguide.md`
4) Read `~/.slopdog/rules/broz/mode.build.mdc`
5) Follow the mode's `<agent-activation>` steps
6) Display the numbered menu and STOP (wait for user choice)

Hard rule: code changes only allowed if `execution.current_ticket` is set.















