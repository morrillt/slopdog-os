// The unstucker's one on/off switch (Todd, 2026-10-12). A file holding `on` or `off`; a missing
// or unreadable file means on. unstucker.mjs reads it before anything else, buildwatch shows it
// on the Main page and its `u` key flips it. Override the path with UNSTUCKER_SWITCH (tests).
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SWITCH_FILE = process.env.UNSTUCKER_SWITCH
  || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'desks', 'watcher', '.unstucker-mode')

export function unstuckerOn(file = SWITCH_FILE) {
  try { return readFileSync(file, 'utf8').trim() !== 'off' } catch { return true }
}

export function setUnstucker(on, file = SWITCH_FILE) {
  writeFileSync(file, on ? 'on\n' : 'off\n')
  return on
}

export const toggleUnstucker = (file = SWITCH_FILE) => setUnstucker(!unstuckerOn(file), file)
