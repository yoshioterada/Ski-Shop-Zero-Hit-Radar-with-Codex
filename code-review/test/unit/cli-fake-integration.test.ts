import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REQUIRED_AGENT_IDS } from "../../src/agents/agent-registry.js";
import { runCliWithDependencies } from "../../src/cli.js";
import { FakeReviewRunner } from "../../src/codex/fake-review-runner.js";
import { CliError } from "../../src/utils/errors.js";

let tempRoot: string;
let repoRoot: string;
let docsDir: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-cli-fake-"));
  repoRoot = path.join(tempRoot, "repo");
  docsDir = path.join(repoRoot, "docs");

  fs.mkdirSync(path.join(repoRoot, "src/main/java/com/skishop"), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, "src/main/java/com/skishop/Application.java"),
    "class Application {}"
  );

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "orchest-code-review.agent.md"), "# Orchestrator");
  for (const id of REQUIRED_AGENT_IDS) {
    fs.writeFileSync(path.join(docsDir, `orchest-code-review-${id}.agent.md`), `# ${id}`);
  }
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("CLI fake integration", () => {
  it("prints dry-run execution plan without calling the SDK", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCliWithDependencies(
      [
        "node",
        "code-review",
        "--target",
        "full",
        "--repo",
        repoRoot,
        "--docs",
        docsDir,
        "--agents",
        "security,performance",
        "--concurrency",
        "7",
        "--dry-run"
      ],
      { runner: new FakeReviewRunner() }
    );

    const output = String(logSpy.mock.calls[0]?.[0]);
    expect(output).toContain("Agents: security, performance");
    expect(output).toContain("Target: full");
    expect(output).toContain("Files: 1");
    expect(output).toContain("Concurrency: 7");
  });

  it("runs through the fake runner and prints a minimal summary", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCliWithDependencies(
      [
        "node",
        "code-review",
        "--target",
        "full",
        "--repo",
        repoRoot,
        "--docs",
        docsDir,
        "--agents",
        "security"
      ],
      { runner: new FakeReviewRunner() }
    );

    const output = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      allJobsFailed: boolean;
      report: string;
      json: string;
      events: string;
    };

    expect(output).toMatchObject({
      totalJobs: 1,
      completedJobs: 1,
      failedJobs: 0,
      timedOutJobs: 0,
      allJobsFailed: false,
      verdict: "Approved",
      exitCode: 0
    });
    expect(output.report).toContain("check-report-1.md");
    expect(output.json).toContain("check-report-1.json");
    expect(output.events).toContain("check-report-1.events.jsonl");
  });

  it("maps report write failures to exit code 5", async () => {
    const outputRootFile = path.join(tempRoot, "not-a-directory");
    fs.writeFileSync(outputRootFile, "occupied");

    await expectCliError(
      runCliWithDependencies(
        [
          "node",
          "code-review",
          "--target",
          "full",
          "--repo",
          repoRoot,
          "--docs",
          docsDir,
          "--out",
          outputRootFile,
          "--agents",
          "security"
        ],
        { runner: new FakeReviewRunner() }
      ),
      5
    );
  });
});

async function expectCliError(promise: Promise<unknown>, exitCode: number): Promise<void> {
  try {
    await promise;
    throw new Error("Expected CLI to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(exitCode);
  }
}
