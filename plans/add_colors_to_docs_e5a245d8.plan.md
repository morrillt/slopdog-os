---
name: Add Colors to Docs
overview: Add vibrant Catppuccin Mocha colors to the docs system components - colorful status badges, type indicators, tag pills, and section headers to match the visual style of the /styles route.
todos:
  - id: status-badges
    content: Update status badge colors to be solid/vibrant like styles page badges
    status: pending
  - id: tag-colors
    content: Add category-based coloring for tag pills
    status: pending
  - id: type-headers
    content: Add colored accents to type section headers
    status: pending
  - id: rebuild
    content: Rebuild docs-router package and verify changes
    status: pending
isProject: false
---

# Add Catppuccin Colors to Docs System

## Current State
The docs system has visible card backgrounds but lacks the vibrant colors seen on the `/styles` route:
- Status badges are very faint (low opacity backgrounds)
- Tags are all the same gray color
- Type headers are plain white text
- No color differentiation between document types

## Target Colors (Catppuccin Mocha)
| Element | Color | Hex |
|---------|-------|-----|
| Blue (links, in-progress) | `--ctp-mocha-blue` | #89b4fa |
| Green (done, success) | `--ctp-mocha-green` | #a6e3a1 |
| Yellow (review, warning) | `--ctp-mocha-yellow` | #f9e2af |
| Peach (pending) | `--ctp-mocha-peach` | #fab387 |
| Mauve (ready, special) | `--ctp-mocha-mauve` | #cba6f7 |
| Red (blocked, danger) | `--ctp-mocha-red` | #f38ba8 |
| Teal (notes) | `--ctp-mocha-teal` | #94e2d5 |
| Pink (changelogs) | `--ctp-mocha-pink` | #f5c2e7 |

## Changes to Make

### 1. Status Badges - More Vibrant
In [`DocsExplorer.tsx`](packages/docs-router/src/react/DocsExplorer.tsx):
- **Done**: Solid green background with dark text
- **In Progress**: Solid blue background with dark text
- **Review**: Solid yellow background with dark text
- **Ready**: Solid mauve/purple background with dark text
- **Pending**: Solid peach/orange background with dark text

### 2. Tag Pills - Color by Category
- `plan/*` tags: Blue
- `tech/*` tags: Teal
- `audience/*` tags: Mauve
- `doc/*` tags: Pink
- `ops/*` tags: Peach
- `meta/*` tags: Yellow
- EPIC badges: Green

### 3. Type Section Headers - Colored
- **Plans**: Blue accent
- **Notes**: Teal accent
- **Changelogs**: Pink accent
- **Strategies**: Mauve accent

### 4. Card Hover States
- Add subtle colored left border on hover based on doc type

## Files to Modify
- [`packages/docs-router/src/react/DocsExplorer.tsx`](packages/docs-router/src/react/DocsExplorer.tsx) - Main changes
- Rebuild package after changes
