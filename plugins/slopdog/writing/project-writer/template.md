---
type: slopdog
project: {{project-slug}}
desk: {{desk}}
status: {{active | idle | parked}}
status_note: {{one line on where the project stands, with the date}}
owner: Todd
updated: {{YYYY-MM-DD}}
notion_id: ""
notion_url: ""
---

<!--
Status is one word: active (Todd is working it now, drawn bright on the Universe tree), idle (shaped but not being worked), parked (deliberately paused) or merged (a stub with a merged_into: line). Only Todd turns a project active. Where the project stands goes on the status_note line; tasks/bin/check-project-status.mjs refuses any other status word.
Department type (T-652), exactly one of the three departments in rules/vocabulary.md:
slopdog  = improving Slopdog itself, the whole pipeline from ideation to execution to verification.
projects = building the things we ship, including communicating about them. An influencer
           project is type: projects plus a project_type: influencer line under type:.
it       = tooling at the OS level, tooling problems, bugs in our actual tools, not really Slopdog.
Batches and tickets inherit this from their project unless they say otherwise. A missing, retired or unknown value warns, never fails.
-->

# {{Project title}}

> **Status:** `{{active | idle | parked}}` | **Desk:** `{{desk}}` | **Priority:** `{{priority}}` | **Owner:** `Todd` | **Ready for shards:** `{{ready_for_ticket_shards}}`

## Why

{{Up to three bullets: problem, cost, or house rule this project answers.}}

## What

{{Up to three bullets: deliverables and scope at programme level.}}

## How

{{Up to three bullets: where work lands, batch strategy, sequencing.}}

## Decisions made rather than asking

{{Numbered decisions already taken, each with reversibility note.}}

## Key things

{{Each key thing: one essential aspect, which batch owns it, decision and concern lines.}}

## Features

{{One line per feature, in exactly this shape: - **Plain name** (`slug`): one sentence on what it covers, ending with the batches that deliver it. A line that folds an old registry row ends with (replaces: old-slug). Notes go in indented sub-bullets. About five features, never more than eight, named before any batch is written; every batch's `feature:` is one of these slugs. This section is the registry: the batch checker and the Universe read it, so nothing is added to Slopdog Features.md. check-project-features.mjs fails any other shape.}}

## Batches

{{How batches are filed under tasks/batches/<slug>/; no invented ticket ids.}}

## Systems being retired

{{Skills, templates, or habits this project replaces.}}

## Backlog

{{Deliberately out-of-scope items with why they wait; cap is fifteen tickets per project.}}

## Cross-cutting verification

{{Tier-3 integration tests table: name, batches crossed, owner batch.}}

## How this project ends

{{Named verifications that close the project.}}

## Reports

{{Optional links to filed reports.}}

## Questions on the board

{{Open questions with Obsidian reply callouts.}}

## Sprint order, locked by Todd on {{YYYY-MM-DD}}

{{Ordered batch list when sprint order is fixed.}}

## Tickets

{{Leave empty; render-batches.mjs owns member lists.}}
