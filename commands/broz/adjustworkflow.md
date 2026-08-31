Change how Broz OS itself behaves — a command, mode, workflow or skill. (Trigger: `broz:adjustworkflow`)

Use this when the request is about **the system**, not about a project:
"change what committomain does", "add a step to endofday", "make a new
workflow for X", "that report format is wrong". Editing product code is a
different job — this is meta-work on `~/.slopdog/`.

Do this EXACTLY in order:

1) Read the workflow at `~/.slopdog/rules/broz/workflows/task/adjust_workflow.mdc`
2) Follow its steps — it loads the right context before touching anything
3) Report what changed, and how to verify it

Hard rule: Broz OS files live in `~/.slopdog/`, NOT in the project. Never edit a
project's files to satisfy a Broz OS request, and never edit Broz OS to satisfy
a project request.
