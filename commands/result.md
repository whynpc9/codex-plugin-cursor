---
name: result
description: Show the stored final output for a finished Codex job in this repository
---

Before running any command below, ensure `CODEX_PLUGIN_ROOT` is exported. The value is provided in your session context (Codex Plugin Environment). If it is not set, stop and tell the user that the Codex plugin session did not initialize properly.

Run:
```bash
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" result $ARGUMENTS
```

Supported arguments: `[job-id]`

Present the full command output to the user. Do not summarize or condense it. Preserve all details including:
- Job ID and status
- The complete result payload, including verdict, summary, findings, details, artifacts, and next steps
- File paths and line numbers exactly as reported
- Any error messages or parse errors
- Follow-up commands such as `/codex:status <id>` and `/codex:review`
