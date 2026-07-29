import { describe, expect, it } from "vitest";

import type { AppOptions } from "../../src/agents/agent-types.js";
import {
  buildCodexEnv,
  buildCodexOptions,
  buildThreadOptions,
  createCodexClient
} from "../../src/codex/codex-client-factory.js";
import { shouldRunCodexE2E } from "../../src/codex/e2e-gate.js";

describe("codex client factory", () => {
  it("creates a Codex client", () => {
    expect(createCodexClient(options())).toBeDefined();
  });

  it("builds a minimal explicit Codex environment", () => {
    const env = buildCodexEnv({
      PATH: "/usr/bin",
      HOME: "/home/example",
      CODEX_API_KEY: "secret-key",
      OPENAI_API_KEY: "openai-key",
      UNRELATED: "ignored"
    });

    expect(env).toEqual({
      PATH: "/usr/bin",
      HOME: "/home/example",
      CODEX_API_KEY: "secret-key",
      OPENAI_API_KEY: "openai-key"
    });
  });

  it("does not expose API keys in Codex config overrides", () => {
    const codexOptions = buildCodexOptions(options({ apiKey: "secret-key" }));

    expect(codexOptions.apiKey).toBe("secret-key");
    expect(JSON.stringify(codexOptions.config)).not.toContain("secret-key");
  });

  it("builds safe read-only thread options by default", () => {
    const threadOptions = buildThreadOptions(
      options({
        additionalDirectories: ["/repo/../instructions"],
        model: "gpt-5-codex",
        modelReasoningEffort: "medium"
      })
    );

    expect(threadOptions).toMatchObject({
      workingDirectory: "/repo",
      skipGitRepoCheck: false,
      sandboxMode: "read-only",
      approvalPolicy: "never",
      model: "gpt-5-codex",
      modelReasoningEffort: "medium",
      networkAccessEnabled: false,
      webSearchMode: "disabled",
      additionalDirectories: ["/repo/../instructions"]
    });
  });

  it("gates real Codex E2E behind RUN_CODEX_E2E=true", () => {
    expect(shouldRunCodexE2E({ RUN_CODEX_E2E: "false" })).toBe(false);
    expect(shouldRunCodexE2E({ RUN_CODEX_E2E: "true" })).toBe(true);
  });
});

function options(overrides: Partial<AppOptions> = {}): AppOptions {
  return {
    repoRoot: "/repo",
    docsDir: "/repo/docs",
    outputRoot: "/repo/review-reports",
    rawTarget: "full",
    selectedAgents: ["security"],
    concurrency: 1,
    timeoutMs: 1000,
    format: "markdown",
    failOn: "none",
    skipGitRepoCheck: false,
    dryRun: false,
    verbose: false,
    ...overrides
  };
}
