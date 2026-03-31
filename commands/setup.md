---
name: setup
description: Check whether the local Codex CLI is ready and optionally toggle the stop-time review gate
---

Run:

```bash
~/.cursor/codex-plugin/bin/codex-companion setup --json $ARGUMENTS
```

If the command fails because the launcher does not exist, tell the user to restart Cursor or reload the window so the Codex plugin session hook can initialize.

If the result says Codex is unavailable and npm is available:
- Ask the user whether to install Codex now, recommending the install option.
- If the user chooses install, run:

```bash
npm install -g @openai/codex
```

- Then rerun:

```bash
~/.cursor/codex-plugin/bin/codex-companion setup --json $ARGUMENTS
```

If Codex is already installed or npm is unavailable:
- Do not ask about installation.

Output rules:
- Present the final setup output to the user.
- If installation was skipped, present the original setup output.
- If Codex is installed but not authenticated, preserve the guidance to run `!codex login`.

Supported arguments:
- `--enable-review-gate` to enable the optional stop-time review gate
- `--disable-review-gate` to disable the optional stop-time review gate
