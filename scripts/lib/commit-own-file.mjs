// commit-own-file — a script that writes a tracked file commits that file itself, by path (T-694).
// turn-commit only sweeps what a session's Edit/Write hooks recorded, so a Bash-run script's
// output would otherwise sit dirty. Non-fatal: any failure returns false and the file stays dirty.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const git = (cwd, ...a) => spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' });

export function commitOwnFile(file, script, what) {
  try {
    const abs = resolve(file);
    const dir = dirname(abs);
    if (!existsSync(abs)) return false;
    const top = git(dir, 'rev-parse', '--show-toplevel').stdout.trim();
    const home = git(HERE, 'rev-parse', '--show-toplevel').stdout.trim();
    if (!top || top !== home) return false;             // only this repo's own files, never a test's temp dir
    const rel = relative(top, abs);
    // The lane: the desk folder the script runs in, else the commit-msg hook's catch-all `todd`.
    const m = process.cwd().match(/\/v2\/desks\/([^/]+)/);
    const lane = process.env.SLOPDOG_LANE || (m && existsSync(resolve(top, 'v2/desks', m[1], 'CLAUDE.md')) ? m[1] : 'todd');
    if (git(top, 'add', '--', rel).status !== 0) return false;
    const msg = `${lane}: ${what} (${basename(abs)})\n\nAuto: ${script}\n`;
    return git(top, 'commit', '-q', '-m', msg, '--', rel).status === 0;
  } catch { return false; }
}
