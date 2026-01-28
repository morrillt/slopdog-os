---
name: Banananano Multi-Script Final
overview: Split generation into specialized Pro (batch) and Free (chained) scripts with shared utilities, organized config directory, intermediate image retention, and config-based output naming.
todos:
  - id: create-core-utils
    content: Create utils/core.js with shared config loader, API client, and image helpers
    status: completed
  - id: create-configs-dir
    content: Create configs/ directory with sample.json
    status: pending
  - id: create-refs-dir
    content: Create refs/ directory for reusable style reference images
    status: pending
  - id: impl-generate-pro
    content: Implement generate-pro.js with batch strategy
    status: completed
  - id: impl-generate-free
    content: Implement generate-free.js with chaining strategy and steps/ output
    status: completed
  - id: update-package-json
    content: Update package.json with banana:pro and banana:free scripts
    status: completed
  - id: update-readme
    content: Update README.md with new CLI documentation
    status: completed
---

# Plan: Banananano Multi-Script Architecture

Refactor the project to use specialized entry points for Pro and Free generation strategies while preserving the legacy CLI for simple use cases.

## Project Structure After Changes

```
banananano/
├── generate.js           # Legacy (unchanged, backwards compatible)
├── generate-pro.js       # Pro batching strategy
├── generate-free.js      # Free chaining strategy
├── utils/
│   └── core.js           # Shared config loader, API client, image helpers
├── configs/
│   └── sample.json       # Example configuration
├── refs/                 # Reusable reference/style images
│   └── (user's style reference images)
├── steps/                # Intermediate images from Free chaining (auto-created)
└── package.json          # Updated with new scripts
```

## JSON Configuration Schema

Located in `configs/`, image paths are relative to project root:

```json
{
  "config": {
    "aspectRatio": "16:9",
    "imageSize": "2K"
  },
  "system_prompt": "General aesthetic rules...",
  "styles": [
    { "prompt": "Cartoonish simplicity", "image": "refs/scooby.png" },
    { "prompt": "Neon color palette", "image": "refs/neon-palette.png" }
  ],
  "instance_prompt": "Thumbnail for a stock backtesting app"
}
```

## Reference Images Directory (`refs/`)

A dedicated folder for reusable style reference images:

- Drop in any `.png`, `.jpg`, `.webp` files you want to reference across configs
- Reference them in JSON configs as `refs/filename.png`
- Can be organized into subdirectories (e.g., `refs/colors/`, `refs/styles/`) as your library grows

## Script Behaviors

### `generate-pro.js --json configs/myconfig.json`

- **Model**: `gemini-3-pro-image-preview`
- **Logic**: Single API call with all content bundled:
  - `system_prompt` as first text part
  - Each style's prompt + image interleaved
  - `instance_prompt` as final text part
- **Output**: `myconfig-output.png` (derived from config filename)
- **Knobs**: Full `imageSize` support (1K, 2K, 4K)

### `generate-free.js --json configs/myconfig.json`

- **Model**: `gemini-2.5-flash-image`
- **Logic**: Sequential transformation chain:

  1. `system_prompt` + `styles[0].prompt` + `styles[0].image `-> `steps/myconfig-step-0.png`
  2. `styles[1].prompt `+ `steps/myconfig-step-0.png` -> `steps/myconfig-step-1.png`
  3. Continue for all styles...
  4. `instance_prompt` + last step image -> `myconfig-output.png`

- **Output**: Final in root, intermediates in `steps/`
- **Knobs**: `aspectRatio` only (1K fixed resolution)

### `generate.js` (Legacy - Unchanged)

- Continues to work with positional prompt file and `--image` flags
- Supports `-pro` flag for model selection

## Shared Utilities (`utils/core.js`)

- `loadConfig(jsonPath)`: Parse JSON, validate paths, return config object
- `initClient()`: Initialize GoogleGenAI with API key from `.env`
- `encodeImage(imagePath)`: Read image, return base64 + mimeType
- `saveImage(buffer, filename)`: Write output with consistent naming

## Implementation Steps

1. Create `utils/core.js` by extracting shared logic from `generate.js`
2. Create `configs/` directory with `sample.json`
3. Create `refs/` directory with `.gitkeep` (and optionally move existing `stylereference/` contents)
4. Implement `generate-pro.js` with batch logic
5. Implement `generate-free.js` with chaining logic (creates `steps/` on first run)
6. Update `package.json` scripts
7. Update `README.md` with new usage instructions