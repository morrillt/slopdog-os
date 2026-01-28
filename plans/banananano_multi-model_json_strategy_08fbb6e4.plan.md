---
name: Banananano Multi-Model JSON Strategy
overview: Implement a dual-strategy image generation CLI that handles Pro requests in a single batch and Free (Flash) requests via sequential transformation chaining, all driven by a structured JSON configuration.
todos:
  - id: define-dual-schema
    content: Define the dual-strategy JSON schema and create a sample file
    status: pending
  - id: impl-config-loader-multi
    content: Update generate.js to support the --json flag and load the config
    status: pending
  - id: impl-pro-batch
    content: "Implement Strategy A: Pro Batch Generation (single call)"
    status: pending
  - id: impl-flash-chaining
    content: "Implement Strategy B: Free Chaining (sequential recursive calls)"
    status: pending
  - id: impl-validation-safety
    content: Add validation and error handling for image paths and model-specific constraints
    status: pending
---

# Plan: Multi-Model JSON Strategy (Pro vs. Free Chaining)

This plan introduces a sophisticated generation pipeline in `generate.js` that adapts based on the model selected in the JSON configuration.

## 1. Structured JSON Configuration

A new `config.json` format will control the entire pipeline:

```json
{
  "model": "pro", 
  "config": {
    "aspectRatio": "16:9",
    "imageSize": "2K"
  },
  "system_prompt": "Always use a vibrant, high-contrast style...",
  "styles": [
    { "prompt": "Cartoonish style", "image": "refs/cartoon.png" },
    { "prompt": "Neon color palette", "image": "refs/colors.png" }
  ],
  "instance_prompt": "A banana wearing a space suit"
}
```

## 2. Execution Strategies

### Strategy A: Pro Mode (`gemini-3-pro-image-preview`)

- **Single Batch**: All prompts and images are bundled into one `contents` array.
- **Context**: The model receives the full context of system rules, all style references, and the final instance prompt in one go.
- **Result**: A single generation optimized by the model's internal reasoning.

### Strategy B: Free Mode (`gemini-2.5-flash-image`)

- **Transformation Chaining**: To overcome potential single-image limitations and provide a refined result, the generation will be split into multiple steps:

  1. **Seed**: Generate initial image using `system_prompt` + `style[0]`.
  2. **Refine**: For each subsequent style, use the previous output as a reference image along with the new style prompt.
  3. **Finalize**: Use the last style's output as a reference for the `instance_prompt`.

- **Intermediates**: Save intermediate images (e.g., `step-0.png`, `step-1.png`) for debugging.

## 3. Implementation Details in `generate.js`

- **JSON Flag**: Add `--json <path>` flag.
- **Config Loader**: Load and validate the JSON (check image paths, model compatibility).
- **Core Logic**:
  - Create a `generateStep` helper function that encapsulates the API call.
  - Implement the loop for Flash chaining.
  - Implement the single-shot array construction for Pro.
- **Output Handling**: Consistently save the final result and optionally the chain links.

## 4. Safety & Knobs

- Map `config` fields (aspectRatio, imageSize) to the `imageConfig` object.
- Default to `1:1` and `1K` if not specified.