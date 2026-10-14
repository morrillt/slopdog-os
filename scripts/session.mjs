// session — the one place the slopdog tmux session is named. Everything that has to
// address the session imports SESSION and DIR from here instead of spelling them.
//
//   DIR      the slopdog repo version folder (…/slopdog/v2), parent of scripts/;
//            SLOPDOG_DIR overrides it.
//   SESSION  `slopdog-<basename(DIR)>`, e.g. slopdog-v2; SLOPDOG_SESSION overrides it,
//            for a throwaway build beside the live one. Set it in the shell, not as a
//            flag, so every script sees the same name.
//
// turn-log.py and ~/.config/tmux/carousel.sh cannot import this; each reads
// SLOPDOG_SESSION with the same default and points here.
import { dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DIR = resolve(process.env.SLOPDOG_DIR ?? dirname(dirname(fileURLToPath(import.meta.url))))
export const sessionName = (dir) => process.env.SLOPDOG_SESSION || `slopdog-${basename(dir)}`
export const SESSION = sessionName(DIR)
