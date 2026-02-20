---
name: Fix docs-router integration
overview: Fix the broken docs-router integration in Slopdog Vanilla by replacing the local stub package with the real package, properly configuring API routes, adding required CSS directives, copying test fixture docs from RockCap, writing comprehensive Playwright E2E tests, and updating documentation.
todos:
  - id: remove-stub
    content: Remove or rename local packages/docs-router/ stub
    status: completed
  - id: update-pkg-ref
    content: Update package.json to reference real docs-router package
    status: completed
  - id: fix-manifest-route
    content: Replace manifest route with createManifestHandler
    status: completed
  - id: fix-content-route
    content: Replace content route with createContentHandler
    status: completed
  - id: delete-lib-server
    content: Delete src/lib/docs/server.ts
    status: completed
  - id: add-tailwind-source
    content: Add @source directive to globals.css
    status: completed
  - id: create-taxonomy
    content: Create docs/taxonomy.yaml with facets and tags
    status: completed
  - id: copy-fixtures
    content: Copy 5-6 test fixture docs from RockCap (stylerules.md, how-the-docs-route-works.md, TICKET-001, etc.)
    status: completed
  - id: update-styleguide
    content: Add YAML front matter to styleguide.md
    status: completed
  - id: add-header-link
    content: Add Docs link to Header component
    status: completed
  - id: fix-docviewer-props
    content: Add missing renderLink prop to DocViewer
    status: completed
  - id: write-e2e-tests
    content: Create tests/e2e/docs.spec.ts with Playwright tests for explorer, viewer, and navigation
    status: completed
  - id: update-howto
    content: Update docs-router HOWTO with clearer instructions
    status: completed
  - id: verify-integration
    content: Run E2E tests to verify complete docs system works
    status: completed
isProject: false
---

# Fix docs-router Integration in Slopdog Vanilla

## Root Cause Analysis

The docs system is broken because Slopdog Vanilla has a **local stub package** at `packages/docs-router/` that shadows the real `@rockcap/docs-router` package. This stub:

- Has a different `Manifest` type (`{ documents }` vs `{ docs, taxonomy, count }`)
- Has minimal UI components without filtering, styling, or proper features
- Does not export server-side handlers

Additionally:

- The `lib/docs/server.ts` is a custom minimal implementation that doesn't parse YAML front matter
- No `@source` directive for Tailwind to pick up the package's styles
- No `taxonomy.yaml` for filtering options
- `styleguide.md` lacks proper YAML front matter
- Header is missing the docs navigation link
- DocViewer is missing required `renderLink` prop

---

## Implementation Plan

### 1. Remove Local Stub Package

Delete or rename `packages/docs-router/` to avoid shadowing:

```
/home/broz/code/playground/slopdog-vanilla/packages/docs-router/
```

### 2. Update Package Reference

In [`package.json`](package.json), change the docs-router dependency to point to the real package:

```json
"@rockcap/docs-router": "file:../packages/docs-router"
```

This points to `/home/broz/code/packages/docs-router` (one level up from playground).

### 3. Replace API Routes with Real Package Handlers

**[`src/app/api/docs/manifest/route.ts`](src/app/api/docs/manifest/route.ts):**

```typescript
import { createManifestHandler } from "@rockcap/docs-router/server";
import path from "path";

const config = {
  contentRoot: path.resolve(process.cwd(), ".."),
  directories: ["docs", "plans"],
  taxonomyPath: path.resolve(process.cwd(), "..", "docs", "taxonomy.yaml"),
};

export const GET = createManifestHandler(config);
```

**[`src/app/api/docs/content/route.ts`](src/app/api/docs/content/route.ts):**

```typescript
import { createContentHandler } from "@rockcap/docs-router/server";
import path from "path";

const config = {
  contentRoot: path.resolve(process.cwd(), ".."),
  directories: ["docs", "plans"],
};

export const GET = createContentHandler(config);
```

### 4. Delete Custom Server Implementation

Remove [`src/lib/docs/server.ts`](src/lib/docs/server.ts) as it's no longer needed.

### 5. Add Tailwind CSS @source Directive

In [`src/app/globals.css`](src/app/globals.css), add after the import:

```css
@import "tailwindcss";

/* Scan docs-router package for Tailwind classes */
@source "../../packages/docs-router/src/**/*.{ts,tsx}";
```

Note: Adjust path based on final package location.

### 6. Create taxonomy.yaml

Create `docs/taxonomy.yaml`:

```yaml
facets:
  type:
    - note
    - guide
    - reference
  status:
    - draft
    - active
    - deprecated

tags:
  doc:
    - howto
    - reference
    - guide
  tech:
    - frontend
    - backend
    - testing
```

### 7. Update styleguide.md with Front Matter

Update [`docs/styleguide.md`](docs/styleguide.md):

```yaml
---
title: "Style Guide"
updated: "2026-02-04"
facets:
  type: guide
  status: active
description: "Coding conventions and style guidelines for the project."
tags:
  - doc/guide
---
# Style Guide
...
```

### 8. Add Docs Link to Header

In [`src/components/Header.tsx`](src/components/Header.tsx), add a Docs button to the navigation:

```tsx
<Link href="/docs">
  <Button
    variant={activeRoute === 'docs' ? 'primary' : 'ghost'}
    size="sm"
    onClick={() => setActiveRoute('docs')}
    className="flex items-center gap-2"
  >
    <FileText className="w-4 h-4" />
    Docs
  </Button>
</Link>
```

Also update the `useEffect` to handle `/docs` pathname.

### 9. Fix DocViewer Usage

In [`src/app/docs/[...slug]/page.tsx`](src/app/docs/[...slug]/page.tsx), add the required `renderLink` prop:

```tsx
<DocViewer 
  doc={doc} 
  content={content} 
  onBack={() => router.push("/docs")}
  renderLink={(href, children) => <Link href={href}>{children}</Link>}
/>
```

### 10. Update docs-router HOWTO

Update [`/home/broz/code/packages/docs-router/HOWTO.md`](/home/broz/code/packages/docs-router/HOWTO.md) with:

- Clearer monorepo setup instructions
- Emphasis on using `/server` import for API handlers
- Working example of `taxonomy.yaml`
- Troubleshooting section for common issues (CSS not loading, wrong manifest structure)
- Note about not creating local stub packages that shadow the real one

---

## Verification

After implementation, verify:

1. `npm install` completes without errors
2. `/api/docs/manifest` returns `{ docs: [...], taxonomy: {...}, count: N }`
3. `/docs` page shows the DocsExplorer with filters and cards
4. Individual doc pages render with TOC and styling
5. Header shows Docs navigation link
6. CSS styling (dark theme, slate/emerald colors) is applied

---

## E2E Tests with Playwright

### Test Fixture Documents

Copy the following documents from RockCap to Slopdog Vanilla as test fixtures. These cover different doc types and features:

**From RockCap `docs/`:**

1. **`docs/stylerules.md`** - A "how-to" type guide with code blocks and structured content
2. **`docs/how-to/how-the-docs-route-works.md`** - A "note" type with many headings (tests TOC generation)
3. **`docs/taxonomy.yaml`** - The taxonomy file (adapt for Slopdog Vanilla's simpler needs)

**From RockCap `plans/`:**

4. **`plans/epics/EPIC-003-bulletproof-backtest/TICKET-001-unit-tests-fixtures.md`** - A "plan/ticket" type with status badges, epic metadata, and task checkboxes
5. **Create a simple `plans/tasks/TASK-sample.md`** - A lightweight task document

**Additional test doc to create:**

6. **`docs/test-doc-with-headings.md`** - A simple doc with H1/H2/H3 headings to verify TOC sidebar

### Simplified Taxonomy for Slopdog Vanilla

Create `docs/taxonomy.yaml`:

```yaml
facets:
  type: [plan, note, guide, changelog]
  status: [draft, active, deprecated, done]

tags:
  plan:
    - epic
    - ticket
    - task
  doc:
    - howto
    - reference
    - guide
  tech:
    - frontend
    - backend
    - testing
  meta:
    - index
    - template
```

### E2E Test File

Create `tests/e2e/docs.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Docs System', () => {
  test.describe('Explorer Page', () => {
    test('loads with filter controls', async ({ page }) => {
      await page.goto('/docs');
      
      // Verify filter panel exists
      await expect(page.getByPlaceholder('Search by title...')).toBeVisible();
      await expect(page.getByLabel('Type')).toBeVisible();
      await expect(page.getByLabel('Status')).toBeVisible();
    });

    test('displays document cards', async ({ page }) => {
      await page.goto('/docs');
      
      // Wait for manifest to load
      await page.waitForSelector('[class*="bg-slate-900"]');
      
      // Verify at least one doc card appears
      const cards = page.locator('[class*="rounded-lg"]').filter({ hasText: /Updated:/ });
      await expect(cards.first()).toBeVisible();
    });

    test('filters by type', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForSelector('[class*="bg-slate-900"]');
      
      // Select "plan" type
      await page.getByLabel('Type').selectOption('plan');
      
      // Verify only plan docs are shown (or "Plans" section header)
      await expect(page.getByText('Plans')).toBeVisible();
    });

    test('search filters documents', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForSelector('[class*="bg-slate-900"]');
      
      // Search for a known doc
      await page.getByPlaceholder('Search by title...').fill('Style');
      
      // Verify search results
      await expect(page.getByText('Style Guide')).toBeVisible();
    });
  });

  test.describe('Document Viewer', () => {
    test('renders document content', async ({ page }) => {
      await page.goto('/docs/styleguide');
      
      // Verify title and content render
      await expect(page.locator('h1')).toContainText('Style Guide');
      await expect(page.getByText('Back to Docs')).toBeVisible();
    });

    test('displays table of contents for docs with headings', async ({ page }) => {
      // Navigate to a doc with multiple headings
      await page.goto('/docs/how-to/how-the-docs-route-works');
      
      // Verify TOC sidebar appears
      await expect(page.getByText('Table of Contents')).toBeVisible();
    });

    test('back button navigates to explorer', async ({ page }) => {
      await page.goto('/docs/styleguide');
      
      // Click back button
      await page.getByText('Back to Docs').click();
      
      // Verify we're on the explorer page
      await expect(page).toHaveURL('/docs');
    });

    test('shows front matter section', async ({ page }) => {
      await page.goto('/docs/styleguide');
      
      // Verify front matter display
      await expect(page.getByText('Front Matter (YAML)')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('header has docs link', async ({ page }) => {
      await page.goto('/');
      
      // Verify docs link in header
      await expect(page.getByRole('link', { name: /docs/i })).toBeVisible();
    });

    test('can navigate from home to docs', async ({ page }) => {
      await page.goto('/');
      
      // Click docs link
      await page.getByRole('link', { name: /docs/i }).click();
      
      // Verify navigation
      await expect(page).toHaveURL('/docs');
    });

    test('clicking doc card navigates to viewer', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForSelector('[class*="bg-slate-900"]');
      
      // Click first doc card link
      await page.getByText('Style Guide').click();
      
      // Verify we're on the doc page
      await expect(page).toHaveURL(/\/docs\/.*styleguide/);
    });
  });

  test.describe('Ticket Documents', () => {
    test('displays ticket status badge', async ({ page }) => {
      // Navigate to a ticket doc
      await page.goto('/docs/epics/EPIC-003-bulletproof-backtest/TICKET-001-unit-tests-fixtures');
      
      // Verify ticket-specific UI elements
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Epic')).toBeVisible();
    });
  });
});
```

### Running E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run only docs tests
npx playwright test tests/e2e/docs.spec.ts

# Run in headed mode for debugging
npx playwright test tests/e2e/docs.spec.ts --headed
```