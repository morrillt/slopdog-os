## Rockcap Scaffolding Baseline (Tech + Folders + Workflow)

Use this as the **default scaffolding** for new projects when you want the same fundamentals as this repo.

### Workflow (preferred going forward)

- **Setup**
  - `npm install`
  - `cd src && npm install`
- **Environment variables**
  - Create a local `.env` (not committed) and a committed `.env.example` with placeholders (see below).
- **Run**
  - `cd src && npm run dev -- --hostname 0.0.0.0 --port 3000`
- **Deploy**
  - Deploy to **Vercel** (repo uses `vercel.json` so builds/install run in `src/`).
- **Test**
  - `npm run test` should run **unit + e2e**
  - E2E uses Playwright (`npx playwright test`) and should include at least a **smoke test** that:
    - Loads the home page
    - Fails on any `pageerror` or browser console `error` logs
  - As part of initial project setup, include **at least one E2E smoke test** that:
    - Loads the **deployed Vercel URL**
    - Asserts the **project name** text renders
    - Fails on any `pageerror` or browser console `error` logs

### Tech stack (as used here)

- **Runtime / package manager**: Node.js + npm (`package-lock.json`)
- **Web app**: Next.js **16.0.7** (App Router) in `src/`
- **UI**: React **19.2.1**
- **Language**: TypeScript **^5**
- **Styling**: Tailwind CSS **v4** via PostCSS (`src/postcss.config.mjs` uses `@tailwindcss/postcss`)
- **Theme: Catppuccin Tailwind theme (Mocha)**
  - Install: `npm i -D @catppuccin/tailwindcss`
  - Import (in the same file as `@import "tailwindcss";`): `@import "@catppuccin/tailwindcss/mocha.css";`
  - Ref: [catppuccin/tailwindcss](https://github.com/catppuccin/tailwindcss)
- **State**: Valtio (`src/stores/`)
- **Charts**: Recharts
- **Linting**: ESLint **^9** with `eslint-config-next` (`src/eslint.config.mjs`)
- **Testing**:
  - Playwright **^1.57** / `@playwright/test` **^1.57** (`tests/e2e/`, `playwright.config.ts`)
  - Vitest **^4** (`vitest.config.ts`)
- **Deploy**: Vercel (`vercel.json`)
- **Packages**: `packages/logger` built with `tsup` (CJS+ESM+DTS)

### Environment variables (`.env` + `.env.example`)

Keep secrets out of git. Commit `.env.example` with placeholders like this:

```dotenv
# --- OpenRouter ---
OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY"

# --- Vercel (CI/CD and/or API usage) ---
VERCEL_TOKEN="YOUR_VERCEL_TOKEN"
VERCEL_ORG_ID="YOUR_VERCEL_ORG_ID"
VERCEL_PROJECT_ID="YOUR_VERCEL_PROJECT_ID"

# --- Google AI Studio (Gemini) ---
GOOGLE_AI_STUDIO_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"

# --- OpenAI ---
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"

# --- Supabase ---
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# If used in the browser (Next.js client), prefer NEXT_PUBLIC_ equivalents:
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### Folder structure (as used here)

- **`src/`**: Next.js app (the UI + API routes)
  - **`src/app/`**: App Router routes + pages
  - **`src/app/api/`**: Next API routes
  - **`src/components/`**: UI components
  - **`src/hooks/`**: React hooks
  - **`src/lib/`**: shared business logic + utilities (keep pure/testable)
  - **`src/stores/`**: Valtio client state
  - **`src/public/`**: static assets, including:
    - **`src/public/data/`**: app-served JSON data artifacts
- **`scripts/`**: repo-root Node CLIs + analysis/pipeline utilities
  - **`scripts/__fixtures__/`**: fixtures used by scripts/tests (sample CSV/JSON inputs)
- **`tests/`**:
  - **`tests/e2e/`**: Playwright specs
  - **`tests/e2e/helper/`**: shared Playwright helpers (selectors, fixtures, utilities)
  - **`tests/unit/`**: unit tests
  - **`tests/unit/helper/`**: shared unit-test helpers (factories, matchers, utilities)
  - **`tests/fixtures/`**: test fixtures (large JSON/CSV inputs, golden files)
  - **`tests/seed/`**: seed data
  - **`tests/reports/`**: generated test reports/artifacts (optional; keep out of source)
- **`data/`**: pipeline inputs/outputs + generated artifacts (treat as non-source)
- **`docs/`**: documentation (markdown)
  - **`docs/research/`**: research notes
  - **`docs/howto/`**: how-to guides / runbooks
- **`plans/`**: planning system + workflow state (`~/.slopdog/plans/context.yaml`, tickets, tasks, templates)
- **`packages/`**: reusable internal packages (e.g. `packages/logger/`)
- **Generated / local-only (don’t treat as source)**:
  - `node_modules/`, `src/node_modules/`
  - `playwright-report/`, `test-results/`

### Commands (as used here)

- **App dev**: `cd src && npm run dev -- --hostname 0.0.0.0 --port 3000`
- **App build**: `npm run build` (runs `npm --prefix src run build`)
- **App lint**: `cd src && npm run lint`
- **All tests (preferred going forward)**: `npm run test` (runs **unit + e2e**)
  - Unit: `npm run test:unit`
  - E2E: `npx playwright test` (dev server auto-managed via `playwright.config.ts`)
- **Vercel deploy config**: see `vercel.json` (ensures builds run in `src/`)

### Playwright smoke test template (load page + no console errors)

Put something like this in `tests/e2e/smoke.e2e.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("smoke: home loads with no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(String(err));
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);

  // Allow any immediate hydration/network console errors to surface.
  await page.waitForTimeout(250);

  expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});
```

For a **production smoke test** against Vercel, add e.g. `E2E_PROD_BASE_URL` and:

```ts
import { test, expect } from "@playwright/test";

test("prod smoke: Vercel deploy loads with no console errors", async ({ page }) => {
  const baseURL = process.env.E2E_PROD_BASE_URL;
  expect(baseURL, "E2E_PROD_BASE_URL must be set (e.g. https://your-app.vercel.app)").toBeTruthy();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(String(baseURL));

  // Update this to your actual visible project/app name.
  await expect(page.getByText("YOUR_PROJECT_NAME")).toBeVisible();

  await page.waitForTimeout(250);
  expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});
```
