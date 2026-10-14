#!/usr/bin/env node
/**
 * Validate that a draft carries every ## heading from a template, in order.
 * Section lists live only in template.md (trifecta pattern).
 */
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @param {string} markdown
 * @returns {string[]}
 */
export function extractLevel2Headings(markdown) {
  const headings = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('## ')) headings.push(line.slice(3).trim());
  }
  return headings;
}

/**
 * @param {string} literal
 * @returns {string}
 */
function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} templateHeading
 * @returns {RegExp | null} pattern for draft headings, or null when exact match only
 */
export function templateHeadingPattern(templateHeading) {
  if (!templateHeading.includes('{{')) return null;
  let pattern = '';
  let i = 0;
  while (i < templateHeading.length) {
    const open = templateHeading.indexOf('{{', i);
    if (open === -1) {
      pattern += escapeRegExp(templateHeading.slice(i));
      break;
    }
    pattern += escapeRegExp(templateHeading.slice(i, open));
    const close = templateHeading.indexOf('}}', open + 2);
    if (close === -1) {
      pattern += escapeRegExp(templateHeading.slice(open));
      break;
    }
    pattern += '(.+)';
    i = close + 2;
  }
  return new RegExp(`^${pattern}$`);
}

/**
 * @param {string} foundHeading
 * @param {string} expectedHeading
 * @returns {boolean}
 */
export function headingMatchesTemplate(foundHeading, expectedHeading) {
  if (foundHeading === expectedHeading) return true;
  const pattern = templateHeadingPattern(expectedHeading);
  return pattern !== null && pattern.test(foundHeading);
}

/**
 * @param {string} documentMarkdown
 * @param {string[]} expectedHeadings
 * @returns {{ ok: true } | { ok: false, missing: string[], firstMissing: string }}
 */
export function checkTemplateHeadings(documentMarkdown, expectedHeadings) {
  const found = extractLevel2Headings(documentMarkdown);
  let expectIdx = 0;
  for (const heading of found) {
    if (
      expectIdx < expectedHeadings.length &&
      headingMatchesTemplate(heading, expectedHeadings[expectIdx])
    ) {
      expectIdx += 1;
    }
  }
  if (expectIdx >= expectedHeadings.length) return { ok: true };
  const missing = expectedHeadings.slice(expectIdx);
  return { ok: false, missing, firstMissing: missing[0] };
}

import { fileURLToPath } from 'node:url';

const isMain =
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  function usage() {
    console.error('usage: check-template-headings.mjs <template.md> <draft.md>');
    process.exit(2);
  }

  const templatePath = process.argv[2];
  const draftPath = process.argv[3];
  if (!templatePath || !draftPath) usage();

  const expected = extractLevel2Headings(readFileSync(templatePath, 'utf8'));
  const draft = readFileSync(draftPath, 'utf8');
  const result = checkTemplateHeadings(draft, expected);

  if (result.ok) {
    console.log(`template headings ok (${expected.length} sections)`);
    process.exit(0);
  }

  console.error(`missing template section (in order): ${result.firstMissing}`);
  for (const h of result.missing) console.error(`  - ${h}`);
  process.exit(1);
}
