# Cursor Agent CLI: How-To Guide

This guide explains how to use the Cursor Agent CLI effectively, including model switching, permission handling, and common flags.

## 🚀 Basic Usage

The standard command to invoke the agent is:
```bash
/home/broz/.local/share/cursor-agent/versions/2026.01.17-d239e66/cursor-agent [options] [prompt...]
```

## 🎭 Switching Models

You can specify which model to use using the `--model` flag. We have configured aliases in `cli-config.json` for all available models.

### Full Model Command List

| Model | CLI Command | Aliases |
| :--- | :--- | :--- |
| **Gemini 3 Flash** | `cursor-agent --model gemini-3-flash` | `flash`, `gemini-flash` |
| **Gemini 3 Pro** | `cursor-agent --model gemini-3-pro` | `pro`, `gemini-pro` |
| **Claude 4.5 Opus (Thinking)** | `cursor-agent --model opus-4.5-thinking` | `ot`, `opus-thinking` |
| **Claude 4.5 Opus** | `cursor-agent --model opus-4.5` | `opus` |
| **Claude 4.5 Sonnet** | `cursor-agent --model sonnet-4.5` | `sonnet` |
| **GPT-5.2 Codex** | `cursor-agent --model gpt-5.2-codex` | `codex` |
| **GPT-5.2** | `cursor-agent --model gpt-5.2` | `gpt-5` |
| **Composer 1** | `cursor-agent --model composer-1` | `c1`, `composer` |
| **Grok** | `cursor-agent --model grok` | |

### Specialized Codex Variants
- **GPT-5.2 Codex High**: `cursor-agent --model gpt-5.2-codex-high`
- **GPT-5.2 Codex Low**: `cursor-agent --model gpt-5.2-codex-low`
- **GPT-5.2 Codex Fast**: `cursor-agent --model gpt-5.2-codex-fast`
- **GPT-5.1 Codex Max**: `cursor-agent --model gpt-5.1-codex-max`

## 🛠️ Essential Flags

| Flag | Name | Description |
| :--- | :--- | :--- |
| `-p` | `--print` | **Crucial for automation.** Prints responses to console. Required for the agent to use tools like `write` and `bash` in headless mode. |
| `-f` | `--force` | **Bypass prompts.** Force allows commands unless explicitly denied. Use this to prevent the agent from getting stuck on permission requests. |
| `-c` | `--cloud` | Starts in cloud mode (opens the composer picker in the UI). |
| `--plan` | `--mode plan` | Starts in read-only/planning mode. No edits will be made. |
| `--sandbox disabled` | | Overrides config to disable the sandbox, giving direct system access. |

## ⚔️ Recommended Workflow (The "Broz" Way)

To have the agent perform a task (like a commit or a build) without manual intervention, use the `-p` and `-f` flags together:

```bash
cursor-agent -p -f "analyze the changes and commit them with a descriptive message"
```

## 📋 Configuration
Your global settings are stored in `~/.cursor/cli-config.json`. This file controls:
- **Permissions**: Currently set to `"*"` to allow all operations.
- **Model Aliases**: Custom short-names for your favorite models.
- **Sandbox**: Currently `disabled` for direct system integration.

---
*Last Updated: 2026-01-23*
