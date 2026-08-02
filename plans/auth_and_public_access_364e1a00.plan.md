---
name: Auth and Public Access
overview: Simplify authentication to a single admin password, remove the Analysis tab entirely, and add a "Public Access" display toggle that hides NDA-sensitive data (private photos, real business names) while keeping full admin controls.
todos:
  - id: remove-analysis-tab
    content: "Remove Analysis tab: delete tab button, password gate, rendering functions, CSS, and related state from viewer/index.html"
    status: completed
  - id: remove-analysis-server
    content: Remove analysis endpoint from viewer/server.mjs and analysis build logic from build.mjs
    status: completed
  - id: simplify-auth
    content: "Single password auth: remove GUEST_PW, isGuest(), guest toast, Request Access view; make isAuthenticated() = isAdmin()"
    status: completed
  - id: public-access-toggle
    content: Add Public Access toggle button in header with localStorage persistence and re-render on toggle
    status: completed
  - id: public-access-titles
    content: Update displayTitle() and drawer to hide title_override and BizBuySell Title section in Public Access mode
    status: completed
  - id: public-access-photos
    content: Filter photos to listing_photo_count in Public Access mode; update card thumbnails and drawer gallery
    status: completed
  - id: scraper-photo-tag
    content: Add listing_photo_count to scraper output in scripts/scrape.mjs
    status: completed
  - id: backfill-photo-count
    content: Backfill listing_photo_count on all existing deal YAML files
    status: completed
isProject: false
---

# Auth Simplification and Public Access Toggle

## Current State

- Two passwords: `ADMIN_PW = "pizzapizza"` (admin), `GUEST_PW = "pizzaftw"` (guest)
- Separate Analysis tab with its own password gate (`"pizzaftw"`)
- Guest users get read-only view after logging in with guest password
- `displayTitle()` already branches on admin vs guest for title overrides
- All photos shown regardless of source (all currently from BizBuySell scraping)

Key file: [viewer/index.html](viewer/index.html) (lines 2134-2138 for tabs, 2434-2522 for auth, 3329-3346 for photos, 4011-4070 for analysis gate)

---

## Changes

### 1. Remove Analysis Tab

**HTML** (line ~2136): Delete the analysis tab button from `.drawer-tabs`.

**JS**: Remove or gut these functions:
- `showAnalysisPasswordGate()` (lines 4011-4025)
- `handleAnalysisPassword()` (lines 4027-4038)
- `loadAndRenderAnalysis()` (lines 4046-4070)
- `renderAnalysisHTML()` (lines 4072-4315)
- `initAnalysisCharts()` (lines 4324-4422)
- `_analysisUnlocked` / `_analysisCache` state variables (line 3286-3288)

**CSS**: Remove `.a-password-gate`, `.a-pw-error`, and the `.a-*` analysis styles (lines ~979-997, ~999+).

**`switchDrawerTab()`** (lines 3486-3507): Remove the `analysis` case.

**`openDrawer()`** (line ~3324): Remove the line that toggles analysis tab visibility based on `deal.has_analysis`.

**build.mjs** (line ~46): Remove `deal.has_analysis` assignment. Remove the analysis file copy block (lines ~71-76).

**viewer/server.mjs** (lines ~104-113): Remove the `/api/deals/:id/analysis` endpoint.

### 2. Single Password Auth

**Remove guest password and login path** in [viewer/index.html](viewer/index.html):

```javascript
// Before (line ~2436-2437)
const ADMIN_PW = "pizzapizza";
const GUEST_PW = "pizzaftw";

// After
const ADMIN_PW = "pizzapizza";
```

- Remove `isGuest()` function
- Change `isAuthenticated()` to just check `isAdmin()`
- In the login handler (line ~2497-2522): remove the `else if (pw === GUEST_PW)` branch; invalid password = error
- Remove guest toast HTML and `showGuestToast()` function
- Remove "Request Access" view from login modal (lines ~2174-2182) since there's no guest access to request

### 3. Public Access Toggle

Add a **toggle button** in the header/toolbar area (near the existing role badge). Stores state in `localStorage` as `pizzagate_public_access`.

```javascript
const PUBLIC_KEY = "pizzagate_public_access";
function isPublicAccess() { return localStorage.getItem(PUBLIC_KEY) === "true"; }
function togglePublicAccess() {
  localStorage.setItem(PUBLIC_KEY, isPublicAccess() ? "false" : "true");
  updatePublicBadge();
  renderBoard(); // re-render to apply display filtering
}
```

UI: A toggle/pill next to the role badge, labeled "Public Access" with on/off visual state. When active, a subtle indicator (e.g. colored badge or border) reminds the admin they're in public mode.

### 4. Public Access Display Filtering

#### Titles

Update `displayTitle()` (line 2445-2448):

```javascript
function displayTitle(deal) {
  if (isPublicAccess()) return deal.title || "Untitled";
  return deal.title_override || deal.title || "Untitled";
}
```

This reverts to the original BizBuySell title when Public Access is on, hiding any real business name overrides. Also hide the "BizBuySell Title" section in the drawer (lines 3418-3423) when in Public Access mode.

#### Photos

**Tagging approach**: Add a `listing_photo_count` field to deal YAML files during scraping. This records how many photos came from the original BizBuySell listing. In Public Access mode, only show the first N photos (where N = `listing_photo_count`). Photos added later (from CIMs, site visits, etc.) are appended after the listing photos and are NDA-sensitive.

**Scraper change** in [scripts/scrape.mjs](scripts/scrape.mjs): When writing a new deal or updating `photos_local`, set `listing_photo_count` to the number of photos scraped from BizBuySell.

**Backfill**: Run a one-time script to set `listing_photo_count` on all existing deals equal to their current `photos_local.length` (since all current photos are from BizBuySell).

**Viewer filtering** (line ~3329 and card thumbnails at ~3155):

```javascript
let photos = (deal.photos_local || deal.photos || []).map(p => ...);
if (isPublicAccess() && deal.listing_photo_count != null) {
  photos = photos.slice(0, deal.listing_photo_count);
}
```

### 5. Build Patching

In [build.mjs](build.mjs): Remove the analysis-related patching (the `fetch` rewrite for `/api/deals/:id/analysis` and the analysis file copy). No auth changes needed in the build since auth is client-side only.

---

## Files Modified

| File | Changes |
|------|---------|
| `viewer/index.html` | Remove analysis tab + gate, simplify auth to single password, add Public Access toggle, filter titles/photos |
| `viewer/server.mjs` | Remove `/api/deals/:id/analysis` endpoint |
| `build.mjs` | Remove `has_analysis`, analysis file copy, analysis fetch rewrite |
| `scripts/scrape.mjs` | Set `listing_photo_count` on deal YAML during photo download |
| `deals/*.yaml` | Backfill `listing_photo_count` field on all existing deals |
