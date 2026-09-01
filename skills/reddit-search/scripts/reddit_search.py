#!/usr/bin/env python3
"""Search Reddit through Gemini's Google Search grounding (no Reddit credentials).

Reddit 403s every unauthenticated fetch, but Google licenses Reddit content, so
Google's index carries the threads. This asks Gemini (API key, free tier) to answer
from Google Search and prints the grounded answer plus the real reddit.com URLs it
cited (Google returns opaque redirect links; we resolve them).

Usage:
  reddit_search.py "what do people think of Claude Code skills"
  reddit_search.py --raw "..."      # skip the site:reddit.com steering
  reddit_search.py --model gemini-2.5-pro "..."

Key: GEMINI_API_KEY in the environment or in ~/.config/gemini/env.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
ENV_FILE = os.path.expanduser("~/.config/gemini/env")


def load_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key and os.path.exists(ENV_FILE):
        for line in open(ENV_FILE):
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not key:
        sys.exit(f"GEMINI_API_KEY not set and not found in {ENV_FILE}")
    return key


def resolve(url: str) -> str:
    """Follow Google's grounding-api-redirect to the real page URL."""
    if "grounding-api-redirect" not in url:
        return url
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.geturl()
    except urllib.error.HTTPError as e:  # reddit answers HEAD with 403 but still redirects
        return e.geturl() if e.geturl() != url else e.headers.get("Location", url)
    except Exception:
        return url


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--model", default="gemini-2.5-flash")
    ap.add_argument("--raw", action="store_true", help="send the query verbatim")
    ap.add_argument("--json", action="store_true", help="dump the full API response")
    a = ap.parse_args()

    prompt = a.query if a.raw else (
        "Topic: " + a.query + "\n\n"
        "Find what Reddit users say about this. Run several searches, each including the word "
        "reddit plus a few plain keywords (no exact-phrase quotes, no dates in quotes), and only "
        "use results whose URL is on reddit.com. Then report: the main threads (subreddit + title), "
        "the prevailing opinions, notable disagreements, and specific recommendations, quoting "
        "short phrases where useful. Be concrete. If you truly found no reddit.com results, say so "
        "in one line and list the searches you ran."
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
    }
    req = urllib.request.Request(
        API.format(model=a.model),
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": load_key(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:600]}")

    if a.json:
        print(json.dumps(d, indent=2))
        return 0
    if "error" in d:
        sys.exit(f"API error: {d['error']}")

    cand = d["candidates"][0]
    print("".join(p.get("text", "") for p in cand["content"]["parts"]).strip())
    gm = cand.get("groundingMetadata", {})
    chunks = gm.get("groundingChunks", [])
    if chunks:
        print("\nSources:")
        seen = set()
        for c in chunks:
            w = c.get("web", {})
            u = resolve(w.get("uri", ""))
            if u in seen:
                continue
            seen.add(u)
            print(f"- {w.get('title', '')} — {u}")
    if gm.get("webSearchQueries"):
        print("\nSearches run: " + "; ".join(gm["webSearchQueries"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
