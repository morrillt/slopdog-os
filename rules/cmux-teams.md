# Parallel agents in cmux

You're in cmux when `CMUX_SOCKET_PATH` is set — check, don't assume. For any subtask,
team, or "run these in parallel":

1. **Named teammates, one `Agent` call each, all in one message.** The name earns a pane;
   an unnamed call runs in-process with nothing to watch.
2. **Rearrange after spawning, never before.** Teammates split down from Todd's pane;
   once up, `/slopdog:team-layout` stacks them in a left strip. Never pre-make a pane.
3. **Give him his prompt back.** Note his pane (`cmux identify` → `caller.pane_ref`)
   before spawning, `cmux focus-pane --pane <ref>` after.
4. One-shot lookups can stay in-process.

Panes exist only when the session launched as `cmux claude-teams`; plain `claude` falls
back to in-process silently. `CMUX_AGENT_LAUNCH_ARGV_B64` shows how it started. Don't pin
`teammateMode`. The cmux CLI isn't on `PATH` in Bash — use `$CMUX_CLAUDE_TEAMS_CMUX_BIN`
(`/Applications/cmux.app/Contents/Resources/bin/cmux`).
