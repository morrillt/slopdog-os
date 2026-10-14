#!/usr/bin/env python3
"""
merge_timeline.py — read the conversation blocks out of the commits on BOTH
sides of a merge and replay them as one wall-clock timeline.

WHY THIS EXISTS
---------------
Sessions overlap. Three get opened across one afternoon and closed in a
different order than they were started, so the branch that merges LAST may
carry the OLDEST instruction. Git's own ordering — commit date, merge order,
branch topology — cannot tell you which of two conflicting edits reflects the
more recent decision.

`harvest_prompts.py` puts the operator's timestamped prompts into each commit
body. This script reads them back out of both sides of a merge and interleaves
them by wall clock, so the resolution rule becomes readable rather than
guessed:

    the LATEST instruction on a given topic wins,
    regardless of which branch merged last.

WHAT IT DOES NOT DO
-------------------
It does not resolve anything. It produces evidence for a human decision. A
later timestamp is a strong signal, not a proof — a prompt can be later and
still be about a different topic, or explicitly scoped to one branch.

USAGE
-----
    # inside a conflicted merge (reads MERGE_HEAD automatically)
    python3 merge_timeline.py

    # ahead of time, to see whether two branches overlap
    python3 merge_timeline.py --ours main --theirs claude/some-branch

    # only the prompts near a conflicted file
    python3 merge_timeline.py --file model/build.py
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Matches the per-prompt marker written by harvest_prompts.py.
PROMPT_RE = re.compile(r"^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) UTC\] (\S+):\s*$")
BLOCK_RE = re.compile(r"^--- Conversation \(")
TRAILER_RE = re.compile(r"^(Conversation-Window|Prompt-Count|Session-Id):")

RESET, BOLD, DIM = "\033[0m", "\033[1m", "\033[2m"
OURS_C, THEIRS_C = "\033[36m", "\033[33m"     # cyan / yellow


def git(repo: Path, *args: str, check: bool = False) -> str:
    try:
        out = subprocess.run(["git", "-C", str(repo), *args],
                             capture_output=True, text=True, check=check)
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def commits_between(repo: Path, base: str, tip: str) -> list[dict]:
    """
    Every commit on `tip` that is not on `base`, newest last.

    Uses NUL separators because commit bodies contain every other character
    you might reach for as a delimiter.
    """
    raw = git(repo, "log", "--reverse", "--format=%H%x00%cI%x00%s%x00%B%x1e",
              f"{base}..{tip}")
    commits = []
    for record in raw.split("\x1e"):
        record = record.strip("\n")
        if not record.strip():
            continue
        parts = record.split("\x00")
        if len(parts) < 4:
            continue
        sha, cdate, subject, body = parts[0], parts[1], parts[2], parts[3]
        commits.append({"sha": sha.strip(), "date": cdate, "subject": subject,
                        "body": body})
    return commits


def files_of(repo: Path, sha: str) -> set[str]:
    out = git(repo, "show", "--name-only", "--format=", sha)
    return {ln.strip() for ln in out.splitlines() if ln.strip()}


def parse_prompts(body: str) -> list[dict]:
    """
    Pull `[<ts> UTC] <who>:` blocks out of a commit body.

    Everything indented under a marker, up to the next marker or the trailer
    block, is that prompt's text.
    """
    prompts: list[dict] = []
    current: dict | None = None
    for line in body.splitlines():
        m = PROMPT_RE.match(line.strip())
        if m:
            if current:
                prompts.append(current)
            ts = datetime.strptime(m.group(1), "%Y-%m-%d %H:%M").replace(
                tzinfo=timezone.utc)
            current = {"ts": ts, "who": m.group(2), "lines": []}
            continue
        if current is not None:
            if BLOCK_RE.match(line) or TRAILER_RE.match(line.strip()):
                prompts.append(current)
                current = None
                continue
            current["lines"].append(line[2:] if line.startswith("  ") else line)
    if current:
        prompts.append(current)

    for p in prompts:
        p["text"] = "\n".join(p.pop("lines")).strip()
    return [p for p in prompts if p["text"]]


def collect(repo: Path, base: str, tip: str, side: str,
            only_file: str | None) -> list[dict]:
    """Flatten one side into a list of prompt events tagged with their commit."""
    events = []
    for c in commits_between(repo, base, tip):
        touched = files_of(repo, c["sha"])
        if only_file and only_file not in touched:
            continue
        for p in parse_prompts(c["body"]):
            events.append({**p, "side": side, "sha": c["sha"][:9],
                           "subject": c["subject"], "files": touched})
        if not parse_prompts(c["body"]):
            # A commit with no conversation block still matters — flag it, so
            # nobody reads its absence as "nothing was said".
            events.append({
                "ts": datetime.fromisoformat(c["date"]).astimezone(timezone.utc),
                "who": "(no conversation recorded)", "text": "",
                "side": side, "sha": c["sha"][:9], "subject": c["subject"],
                "files": touched,
            })
    return events


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=".")
    ap.add_argument("--ours", default=None,
                    help="our side (default: HEAD)")
    ap.add_argument("--theirs", default=None,
                    help="their side (default: MERGE_HEAD if a merge is in progress)")
    ap.add_argument("--base", default=None,
                    help="common ancestor (default: git merge-base)")
    ap.add_argument("--file", default=None,
                    help="only commits touching this path")
    ap.add_argument("--no-color", action="store_true")
    args = ap.parse_args()

    repo_root = git(Path(args.repo), "rev-parse", "--show-toplevel")
    repo = Path(repo_root) if repo_root else Path(args.repo).resolve()

    ours = args.ours or "HEAD"
    theirs = args.theirs
    if not theirs:
        theirs = git(repo, "rev-parse", "--verify", "-q", "MERGE_HEAD")
    if not theirs:
        print("No MERGE_HEAD and no --theirs given. Pass --theirs <ref>.",
              file=sys.stderr)
        return 2

    base = args.base or git(repo, "merge-base", ours, theirs)
    if not base:
        print(f"No common ancestor between {ours} and {theirs}.", file=sys.stderr)
        return 2

    conflicted = [ln for ln in
                  git(repo, "diff", "--name-only", "--diff-filter=U").splitlines()
                  if ln.strip()]

    ev = (collect(repo, base, ours, "OURS", args.file)
          + collect(repo, base, theirs, "THEIRS", args.file))
    ev.sort(key=lambda e: e["ts"])

    c = (lambda s, _code: s) if args.no_color else (lambda s, code: f"{code}{s}{RESET}")

    ours_name = git(repo, "rev-parse", "--abbrev-ref", ours) or ours[:9]
    theirs_name = git(repo, "name-rev", "--name-only", theirs) or theirs[:9]

    print(c("═" * 78, DIM))
    print(c(f" Conversation timeline: {ours_name} (OURS) vs {theirs_name} (THEIRS)", BOLD))
    print(c(f" Common ancestor: {base[:9]}   ·   {len(ev)} events", DIM))
    if conflicted:
        print(c(f" Conflicted files: {', '.join(conflicted)}", DIM))
    if args.file:
        print(c(f" Filtered to commits touching: {args.file}", DIM))
    print(c("═" * 78, DIM))
    print()

    if not ev:
        print("No commits on either side of the ancestor. Nothing to compare.")
        return 0

    for e in ev:
        colour = OURS_C if e["side"] == "OURS" else THEIRS_C
        stamp = e["ts"].strftime("%Y-%m-%d %H:%M UTC")
        head = f"[{stamp}] {e['side']:<6} {e['sha']}  {e['subject']}"
        print(c(head, colour))
        if e["text"]:
            for ln in e["text"].splitlines():
                print("    " + ln)
        else:
            print(c("    (this commit carries no recorded conversation — "
                    "predates the change, or was made outside the workflow)", DIM))
        if args.file is None and conflicted:
            overlap = sorted(set(conflicted) & e["files"])
            if overlap:
                print(c(f"    ↳ touches conflicted: {', '.join(overlap)}", DIM))
        print()

    print(c("─" * 78, DIM))
    print(c(" How to read this", BOLD))
    print("""
 The LATEST instruction on a given topic wins — not the branch that merged
 last, and not the newest commit date. Sessions get opened and closed out of
 order, so commit order lies; the prompt timestamps do not.

 Before resolving, check each conflict against the timeline:
   1. Find the newest prompt on either side that is ABOUT this conflict.
   2. If it is on one side only, that side is the current intent.
   3. If both sides were instructed after each other, they are probably
      additive, not competing — keep both and say so in the merge message.
   4. If a later prompt REVERSES an earlier one ("actually, take that out"),
      the reversal wins even if its branch merged first.

 A later timestamp is strong evidence, never proof. If the newest prompt is
 about something else entirely, it does not settle this conflict — stop and
 ask rather than guessing.
""".rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
