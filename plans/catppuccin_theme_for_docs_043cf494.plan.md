---
name: Catppuccin Theme for Docs
overview: Updated the docs-router package components and slopdog-vanilla CSS to use Catppuccin Mocha colors instead of slate/emerald.
todos:
  - id: verify-theme
    content: Verify the theme changes by viewing /docs in the browser
    status: pending
isProject: false
---

# Catppuccin Theme for Docs

## Summary of Changes

Updated both the `@rockcap/docs-router` package and local Slopdog Vanilla CSS to use Catppuccin Mocha colors.

## Color Mapping Applied

| Element | Old (slate/emerald) | New (Catppuccin Mocha) |
|---------|---------------------|------------------------|
| Backgrounds | `slate-900`, `slate-800` | `#181825` (mantle), `#313244` (surface0) |
| Text | `slate-400`, `slate-300` | `#bac2de` (subtext1), `#cdd6f4` (text) |
| Borders | `slate-700` | `#45475a` (surface1) |
| Accents | `emerald-400/500` | `#89b4fa` (blue) |
| Status: done | `green-*` | `#a6e3a1` (green) |
| Status: in progress | `blue-*` | `#89b4fa` (blue) |
| Status: review | `yellow-*` | `#f9e2af` (yellow) |
| Status: ready | `purple-*` | `#cba6f7` (mauve) |
| Status: failed | `red-*` | `#f38ba8` (red) |

## Files Modified

### A. docs-router Package (affects all projects using it)

1. **[DocsExplorer.tsx](../../packages/docs-router/src/react/DocsExplorer.tsx)**
   - Filter panel backgrounds, borders, inputs
   - Document cards, status badges, tags
   - Search suggestions dropdown

2. **[DocViewer.tsx](../../packages/docs-router/src/react/DocViewer.tsx)**
   - Table of contents sidebar
   - Document header and metadata panel
   - Frontmatter editor UI
   - Ticket properties panel

3. **[MarkdownRenderer.tsx](../../packages/docs-router/src/react/MarkdownRenderer.tsx)**
   - Code blocks and inline code
   - Links, headings, lists
   - Blockquotes, tables, horizontal rules

### B. Slopdog Vanilla (local CSS overrides)

4. **[globals.css](src/app/globals.css)**
   - Added `prose` CSS variable overrides to ensure markdown content uses Catppuccin colors
   - Maps Tailwind prose variables to mocha CSS variables

## Result

The docs system now matches the rest of the Slopdog Vanilla application's Catppuccin Mocha theme, with consistent:
- Dark backgrounds (mantle/surface0)
- Blue accents for links and active states
- Mauve for blockquote borders
- Semantic status colors (green/yellow/blue/mauve/red)
