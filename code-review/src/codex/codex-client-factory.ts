import { Codex } from "@openai/codex-sdk";
import type { CodexOptions, ThreadOptions } from "@openai/codex-sdk";

import type { AppOptions } from "../agents/agent-types.js";

const inheritedEnvKeys = [
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "TMPDIR",
  "CODEX_API_KEY",
  "OPENAI_API_KEY",
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "NO_PROXY",
  "SSL_CERT_FILE",
  "NODE_EXTRA_CA_CERTS"
] as const;

/** Creates the SDK client while keeping CLI process environment exposure explicit. */
export function createCodexClient(options: AppOptions): Codex {
  return new Codex(buildCodexOptions(options));
}

export function buildCodexOptions(options: AppOptions): CodexOptions {
  return {
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    codexPathOverride: options.codexPathOverride,
    config: {
      show_raw_agent_reasoning: false
    },
    env: buildCodexEnv(process.env)
  };
}

/** Returns only the environment variables the Codex CLI needs to start safely. */
export function buildCodexEnv(sourceEnv: NodeJS.ProcessEnv): Record<string, string> {
  const env: Record<string, string> = {};

  for (const key of inheritedEnvKeys) {
    const value = sourceEnv[key];
    if (typeof value === "string" && value.length > 0) {
      env[key] = value;
    }
  }

  return env;
}

/** Builds per-agent read-only thread settings used for every independent review. */
export function buildThreadOptions(options: AppOptions): ThreadOptions {
  return {
    workingDirectory: options.repoRoot,
    skipGitRepoCheck: options.skipGitRepoCheck,
    sandboxMode: options.sandboxMode ?? "read-only",
    approvalPolicy: "never",
    model: options.model,
    modelReasoningEffort: options.modelReasoningEffort ?? "high",
    networkAccessEnabled: false,
    webSearchMode: options.webSearchMode ?? "disabled",
    additionalDirectories: options.additionalDirectories
  };
}
