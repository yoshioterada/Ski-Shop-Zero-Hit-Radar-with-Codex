import { describe, expect, it } from "vitest";

import { buildCodexOptions, buildThreadOptions, createCodexClient } from "../../src/codex/codex-client-factory.js";
import { shouldRunCodexE2E } from "../../src/codex/e2e-gate.js";
import { agentReviewOutputSchema } from "../../src/results/review-schema.js";

const runCodexE2E = shouldRunCodexE2E();
const gatedIt = runCodexE2E ? it : it.skip;

describe("Codex SDK real E2E", () => {
  gatedIt(
    "runs only when RUN_CODEX_E2E=true",
    async () => {
      const repoRoot = process.cwd();
      const codex = createCodexClient({
        repoRoot,
        docsDir: `${repoRoot}/../docs`,
        outputRoot: `${repoRoot}/../review-reports/code-review`,
        rawTarget: "full",
        selectedAgents: ["security"],
        concurrency: 1,
        timeoutMs: 120_000,
        format: "json",
        failOn: "none",
        skipGitRepoCheck: true,
        dryRun: false,
        verbose: false
      });

      expect(buildCodexOptions).toBeDefined();
      const thread = codex.startThread(
        buildThreadOptions({
          repoRoot,
          docsDir: `${repoRoot}/../docs`,
          outputRoot: `${repoRoot}/../review-reports/code-review`,
          rawTarget: "full",
          selectedAgents: ["security"],
          concurrency: 1,
          timeoutMs: 120_000,
          format: "json",
          failOn: "none",
          skipGitRepoCheck: true,
          dryRun: false,
          verbose: false
        })
      );
      const result = await thread.run("Return a passing empty Java review result as JSON.", {
        outputSchema: agentReviewOutputSchema
      });

      expect(result.finalResponse).toContain("summary");
    },
    180_000
  );
});
