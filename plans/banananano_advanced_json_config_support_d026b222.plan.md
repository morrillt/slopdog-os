---
name: Banananano Advanced JSON Config Support
overview: Expand JSON configuration support to include model selection (Pro/Flash), aspect ratio, and image size (1K/2K/4K), as well as multi-part prompt construction with system, style, and instance components.
todos:
  - id: create-sample-json
    content: Create sample_config.json with model, config, and prompt sections
    status: pending
  - id: load-json-config
    content: Update generate.js to parse --json flag and load configuration
    status: pending
  - id: validate-config
    content: Implement validation logic for model/size constraints and file existence
    status: pending
  - id: update-generation-logic
    content: Update generation logic to use interleaved prompts and dynamic imageConfig
    status: pending
---

# Plan: Advanced JSON Configuration Support

Upgrade `generate.js` to support a robust JSON configuration format that controls both the content (prompts/images) and the generation parameters (knobs).

## Proposed JSON Structure

```json
{
  "model": "pro",
  "config": {
    "aspectRatio": "16:9",
    "imageSize": "2K"
  },
  "system_prompt": "General rules and style preferences...",
  "styles": [
    {
      "prompt": "Simple cartoonish aspect.",
      "image": "path/to/scooby.png"
    },
    {
      "prompt": "Pull colors from here.",
      "image": "path/to/colors.png"
    }
  ],
  "instance_prompt": "Thumbnail for a stock backtesting app"
}
```

## Available Knobs (from Gemini Docs)

- **Model**: `gemini-2.5-flash-image` (default) vs `gemini-3-pro-image-preview` ("pro").
- **Aspect Ratio**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9.
- **Image Size**: 1K, 2K, 4K (Note: 4K is only available for the Pro model).

## Changes

### 1. Update `generate.js` Argument Parsing

- Support `--json <path>` as a primary flag.
- When `--json` is used, it overrides all other CLI flags (like `-pro`) except for debugging/verbose logs.

### 2. Implement Config Loader & Validator

- Load the JSON file.
- Validate that `imageSize: "4K"` is only used if `model: "pro"`.
- Validate that all provided image paths in `styles` exist.

### 3. Revamp Prompt & Config Construction

- Construct the `contents` array by interleaving:

  1. `system_prompt` (if present)
  2. For each style: `style.prompt` + `style.image`
  3. `instance_prompt`

- Map the JSON `config` object directly to the Gemini `imageConfig`.

### 4. Maintain Compatibility

- The existing positional prompt + `--image` flags will continue to work, defaulting to Flash and 1:1 ratio.

## Implementation Steps

1. Create a `sample_config.json` with the new structure.
2. Modify `generate.js` to handle the `--json` flag and parse the configuration.
3. Update the `ai.models.generateContent` call to use dynamic parameters from the config.
4. Add error handling for missing files or invalid configurations.