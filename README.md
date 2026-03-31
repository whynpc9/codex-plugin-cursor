# Codex plugin for Cursor

Use Codex from inside Cursor for code reviews or to delegate tasks to Codex.

This plugin is a Cursor adaptation of the [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) project. It provides the same capabilities — code review, adversarial review, task delegation, and background job management — ported to Cursor's plugin format.

## What You Get

- `/codex:review` for a normal read-only Codex review
- `/codex:adversarial-review` for a steerable challenge review
- `/codex:rescue`, `/codex:status`, `/codex:result`, and `/codex:cancel` to delegate work and manage background jobs
- `/codex:setup` to check Codex installation and authentication status
- A `codex-rescue` subagent for proactive task delegation
- Optional stop-time review gate via hooks

## Requirements

- **Cursor 2.4 or later** (plugin support required)
- **ChatGPT subscription (incl. Free) or OpenAI API key** — usage contributes to your Codex usage limits
- **Node.js 18.18 or later**
- **Codex CLI** installed globally (`npm install -g @openai/codex`)

## Install

Clone the repo and symlink (or copy) it into Cursor's local plugin directory:

```bash
git clone https://github.com/whynpc9/codex-plugin-cursor.git
ln -s "$(pwd)/codex-plugin-cursor" ~/.cursor/plugins/local/codex
```

Then restart Cursor (or run **Developer: Reload Window**) and use `/codex:setup` in Cursor Agent to verify everything is ready.

If Codex is not installed, the setup command will offer to install it for you. If Codex is installed but not authenticated, run:

```bash
codex login
```

## Usage

### `/codex:setup`

Checks whether the Codex CLI is installed and authenticated. Optionally toggles the stop-time review gate.

```
/codex:setup
/codex:setup --enable-review-gate
/codex:setup --disable-review-gate
```

### `/codex:review`

Runs a normal Codex review on your current work. Gives you the same quality of code review as running `/review` inside Codex directly.

```
/codex:review
/codex:review --base main
/codex:review --background
```

This command is read-only and will not perform any changes. Supports `--wait`, `--background`, `--base <ref>`, and `--scope`.

### `/codex:adversarial-review`

Runs a steerable review that questions the chosen implementation and design choices. Pressure-tests assumptions, tradeoffs, failure modes, and whether a different approach would have been safer or simpler.

```
/codex:adversarial-review
/codex:adversarial-review --base main challenge whether this was the right caching design
/codex:adversarial-review --background look for race conditions
```

Unlike `/codex:review`, it accepts extra focus text after the flags.

### `/codex:rescue`

Hands a task to Codex through the `codex-rescue` subagent.

```
/codex:rescue investigate why the tests started failing
/codex:rescue fix the failing test with the smallest safe patch
/codex:rescue --resume apply the top fix from the last run
/codex:rescue --model spark fix the issue quickly
/codex:rescue --background investigate the regression
```

Supports `--background`, `--wait`, `--resume`, `--fresh`, `--model <model|spark>`, and `--effort <level>`.

### `/codex:status`

Shows running and recent Codex jobs for the current repository.

```
/codex:status
/codex:status task-abc123
```

### `/codex:result`

Shows the final stored output for a finished Codex job.

```
/codex:result
/codex:result task-abc123
```

### `/codex:cancel`

Cancels an active background Codex job.

```
/codex:cancel
/codex:cancel task-abc123
```

## Typical Flows

### Review Before Shipping

```
/codex:review
```

### Hand A Problem To Codex

```
/codex:rescue investigate why the build is failing in CI
```

### Start Something Long-Running

```
/codex:adversarial-review --background
/codex:rescue --background investigate the flaky test
```

Then check in with:

```
/codex:status
/codex:result
```

## Review Gate

The plugin includes an optional stop-time review gate. When enabled, the plugin runs a targeted Codex review after each agent turn. If the review finds issues, the agent auto-continues to address them.

```
/codex:setup --enable-review-gate
/codex:setup --disable-review-gate
```

> **Warning:** The review gate can create a long-running agent/Codex loop and may drain usage limits quickly. Only enable it when you plan to actively monitor the session.

## Architecture

This plugin wraps the local Codex CLI and its app-server runtime. It does **not** call any API directly — all interaction goes through the `codex` binary installed on your machine.

Key components:

| Component | Description |
|:--|:--|
| `scripts/codex-companion.mjs` | Main CLI entry point — dispatches `setup`, `review`, `task`, `status`, `result`, `cancel` |
| `scripts/lib/app-server.mjs` | JSON-RPC client that connects to `codex app-server` via stdio or Unix socket |
| `scripts/lib/codex.mjs` | Orchestrates threads, turns, and reviews through the app-server protocol |
| `scripts/app-server-broker.mjs` | Shared broker that multiplexes one app-server across concurrent requests |
| `scripts/session-lifecycle-hook.mjs` | `sessionStart` / `sessionEnd` hook — bootstraps env vars and cleans up on exit |
| `scripts/stop-review-gate-hook.mjs` | `stop` hook — runs a targeted Codex review before allowing the agent to stop |

## Codex Configuration

The plugin uses your existing Codex configuration:

- User-level config: `~/.codex/config.toml`
- Project-level overrides: `.codex/config.toml`

For example, to always use `gpt-5.4-mini` with high reasoning effort for a project:

```toml
model = "gpt-5.4-mini"
model_reasoning_effort = "xhigh"
```

See the [Codex documentation](https://github.com/openai/codex) for more configuration options.

## Differences from the Claude Code Version

This plugin is adapted from [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc). Key adaptations:

| Area | Claude Code | Cursor |
|:--|:--|:--|
| Manifest | `.claude-plugin/plugin.json` | `.cursor-plugin/plugin.json` |
| Hook events | PascalCase (`SessionStart`) | camelCase (`sessionStart`) |
| Session env vars | `CLAUDE_ENV_FILE` (file append) | `sessionStart` hook returns `{ env: {...} }` |
| Stop gate | `{ decision: "block" }` | `{ followup_message: "..." }` |
| State directory | `CLAUDE_PLUGIN_DATA` | `CODEX_PLUGIN_DATA` (fallback `~/.cursor/codex-plugin/state/`) |
| Command frontmatter | `allowed-tools`, `argument-hint`, etc. | `name` and `description` only |
| Client identity | `"Claude Code"` | `"Cursor"` |

## License

Apache-2.0 — see [LICENSE](LICENSE).
