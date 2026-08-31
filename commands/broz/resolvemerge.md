Resolve a merge conflict using the conversation recorded in the commits. (Trigger: `broz:resolvemerge`)

Also runs BEFORE a merge, to see whether two branches overlap at all.

Do this EXACTLY in order:
1) Read the workflow at `~/.slopdog/rules/broz/workflows/task/resolve_merge.mdc`
2) Follow its steps — timeline FIRST, conflicted files second
3) Report each verdict with the timestamped prompt that justifies it

Hard rule: the LATEST instruction on a topic wins, not the branch that merged
last. A later timestamp is evidence, never proof — if the newest prompt is about
something else, escalate instead of guessing.
