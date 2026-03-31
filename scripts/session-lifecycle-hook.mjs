#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { terminateProcessTree } from "./lib/process.mjs";
import { BROKER_ENDPOINT_ENV } from "./lib/app-server.mjs";
import {
  clearBrokerSession,
  LOG_FILE_ENV,
  loadBrokerSession,
  PID_FILE_ENV,
  sendBrokerShutdown,
  teardownBrokerSession
} from "./lib/broker-lifecycle.mjs";
import { loadState, resolveStateFile, saveState } from "./lib/state.mjs";
import { resolveWorkspaceRoot } from "./lib/workspace.mjs";

export const SESSION_ID_ENV = "CODEX_COMPANION_SESSION_ID";
const PLUGIN_DATA_ENV = "CODEX_PLUGIN_DATA";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, "..");

function readHookInput() {
  const raw = fs.readFileSync(0, "utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function emitOutput(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function cleanupSessionJobs(cwd, sessionId) {
  if (!cwd || !sessionId) {
    return;
  }

  const workspaceRoot = resolveWorkspaceRoot(cwd);
  const stateFile = resolveStateFile(workspaceRoot);
  if (!fs.existsSync(stateFile)) {
    return;
  }

  const state = loadState(workspaceRoot);
  const removedJobs = state.jobs.filter((job) => job.sessionId === sessionId);
  if (removedJobs.length === 0) {
    return;
  }

  for (const job of removedJobs) {
    const stillRunning = job.status === "queued" || job.status === "running";
    if (!stillRunning) {
      continue;
    }
    try {
      terminateProcessTree(job.pid ?? Number.NaN);
    } catch {
      // Ignore teardown failures during session shutdown.
    }
  }

  saveState(workspaceRoot, {
    ...state,
    jobs: state.jobs.filter((job) => job.sessionId !== sessionId)
  });
}

function createLauncher() {
  const binDir = path.join(os.homedir(), ".cursor", "codex-plugin", "bin");
  fs.mkdirSync(binDir, { recursive: true });
  const launcherPath = path.join(binDir, "codex-companion");
  const launcherContent = [
    "#!/usr/bin/env bash",
    `export CODEX_PLUGIN_ROOT="${PLUGIN_ROOT}"`,
    `exec node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" "$@"`,
    ""
  ].join("\n");
  fs.writeFileSync(launcherPath, launcherContent, { mode: 0o755 });
}

function handleSessionStart(input) {
  const pluginDataDir = path.join(os.homedir(), ".cursor", "codex-plugin", "data");

  try {
    createLauncher();
  } catch (err) {
    process.stderr.write(`Failed to create launcher: ${err.message}\n`);
  }

  emitOutput({
    env: {
      CODEX_PLUGIN_ROOT: PLUGIN_ROOT,
      [PLUGIN_DATA_ENV]: pluginDataDir,
      [SESSION_ID_ENV]: input.session_id ?? ""
    },
    additional_context: [
      "## Codex Plugin Environment",
      "",
      `CODEX_PLUGIN_ROOT="${PLUGIN_ROOT}"`,
      "",
      "To run codex-companion commands, use:",
      "~/.cursor/codex-plugin/bin/codex-companion <command> [args...]",
      ""
    ].join("\n")
  });
}

async function handleSessionEnd(input) {
  const cwd = input.workspace_roots?.[0] || input.cwd || process.env.CURSOR_PROJECT_DIR || process.cwd();
  const brokerSession =
    loadBrokerSession(cwd) ??
    (process.env[BROKER_ENDPOINT_ENV]
      ? {
          endpoint: process.env[BROKER_ENDPOINT_ENV],
          pidFile: process.env[PID_FILE_ENV] ?? null,
          logFile: process.env[LOG_FILE_ENV] ?? null
        }
      : null);
  const brokerEndpoint = brokerSession?.endpoint ?? null;
  const pidFile = brokerSession?.pidFile ?? null;
  const logFile = brokerSession?.logFile ?? null;
  const sessionDir = brokerSession?.sessionDir ?? null;
  const pid = brokerSession?.pid ?? null;

  if (brokerEndpoint) {
    await sendBrokerShutdown(brokerEndpoint);
  }

  cleanupSessionJobs(cwd, input.session_id || process.env[SESSION_ID_ENV]);
  teardownBrokerSession({
    endpoint: brokerEndpoint,
    pidFile,
    logFile,
    sessionDir,
    pid,
    killProcess: terminateProcessTree
  });
  clearBrokerSession(cwd);
}

async function main() {
  const input = readHookInput();
  const eventName = process.argv[2] ?? input.hook_event_name ?? "";

  if (eventName === "sessionStart" || eventName === "SessionStart") {
    handleSessionStart(input);
    return;
  }

  if (eventName === "sessionEnd" || eventName === "SessionEnd") {
    await handleSessionEnd(input);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
