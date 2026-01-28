---
name: Banananano Multi-Script Strategy
overview: "Split the generation logic into two specialized scripts: one for Pro (batch) and one for Free (chained), sharing a common core utility for API interaction and configuration loading."
todos:
  - id: refactor-core-utils
    content: Extract shared logic into utils/core.js
    status: pending
  - id: impl-pro-script
    content: Implement generate-pro.js (Batch Strategy)
    status: pending
  - id: impl-free-script
    content: Implement generate-free.js (Chaining Strategy)
    status: pending
  - id: update-package-scripts
    content: Update package.json with specialized run commands
    status: pending
  - id: create-multi-test-config
    content: Create sample_config.json for validation
    status: pending
---

# Plan: Multi-Script Strategy (Pro vs. Free)

Refactor the project to use separate entry points for different generation strategies, ensuring specialized logic for the Pro and Free models while maintaining a shared core.

## 1. Directory Structure Changes

- `generate-pro.js`: Specialized script for `gemini-3-pro-image-preview` using batching.
- `generate-free.js`: Specialized script for `gemini-2.5-flash-image` using transformation chaining.
- `utils/core.js`: Shared logic for configuration loading, image processing, and API initialization.

## 2. Common JSON Configuration

Both scripts will use the same configuration format, but may interpret fields differently:

```json
{
  "config": {
    "aspectRatio": "16:9",
    "imageSize": "2K"
  },
  "system_prompt": "General rules...",
  "styles": [
    { "prompt": "Cartoon style", "image": "refs/cartoon.png" },
    { "prompt": "Neon colors", "image": "refs/colors.png" }
  ],
  "instance_prompt": "A banana in space"
}
```

## 3. Script Specialization

### `generate-pro.js`

- **Logic**: Bundles `system_prompt`, all `styles` (prompts + images), and `instance_prompt` into a single `generateContent` call.
- **Model**: Hardcoded to `gemini-3-pro-image-preview`.
- **Knobs**: Supports all `imageSize` options (1K, 2K, 4K).

### `generate-free.js`

- **Logic**: Performs sequential generation steps.
  - Step 1: `system_prompt` + `styles[0] `-> `tmp1.png`.
  - Step 2..N: `styles[i] `+ `tmpN-1.png` -> `tmpN.png`.
  - Step Final: `instance_prompt` + `tmpN.png` -> `output.png`.
- **Model**: Hardcoded to `gemini-2.5-flash-image`.
- **Knobs**: Limits `imageSize` to 1K.

## 4. Implementation Steps

1. Create `utils/core.js` to extract shared logic from the current `generate.js`.
2. Implement `generate-pro.js` with the batching logic.
3. Implement `generate-free.js` with the recursive chaining logic.
4. Update `package.json` with convenience scripts: `"banana:pro": "node generate-pro.js --json", "banana:free": "node generate-free.js --json"`.
5. Create a `sample-config.json` for testing both paths.