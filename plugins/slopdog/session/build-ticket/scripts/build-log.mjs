#!/usr/bin/env node
// build-log — append one line under a ticket's ## Build log.
//   build-log.mjs <ticket-path|T-id> <Plan|Implementation|Debug|Decision|Assumption|Blocker> "<text>"
// Writes `- YYYY-MM-DD HH:MM: [Tag] text`, creating ## Build log in template position
// (before ## Hand-off) when the ticket has none. Commits nothing. Exit 1 on bad input.
import { readFileSync, writeFileSync } from 'node:fs'
import { TAGS, appendBuildLog, logLine, resolveTicket } from './ticket-lib.mjs'

const USAGE = `usage: build-log.mjs <ticket-path|T-id> <${TAGS.join('|')}> "<text>"`
const [ticketArg, tag, ...words] = process.argv.slice(2)
const text = words.join(' ').trim()
const fail = (msg) => { console.error(`build-log: ${msg}`); process.exit(1) }

if (!ticketArg || !tag || !text) fail(USAGE)
if (!TAGS.includes(tag)) fail(`unknown tag "${tag}"; one of ${TAGS.join(', ')}`)
const path = resolveTicket(ticketArg)
if (!path) fail(`no ticket found for "${ticketArg}"`)

const line = logLine(tag, text)
writeFileSync(path, appendBuildLog(readFileSync(path, 'utf8'), line))
console.log(`${path}: ${line}`)
