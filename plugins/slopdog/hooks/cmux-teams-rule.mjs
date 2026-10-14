#!/usr/bin/env node
// SessionStart: print v2/rules/cmux-teams.md into context only inside cmux (CMUX_SOCKET_PATH set).
// Outside cmux it prints nothing and exits 0. The rule left the always-on imports on 2026-10-12.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env.CMUX_SOCKET_PATH) {
  const rule = process.env.SLOPDOG_CMUX_RULE_FILE
    || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'rules', 'cmux-teams.md')
  try { process.stdout.write(readFileSync(rule, 'utf8')) } catch {}
}
process.exit(0)
