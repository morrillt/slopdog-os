#!/usr/bin/env node
// gist-writer — fast gist pipeline: loads context, calls claude -p on Haiku, pops the
// lightbox. The desk calls this once instead of using its own context (T-448).
//
//   gist-writer.mjs "<question>" [--hours 6] [--session-id <id>]
import { execFileSync, spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

const SCRIPTS = import.meta.dirname;
const LOADER = join(SCRIPTS, "wtf-loader.mjs");
const LIGHTBOX = join(SCRIPTS, "wtf-lightbox.mjs");

const { values: opt, positionals } = parseArgs({
  options: {
    hours: { type: "string", default: "6" },
    "session-id": { type: "string", default: `gist-${Date.now()}` },
  },
  allowPositionals: true,
});

const question = positionals[0];
if (!question) { console.error("usage: gist-writer.mjs \"<question>\" [--hours N]"); process.exit(2); }

const context = execFileSync(process.execPath, [LOADER, "--hours", opt.hours], {
  encoding: "utf8", timeout: 10_000,
});

const prompt = `You are a gist writer. Answer the question in exactly three paragraphs, each tweet-length (about 280 characters max). Plain words, no headings, no bullets, no shorthand. The first paragraph is the answer; the second is what happens next or why; the third is the when, the caveat, or the one thing Todd can do. Bad news goes in the first sentence. Ticket ids may appear as T-nnn.

Reply with ONLY a JSON object, no markdown fences, no explanation:
{"head": "Gist · <three or four words naming the ask>", "paragraphs": ["<first>", "<second>", "<third>"]}

Here is the current board context:
${context}

Question: ${question}`;

const raw = execFileSync("claude", ["--model", "haiku", "-p", prompt], {
  encoding: "utf8",
  timeout: 30_000,
  env: { ...process.env, SLOPDOG_TURNLOG: "1" },
});

let answer;
const jsonMatch = raw.match(/\{[\s\S]*"paragraphs"[\s\S]*\}/);
if (jsonMatch) {
  answer = JSON.parse(jsonMatch[0]);
} else {
  answer = { head: "Gist", paragraphs: [raw.trim().slice(0, 280), "", ""] };
}

const outFile = `/tmp/gist-${opt["session-id"]}.json`;
writeFileSync(outFile, JSON.stringify(answer));

const lb = spawn(process.execPath, [LIGHTBOX, outFile], { stdio: "inherit" });
lb.on("exit", () => {
  console.log(JSON.stringify(answer));
});
