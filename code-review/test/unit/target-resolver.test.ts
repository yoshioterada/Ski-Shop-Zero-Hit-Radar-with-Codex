import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AppOptions } from "../../src/agents/agent-types.js";
import { resolveTarget } from "../../src/targets/target-resolver.js";
import { CliError } from "../../src/utils/errors.js";

let tempRoot: string;
let repoRoot: string;
let docsDir: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-target-"));
  repoRoot = path.join(tempRoot, "repo");
  docsDir = path.join(repoRoot, "docs");

  writeFile("src/main/java/com/skishop/controller/ProductController.java");
  writeFile("src/main/java/com/skishop/service/ProductService.java");
  writeFile("src/main/java/com/skishop/AppApplication.java");
  writeFile("src/main/java/com/skishop/SecurityConfig.java");
  writeFile("src/main/resources/application.yml");
  writeFile("src/main/resources/application-prod.properties");
  writeFile("src/main/resources/db/migration/V1__init.sql");
  writeFile("pom.xml");
  writeFile("Dockerfile");
  writeFile(".dockerignore");
  writeFile("target/generated/Ignored.java");
  writeFile("build/generated/Ignored.java");
  writeFile("README.md");
  writeFile("AGENTS.md", "# Repo instructions");
  writeFile("design-docs/api.md", "# API design");
  writeFile("docs/migration/DESIGN.md", "# Design");
  writeFile("docs/migration/PLAN.md", "# Plan");

  const instructionsDir = path.join(tempRoot, "instructions");
  fs.mkdirSync(instructionsDir, { recursive: true });
  fs.writeFileSync(path.join(instructionsDir, "java.instructions.md"), "# Java instructions");
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("resolveTarget", () => {
  it("enumerates reviewable files for full and excludes generated directories", async () => {
    const resolution = await resolveTarget(options({ rawTarget: "full" }));

    expect(resolution.target.targetKind).toBe("full");
    expect(resolution.target.targetName).toBe("full");
    expect(resolution.target.files).toContain("src/main/java/com/skishop/controller/ProductController.java");
    expect(resolution.target.files).toContain("src/main/resources/application.yml");
    expect(resolution.target.files).toContain("src/main/resources/db/migration/V1__init.sql");
    expect(resolution.target.files).toContain("pom.xml");
    expect(resolution.target.files).toContain("Dockerfile");
    expect(resolution.target.files).toContain(".dockerignore");
    expect(resolution.target.files).not.toContain("README.md");
    expect(resolution.target.files).not.toContain("target/generated/Ignored.java");
    expect(resolution.target.files).not.toContain("build/generated/Ignored.java");
  });

  it("resolves a single target file", async () => {
    const resolution = await resolveTarget(
      options({ rawTarget: "src/main/java/com/skishop/controller/ProductController.java" })
    );

    expect(resolution.target.targetKind).toBe("file");
    expect(resolution.target.targetName).toBe("productcontroller");
    expect(resolution.target.files).toEqual(["src/main/java/com/skishop/controller/ProductController.java"]);
  });

  it("resolves a target directory", async () => {
    const resolution = await resolveTarget(
      options({ rawTarget: "src/main/java/com/skishop/controller" })
    );

    expect(resolution.target.targetKind).toBe("directory");
    expect(resolution.target.targetName).toBe("controller");
    expect(resolution.target.files).toEqual(["src/main/java/com/skishop/controller/ProductController.java"]);
  });

  it("resolves target-dir as a directory-only option", async () => {
    const resolution = await resolveTarget(
      options({ targetDir: "src/main/java/com/skishop/controller" })
    );

    expect(resolution.target.rawTarget).toBe("src/main/java/com/skishop/controller");
    expect(resolution.target.targetKind).toBe("directory");
    expect(resolution.target.files).toEqual(["src/main/java/com/skishop/controller/ProductController.java"]);
  });

  it("rejects target-dir when a file path is provided", async () => {
    await expectCliError(
      resolveTarget(options({ targetDir: "src/main/java/com/skishop/controller/ProductController.java" })),
      3
    );
  });

  it("rejects absolute paths outside the repository", async () => {
    const outsideFile = path.join(tempRoot, "outside.java");
    fs.writeFileSync(outsideFile, "class Outside {}");

    await expectCliError(resolveTarget(options({ rawTarget: outsideFile })), 2);
  });

  it("rejects targets with zero reviewable files", async () => {
    writeFile("docs/notes/README.md");

    await expectCliError(resolveTarget(options({ rawTarget: "docs/notes" })), 3);
  });

  it("detects standards, design references, and external instruction directories", async () => {
    const resolution = await resolveTarget(options({ rawTarget: "full" }));

    expect(resolution.target.standardsFiles).toContain("AGENTS.md");
    expect(resolution.target.standardsFiles).toContain(path.join(tempRoot, "instructions", "java.instructions.md"));
    expect(resolution.target.designReferenceFiles).toEqual([
      "design-docs/api.md",
      "docs/migration/DESIGN.md",
      "docs/migration/PLAN.md"
    ]);
    expect(resolution.additionalDirectories).toEqual([path.join(tempRoot, "instructions")]);
  });
});

function options(overrides: Partial<Pick<AppOptions, "rawTarget" | "targetDir">>): AppOptions {
  return {
    repoRoot,
    docsDir,
    outputRoot: path.join(tempRoot, "out"),
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

function writeFile(relativePath: string, contents = "class Placeholder {}"): void {
  const filePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

async function expectCliError(promise: Promise<unknown>, exitCode: number): Promise<void> {
  try {
    await promise;
    throw new Error("Expected promise to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(exitCode);
  }
}
