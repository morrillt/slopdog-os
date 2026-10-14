#!/usr/bin/env node
// link-open-check.mjs: before a Slack or email reply leaves, every Google Docs
// or Drive link in it is fetched logged out, the way an outside reader would see it. A link
// that answers with a sign-in page, an access wall or an error is refused, and
// the sender sends the content as a file in the shared folder instead (T-671).
//
// Scope, decided on T-671 q1 under Todd's delegation (2026-10-11): only Google
// Docs and Drive links are checked. Report pages (claude.ai Artifacts) publish
// private and nothing can open them up, so they go to outside readers as files, not links.
//
// Used by: the email sender and the Slack `reply` tool in
// ~/slopdog/dev/playground/slack-channel/slack-channel.mjs.
//
// CLI: node link-open-check.mjs <url-or-text>...   exit 0 all open, 1 refused.

import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOOGLE_HOSTS = new Set(['docs.google.com', 'drive.google.com', 'sheets.google.com', 'slides.google.com']);
// Slack mrkdwn wraps links as <url|label>, so stop at | and > as well as whitespace.
const URL_RE = /https?:\/\/[^\s<>|"'`)\]]+/g;

export function findGoogleLinks(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(URL_RE)) {
    const raw = m[0].replace(/[.,;:!?]+$/, '');
    let host;
    try { host = new URL(raw).hostname.toLowerCase(); } catch { continue; }
    if (GOOGLE_HOSTS.has(host) && !out.includes(raw)) out.push(raw);
  }
  return out;
}

// Fetch with no cookies and follow redirects. Open means the final answer is 2xx
// and did not land on Google's sign-in host. A private doc answers 401, a missing
// one 404, a private folder redirects to accounts.google.com (checked live
// against real links, 2026-10-11).
export async function checkLink(url, { fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
  let res;
  try {
    res = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'Mozilla/5.0 (slopdog link-open-check)' } });
  } catch (err) {
    return { url, open: false, reason: `could not reach it (${err?.name === 'TimeoutError' ? 'timed out' : err?.message || err})` };
  }
  let finalHost = '';
  try { finalHost = new URL(res.url || url).hostname.toLowerCase(); } catch {}
  if (finalHost === 'accounts.google.com') return { url, open: false, reason: 'it asks a logged-out reader to sign in' };
  if (res.status === 401 || res.status === 403) return { url, open: false, reason: `it is private (HTTP ${res.status}, sign-in or access request)` };
  if (res.status < 200 || res.status >= 300) return { url, open: false, reason: `it does not open (HTTP ${res.status})` };
  return { url, open: true, reason: `opens logged out (HTTP ${res.status})` };
}

export function refusalMessage(failures) {
  const lines = failures.map((f) => `- ${f.url}: ${f.reason}`);
  return [
    'Not sent: a Google link in this message does not open for someone outside Todd\'s account (T-671).',
    ...lines,
    'Send the content as a file instead (put it in the shared folder and name the path), or set the doc to anyone-with-the-link and send again.',
  ].join('\n');
}

// Checks every Google link in an outgoing message. { ok, checked, failures, message }.
export async function checkOutgoingText(text, opts = {}) {
  const links = findGoogleLinks(text);
  const checked = await Promise.all(links.map((u) => checkLink(u, opts)));
  const failures = checked.filter((c) => !c.open);
  return { ok: failures.length === 0, checked, failures, message: failures.length ? refusalMessage(failures) : '' };
}

// realpath both sides: ~/slopdog is a symlink to ~/slopdog, so a
// plain compare is false through one spelling and the CLI silently does nothing.
function isMain() {
  try { return !!process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.error('usage: node link-open-check.mjs <url-or-text>...');
    process.exit(2);
  }
  // LINK_CHECK_STUB_STATUS stubs the network with one HTTP status (tests only).
  const stub = process.env.LINK_CHECK_STUB_STATUS;
  const r = await checkOutgoingText(input, stub ? { fetchImpl: async (u) => ({ status: Number(stub), url: u }) } : {});
  for (const c of r.checked) console.log(`${c.open ? 'open' : 'NOT OPEN'}  ${c.url}  (${c.reason})`);
  if (!r.checked.length) console.log('no Google Docs or Drive links found');
  if (!r.ok) { console.error(r.message); process.exit(1); }
}
