import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseAppOptionsFromArgv } from "../../src/cli-options.js";
import { CliError } from "../../src/utils/errors.js";

let tempRoot: string;
let repoRoot: string;
let docsDir: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-cli-"));
  repoRoot = path.join(tempRoot, "repo");
  docsDir = path.join(repoRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("parseAppOptionsFromArgv", () => {
  it("normalizes valid CLI options", () => {
    const options = parseAppOptionsFromArgv([
      "--target",
      "full",
      "--repo",
      repoRoot,
      "--docs",
      docsDir,
      "--agents",
      "security,performance",
      "--concurrency",
      "2",
      "--timeout-ms",
      "2000"
    ]);

    expect(options.rawTarget).toBe("full");
    expect(options.targetDir).toBeUndefined();
    expect(options.repoRoot).toBe(repoRoot);
    expect(options.docsDir).toBe(docsDir);
    expect(options.selectedAgents).toEqual(["security", "performance"]);
    expect(options.concurrency).toBe(2);
    expect(options.timeoutMs).toBe(2000);
  });

  it("requires either target or target-dir", () => {
    expectCliError(["--repo", repoRoot, "--docs", docsDir], 2);
  });

  it("rejects target and target-dir together", () => {
    expectCliError(
      ["--target", "full", "--target-dir", "src", "--repo", repoRoot, "--docs", docsDir],
      2
    );
  });

  it("rejects invalid numeric ranges", () => {
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--concurrency", "0"], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--timeout-ms", "999"], 2);
  });

  it("rejects invalid enum values", () => {
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--sandbox", "bad"], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--web-search", "bad"], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--reasoning", "bad"], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--format", "bad"], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", docsDir, "--fail-on", "bad"], 2);
  });

  it("rejects missing repo or docs directories", () => {
    expectCliError(["--target", "full", "--repo", path.join(tempRoot, "missing"), "--docs", docsDir], 2);
    expectCliError(["--target", "full", "--repo", repoRoot, "--docs", path.join(tempRoot, "missing")], 2);
  });
});

function expectCliError(argv: string[], exitCode: number): void {
  try {
    parseAppOptionsFromArgv(argv);
    throw new Error("Expected parseAppOptionsFromArgv to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(exitCode);
  }
}
