---
name: slop-grader
description: Put every generated clip, still and voice line in front of Todd as a gradeable table, then apply the grades he leaves. Two modes — publish rebuilds the inventory and republishes the page to its one pinned artifact URL, apply pulls his grades back down and moves the trash. Use when Todd says "slop grader", "/slopdog:slop-grader", "grade the clips", "let me grade the slop", "put the new clips in the grader", "refresh the grader", "rebuild the grader", "apply the grades", "what did I grade", "move the trash", or whenever a batch of new renders lands and he has not seen them yet.
disable-model-invocation: true
---

# slop-grader

The bench the influencer desk grades its output on. Todd looks at a table of every asset the
video workflow has made, marks each one keep / maybe / trash with a bucket, tags and a note, and
this skill carries those judgements back to disk.

**The one constant. Everything below is relative to it, and moving the bench to another desk is a
folder move plus this line:**

```
GRADER_DIR = ~/slopdog/v2/desks/publish/experiments/asset-grader
```

**The one URL. Never publish to a new one** — a grade is keyed by a hash of the asset's path and
lives in that artifact's database, so a fresh artifact starts with an empty board and every grade
Todd has already left is stranded:

```
<the grader artifact URL>
```

Read `GRADER_DIR/README.md` before changing how any of this works. It is the design; this file is
the procedure.

## Mode: publish

Todd wants to see the current state of the library, usually because new renders landed.

1. **Check nothing else is mid-run.** `pgrep -f inventory.mjs` must come back empty. Two inventory
   runs share `previews/` and will overwrite each other's encodes.
2. **Rebuild the inventory.** `cd GRADER_DIR && node inventory.mjs`. It walks the experiments tree
   for video, image and audio, encodes a small playable preview of every video, and writes
   `previews/`, `manifest.json` and `grader.html`. **It takes several minutes, most of it ffmpeg** —
   run it in the background and do something else rather than sitting on it. The tail of its output
   gives the row count and the finished page size.
3. **Check the size.** The page must come in under 15 MB. The script re-encodes one step tighter on
   its own if the page would pass 14.2 MB, so a number above that in the output means the guard
   failed and the page needs a tighter `QUALITY` before it will publish.
4. **Read the live artifact first.** Call the Artifact tool with `action: "read"` and the URL above.
   A publish to an artifact this conversation has not read is refused, and reading also shows whether
   someone republished it since.
5. **Publish to that same URL.** Artifact tool, `file_path` the freshly written `grader.html`,
   `url` set to the URL above. **Do not pass `capabilities`** — omitting the field carries the
   stored `db` declaration forward, and passing anything else can drop the database the grades live
   in. Do not pass `favicon` either; the artifact keeps the one it has.
6. **Verify by looking, not by trusting the tool result.** Read the artifact back and confirm the
   version number went up. Then open the URL in Chrome, wait for it to load (the page is several
   megabytes, so give it a good ten seconds), screenshot it, and confirm rows render and a grade
   Todd set before the rebuild is still on its row. Close the tab.
7. **Tell Todd it is ready**, with the row count, how many are new since he last looked, and the URL.

## Mode: apply

Todd has graded. Bring the judgements back to disk.

1. **Pull the grades.** Artifact tool, `action: "read_db"`, `db_op: "list"`, `collection: "grades"`,
   `out_dir` set to `GRADER_DIR/tmp/grades-<today>`, and `query` `{"limit": 500}`. Each grade is one
   JSON file: the asset's path, keep / maybe / trash, a bucket, tags and Todd's note.
2. **Dry run first, always.** `cd GRADER_DIR && node apply.mjs tmp/grades-<today>`. It prints every
   move it would make and changes nothing.
3. **Show Todd the dry run** — how many keep, how many trash, and the trash list by name. Wait for
   his say-so. This is the one place in the skill that stops for him.
4. **Write it.** `node apply.mjs tmp/grades-<today> --write` moves every trashed asset into
   `experiments/_trash/` and rewrites `experiments/ASSETS.md`, the reference organised by bucket with
   the tags and notes. `--purge` deletes instead of moving; only on an explicit instruction from
   Todd, never as the default.
5. **Re-run publish mode** so the page matches disk again, then commit the tree.

## When the assets have moved

Every asset lives in one atomic folder, `experiments/clips/<type>/<name>/`. An id is a hash of the
path, so **moving a file orphans its grade**. If a reorganise ran, carry the grades before
republishing, in this order:

1. `node reorganise.mjs --carry` rebuilds `tmp/grade-carry.json` from the "was" line every clip
   README carries. Use `--carry` rather than trusting the map a `--write` left: once the files are
   filed, the map a second `--write` writes is empty, and the READMEs are always right.
2. Pull the grades as in apply step 1, then `node carry-grades.mjs tmp/grades-<today>`. It writes
   one re-keyed document per grade with the path rewritten, plus `writes.json`.
3. Hand `writes.json` to the Artifact tool, `action: "write_db"`, `db_op: "batch"`, fifty entries per
   call. Grades whose asset is already in `_trash/` will not carry, and that is correct.

## Don't

- Don't publish to a new artifact URL, and don't pass `capabilities` on a republish.
- Don't run two `inventory.mjs` at once.
- Don't run `apply.mjs --write` before Todd has seen the dry run.
- Don't edit `grader.html` by hand. It is generated from `template.html` plus `manifest.json`;
  a filter or a column is a change to the template, then a rebuild.
- Don't commit `previews/`, `grader.html` or `manifest.json`. They are gitignored, regenerated by
  one command, and tens of megabytes.
