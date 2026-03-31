---
name: result
description: Show the stored final output for a finished Codex job in this repository
---

Run:
```bash
~/.cursor/codex-plugin/bin/codex-companion result $ARGUMENTS
```

Supported arguments: `[job-id]`

Present the full command output to the user. Do not summarize or condense it. Preserve all details including:
- Job ID and status
- The complete result payload, including verdict, summary, findings, details, artifacts, and next steps
- File paths and line numbers exactly as reported
- Any error messages or parse errors
- Follow-up commands such as `/codex:status <id>` and `/codex:review`
