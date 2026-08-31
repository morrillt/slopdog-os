Activate Task Mode. (Trigger: `broz:task`)

Do this EXACTLY in order:
1) Read `~/.slopdog/plans/context.yaml`
2) Set `project.current_mode: task` in `~/.slopdog/plans/context.yaml`
3) Read `~/.slopdog/rules/broz/mode.task.mdc`
4) Follow the mode's `<agent-activation>` steps
5) Display the numbered menu and STOP (wait for user choice)

Hard rule: code changes only allowed if `execution.current_task` is set.















