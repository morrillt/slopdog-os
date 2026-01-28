---
name: Banananano JSON Config Support
overview: Add support for a JSON configuration file to banananano, allowing complex generations with system prompts, multiple style references (prompt + image pairs), and instance-specific prompts.
todos:
  - id: define-schema
    content: Define JSON configuration structure and sample file
    status: pending
  - id: update-args-parsing
    content: Update CLI argument parsing in generate.js for --json flag
    status: pending
  - id: implement-config-loader
    content: Implement JSON configuration loading and validation logic
    status: pending
  - id: update-prompt-logic
    content: Update prompt/contents construction for interleaved styles and system prompts
    status: pending
---

# Plan: JSON Configuration Support for Banananano

Upgrade `generate.js` to support a `--json` flag that points to a configuration file. This file will be the single source of truth for the generation when provided, specifying the system rules, style references, and the specific task prompt.

## Proposed JSON Structure

```json
{
  "system_prompt": "General rules and style preferences...",
  "styles": [
    {
      "prompt": "I really like the simple cartoonish aspect of this.",
      "image": "path/to/image1.png"
    },
    {
      "prompt": "Use colors from this reference.",
      "image": "path/to/image2.png"
    }
  ],
  "instance_prompt": "Thumbnail for a stock backtesting app"
}
```

## Changes

### 1. Update Argument Parsing in `generate.js`

- Modify the CLI argument loop to detect `--json <file_path>`.
- If `--json` is present, disable the legacy positional prompt and `--image` flags.

### 2. Implement JSON Config Loader

- Create a function to read and parse the JSON file.
- Validate the existence of images specified in the JSON.

### 3. Revamp Prompt Construction

- Rebuild the `contents` array sent to the Gemini API:
  - Add `system_prompt` as the first text part.
  - Interleave `styles` prompts and images.
  - Add `instance_prompt` as the final text part.

### 4. Maintain Compatibility

- Ensure existing workflows (positional prompt file + optional images) still function when `--json` is omitted.

## Implementation Steps

1. Read current `generate.js` to identify exact insertion points for argument parsing.
2. Define a sample `config.json` for testing.
3. Modify `generate.js` to implement the new logic.
4. Test with the sample JSON.