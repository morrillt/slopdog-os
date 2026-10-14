#!/usr/bin/env python3
"""Maintain one markdown conversation log per session, newest turn on top.

Reads a Stop-hook payload on stdin, pulls the transcript lines written since the
last run, has a cheap model turn them into one tweet-sized line, and prepends it
to this session's turns.md. A concern the summariser flags goes to concerns.md.
The cmux sidebar card follows the session title.

Which files this writes is decided by the payload's `session_id`, passed to
session-dir.sh. The goal board this file used to keep was removed with T-467:
the desk panel is a derived ticket list now (scripts/goal.mjs) and nothing here
writes it.

Runs detached from the hook so the turn never waits on it.
"""
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

HOME = Path.home()
LOGS = HOME / "slopdog" / "logs" / "conversations"
CACHE = HOME / ".cache" / "slopdog-turnlog"
SKILL = HOME / ".claude" / "skills" / "slopdog" / "session" / "wtf" / "scripts"
SESSION_DIR = SKILL / "session-dir.sh"
CLAUDE = HOME / ".local" / "bin" / "claude"
RENAME_CARD = SKILL / "rename-card.sh"
MODEL = "haiku"
MAX_CHARS = 20000

def session_dir(session, title="", retitle=False):
    """This session's status directory, created with its three files if new.

    Resolved by the same script the skill uses, so both sides always agree on
    which directory belongs to this session. `retitle` renames a directory the
    SessionStart hook had to create before there was anything to name it after.
    """
    args = [str(SESSION_DIR)]
    if session:
        args += ["--session", session]
    if retitle:
        args += ["--retitle"]
    args += [title]
    out = subprocess.run(args, capture_output=True,
                         text=True, timeout=20)
    if out.returncode != 0 or not out.stdout.strip():
        raise RuntimeError("session-dir.sh failed: %s" % out.stderr.strip())
    return Path(out.stdout.strip())


FIRST_PROMPT = """You are keeping a conversation log for a developer. Below is the
opening stretch of a Claude Code session. Reply with EXACTLY two lines, nothing
else, no preamble, no markdown fences:

TITLE: <3-6 words naming what this session is actually about; name the thing, do not categorise it>
TWEET: <under 200 characters, past tense, what was actually DONE in this stretch; no "the user asked">
"""

TURN_PROMPT = """You are keeping a conversation log for a developer. Below is the
most recent turn of a Claude Code session.

Reply with EXACTLY two lines, nothing else, no preamble, no markdown fences:

TWEET: <under 200 characters, past tense, what was actually DONE this turn; concrete
nouns, name files and commands where it matters; no "the user asked", no filler>
CONCERN: <one or two sentences on something from this turn that could still bite, and
what it would cost if it does: a limitation the assistant flagged, a guess it had to
make, something it could not verify, a fragile workaround. Or the word NONE. A to-do,
a plan or a record of what was done is NONE. Most turns are NONE; never invent one.>
"""


def slugify(text, limit=48):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (s[:limit].rstrip("-")) or "session"


def transcript_text(path, start_line):
    """Human-readable prompts and replies from transcript lines after start_line."""
    out, line_no = [], start_line
    try:
        with open(path, "r", errors="replace") as fh:
            for line_no, raw in enumerate(fh, 1):
                if line_no <= start_line:
                    continue
                try:
                    rec = json.loads(raw)
                except Exception:
                    continue
                if rec.get("type") not in ("user", "assistant"):
                    continue
                content = (rec.get("message") or {}).get("content")
                if isinstance(content, str):
                    blocks = [{"type": "text", "text": content}]
                elif isinstance(content, list):
                    blocks = content
                else:
                    continue
                parts = []
                for b in blocks:
                    if not isinstance(b, dict):
                        continue
                    if b.get("type") == "text" and b.get("text"):
                        parts.append(b["text"])
                    elif b.get("type") == "tool_use":
                        parts.append("[ran %s]" % b.get("name", "tool"))
                if not parts:
                    continue
                who = "USER" if rec.get("type") == "user" else "ASSISTANT"
                out.append("%s: %s" % (who, "\n".join(parts)))
    except FileNotFoundError:
        return "", start_line
    text = "\n\n".join(out)
    if len(text) > MAX_CHARS:
        text = text[-MAX_CHARS:]
    return text, line_no


def ask(prompt, body):
    if not CLAUDE.exists():
        return ""
    env = dict(os.environ, SLOPDOG_TURNLOG="1")
    try:
        res = subprocess.run(
            [str(CLAUDE), "-p", "--model", MODEL, "--strict-mcp-config", "--tools", "", "--no-session-persistence"],
            input="%s\n\n---- transcript ----\n%s" % (prompt, body),
            capture_output=True, text=True, timeout=120, env=env,
        )
    except subprocess.TimeoutExpired:
        return ""
    return res.stdout.strip() if res.returncode == 0 else ""


def field(text, name):
    m = re.search(r"^%s:\s*(.+?)\s*$" % name, text, re.M)
    return m.group(1).strip() if m else ""


def draft_concern(sdir, ref, text):
    """Prepend the summariser's concern to concerns.md as an `open` entry.

    The desk no longer writes concerns by hand (T-285, Todd 2026-09-25: session-log work
    runs through Haiku if not a script); it only closes them with Todd. The shape
    is wtf/SKILL.md's `concerns.md` format. The same concern is not filed twice.
    """
    path = sdir / "concerns.md"
    body = path.read_text() if path.exists() else "# Concerns\n\n"
    norm = re.sub(r"\W+", " ", text).strip().lower()
    for m in re.finditer(r"^### .+\n\n(.+?)\s*$", body, re.M):
        if re.sub(r"\W+", " ", m.group(1)).strip().lower() == norm:
            return
    body = re.sub(r"\*None open\.\*\n?", "", body)
    entry = "### %s · %s · open\n\n%s\n\n" % (
        datetime.now().strftime("%Y-%m-%d %H:%M"), ref, text)
    head, sep, tail = body.partition("# Concerns\n\n")
    path.write_text((head + sep + entry + tail) if sep else ("# Concerns\n\n" + entry + body))


def rename_card(title):
    """Keep the cmux sidebar card named after the session title.

    Called on the first turn, when the session gets its title; the script
    itself no-ops unless the title changed, which leaves a hand-renamed card
    alone.
    """
    if title and RENAME_CARD.exists():
        subprocess.run([str(RENAME_CARD), title], capture_output=True, timeout=20)


# ---------------------------------------------------------------------- main

def main():
    payload = json.load(sys.stdin)
    log_turn(payload, payload.get("session_id") or "unknown")


def log_turn(payload, session):
    if os.environ.get("OPENROUTER_ENGINE") or os.environ.get("DISPATCH_ENGINE") == "openrouter" or "openrouter" in os.environ.get("ANTHROPIC_BASE_URL", ""):
        CACHE.mkdir(parents=True, exist_ok=True)
        (CACHE / "worker.log").open("a").write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} [turn-log] skipped under openrouter engine\n")
        return

    transcript = payload.get("transcript_path") or ""
    if not transcript:
        return

    CACHE.mkdir(parents=True, exist_ok=True)
    state_file = CACHE / ("%s.json" % session)
    state = {}
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text())
        except Exception:
            state = {}

    body, end_line = transcript_text(transcript, state.get("line", 0))
    if not body.strip():
        return
    # A turn begins with something Todd said. A slice with no prompt in it is a
    # partial flush; leave the offset alone so the next real turn swallows it.
    if "USER:" not in body:
        return

    now = datetime.now()
    first = not state.get("turn")
    turn = int(state.get("turn", 0)) + 1
    title = ""

    if first:
        # The SessionStart hook made the directory before there was anything to
        # name it after: ask for a title now and let --retitle rename it.
        reply = ask(FIRST_PROMPT, body)
        title = field(reply, "TITLE") or "Untitled session"
        tweet = field(reply, "TWEET") or "(no summary)"
    else:
        reply = ask(TURN_PROMPT, body)
        tweet = field(reply, "TWEET")
        if not tweet:
            return

    sdir = session_dir(session, title, retitle=first)
    turns = sdir / "turns.md"
    if not first:
        concern = re.sub(r"\s+", " ", field(reply, "CONCERN")).strip()
        if concern and not re.match(r"^none\b", concern, re.I) and len(concern) <= 400:
            draft_concern(sdir, "turn %d" % turn, concern)

    entry = "### %s · turn %d\n\n%s\n\n" % (now.strftime("%Y-%m-%d %H:%M"), turn, tweet)
    text = turns.read_text() if turns.exists() else "# Turns\n\n"
    text = re.sub(r"\*Nothing logged yet[^\n]*\n", "", text)
    head, sep, tail = text.partition("# Turns\n\n")
    turns.write_text((head + sep + entry + tail) if sep else (entry + text))

    state["turn"] = turn
    state["dir"] = str(sdir)
    state["line"] = end_line
    state_file.write_text(json.dumps(state))

    if first:
        rename_card(title)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # never let the log break a turn
        CACHE.mkdir(parents=True, exist_ok=True)
        (CACHE / "worker.err").open("a").write("%s %r\n" % (time.strftime("%F %T"), exc))
