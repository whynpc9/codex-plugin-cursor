---
name: status
description: Show active and recent Codex jobs for this repository, including review-gate status
---

Before running any command below, ensure `CODEX_PLUGIN_ROOT` is exported. The value is provided in your session context (Codex Plugin Environment). If it is not set, stop and tell the user that the Codex plugin session did not initialize properly.

Run:
```bash
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" status $ARGUMENTS
```

Supported arguments: `[job-id] [--wait] [--timeout-ms <ms>] [--all]`

If the user did not pass a job ID:
- Render the command output as a single Markdown table for the current and past runs in this session.
- Keep it compact. Do not include progress blocks or extra prose outside the table.
- Preserve the actionable fields from the command output, including job ID, kind, status, phase, elapsed or duration, summary, and follow-up commands.

If the user did pass a job ID:
- Present the full command output to the user.
- Do not summarize or condense it.
