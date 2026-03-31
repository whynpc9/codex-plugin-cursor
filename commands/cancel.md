---
name: cancel
description: Cancel an active background Codex job in this repository
---

Before running any command below, ensure `CODEX_PLUGIN_ROOT` is exported. The value is provided in your session context (Codex Plugin Environment). If it is not set, stop and tell the user that the Codex plugin session did not initialize properly.

Run:
```bash
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" cancel $ARGUMENTS
```

Supported arguments: `[job-id]`

Present the cancellation result to the user.
