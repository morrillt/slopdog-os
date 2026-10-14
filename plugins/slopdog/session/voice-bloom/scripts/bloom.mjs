#!/usr/bin/env node
// voice-bloom step 1: a recording in, a preserved folder out.
// Copies the audio to ~/slopdog/v2/desks/ideas/voice-blooms/<YYYY-MM-DD>-<slug>/recording.<ext>,
// transcribes it with ElevenLabs Scribe v2 (house vocabulary as keyterms) into transcript.txt,
// and prints only paths and a word count. It never prints the transcript: the caller's context
// must not hold it (T-417). A recording already inside a voice-blooms/<folder>/ (the Slack
// listener saves there, T-428) is used in place: that folder is the output and nothing is copied.
//
// Usage: bloom.mjs <audio> [--slug <kebab-slug>] [--transcript <existing.txt>] [--date YYYY-MM-DD]
//   --slug is required unless <audio> already sits in a voice-blooms/<folder>/.
//   --transcript reuses a transcript already made by Scribe instead of paying for a second pass.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: { slug: { type: 'string' }, transcript: { type: 'string' }, date: { type: 'string' } },
});
const BLOOMS = join(process.env.HOME, 'slopdog/v2/desks/ideas/voice-blooms');
const usage = 'usage: bloom.mjs <audio> [--slug <kebab-slug>] [--transcript <txt>] [--date YYYY-MM-DD]';
const audio = positionals[0];
if (!audio) { console.error(usage); process.exit(2); }
if (!existsSync(audio)) { console.error(`no such file: ${audio}`); process.exit(2); }
// Already in a bloom folder (the Slack listener saves there): that folder wins, no copy, no slug needed.
const real = realpathSync(audio);
// No voice-blooms/ yet (a first run) means the audio cannot be inside it.
const inPlace = existsSync(BLOOMS) && dirname(dirname(real)) === realpathSync(BLOOMS);
if (!inPlace && !opt.slug) { console.error(usage); process.exit(2); }
if (opt.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(opt.slug)) { console.error(`slug must be kebab-case: ${opt.slug}`); process.exit(2); }

// The date is the recording's, when its name carries one (phone recorders write 2026_09_26_10_48_33.mp3).
const named = basename(audio).match(/^(\d{4})[_-](\d{2})[_-](\d{2})/);
const date = opt.date ?? (named ? `${named[1]}-${named[2]}-${named[3]}` : new Date().toLocaleDateString('sv-SE'));

// Todd's names and house jargon: every engine heard "Todd Morrill" as "Todd Morrow" without these.
// Keyterms are literal strings, so the ticket-id form can only be taught by example (T-417 below).
const VOCAB = ['Todd Morrill', 'Slopdog', 'slopdog', 'Slop Dog', 'Daphne', 'Tyrion', 'LaForge', 'Samwell Tarly',
  'Samwell', 'Scotty', 'Gemma', 'ideate', 'voice bloom', 'desk', 'ticket', 'T-417', 'PICKUP.md',
  'clear-to-close', 'Claude Code', 'Opus', 'Sonnet', 'Gemini', 'subagent',
  'tmux', 'cmux', 'Obsidian', '@slopdogai', 'Anthropic'];

const dir = inPlace ? dirname(real) : join(BLOOMS, `${date}-${opt.slug}`);
mkdirSync(dir, { recursive: true });
const recording = inPlace ? real : join(dir, 'recording' + (extname(audio) || '.mp3'));
const transcript = join(dir, 'transcript.txt');
if (!existsSync(recording)) copyFileSync(audio, recording);

// Scribe is told the real media type; a hard-coded audio/mpeg mislabels m4a and video shares.
const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'video/mp4', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg',
  wav: 'audio/wav', webm: 'audio/webm', aac: 'audio/aac', flac: 'audio/flac', '3gp': 'video/3gpp', mov: 'video/quicktime' };
const mime = MIME[extname(recording).slice(1).toLowerCase()] ?? 'audio/mpeg';

let text, source;
if (opt.transcript) {
  text = readFileSync(opt.transcript, 'utf8'); source = `reused ${opt.transcript}`;
} else if (existsSync(transcript)) {
  text = readFileSync(transcript, 'utf8'); source = 'already on disk';
} else {
  const envFile = join(process.env.HOME, '.config/elevenlabs/env');
  const key = existsSync(envFile) ? readFileSync(envFile, 'utf8').match(/^(?:export )?ELEVENLABS_API_KEY=["']?([^"'\n]+)/m)?.[1] : undefined;
  if (!key) { console.error(`no ELEVENLABS_API_KEY in ${envFile}`); process.exit(1); }
  const f = new FormData();
  f.append('model_id', 'scribe_v2'); f.append('language_code', 'en'); f.append('tag_audio_events', 'false');
  f.append('file', new Blob([readFileSync(recording)], { type: mime }), basename(recording));
  for (const k of VOCAB) f.append('keyterms', k);
  const t0 = Date.now();
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: f });
  const j = await r.json();
  if (!r.ok) { console.error(`scribe_v2 ${r.status}: ${JSON.stringify(j).slice(0, 300)}`); process.exit(1); }
  text = j.text; source = `scribe_v2 in ${((Date.now() - t0) / 1000).toFixed(0)}s`;
}
writeFileSync(transcript, text.trim() + '\n');

console.log(`folder: ${dir}`);
console.log(`recording: ${recording} (${(statSync(recording).size / 1e6).toFixed(1)} MB)`);
console.log(`transcript: ${transcript} (${text.split(/\s+/).filter(Boolean).length} words, ${source})`);
