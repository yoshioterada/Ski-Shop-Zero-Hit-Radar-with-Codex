import fs from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";

import type { AppOptions, ReviewTarget, TargetInput } from "../agents/agent-types.js";
import { CliError } from "../utils/errors.js";
import {
  isPathInsideOrEqual,
  relativeToRepo,
  resolveFrom,
  slugifyPathSegment,
  uniqueSorted
} from "../utils/path-utils.js";
import {
  REVIEW_FILE_GLOB_OPTIONS,
  REVIEW_FILE_PATTERNS,
  isReviewableFilePath
} from "./file-patterns.js";

export interface TargetResolution {
  target: ReviewTarget;
  additionalDirectories: string[];
  warnings: string[];
}

/** Resolves CLI target options into repo-relative review files and reference documents. */
export async function resolveTarget(options: AppOptions): Promise<TargetResolution> {
  const input = await normalizeTargetInput(options);
  const files = await enumerateReviewableFiles(input, options.repoRoot);

  if (files.length === 0) {
    throw new CliError("No reviewable files found", 3);
  }

  const referenceFiles = await resolveReferenceFiles(options.repoRoot);

  return {
    target: {
      rawTarget: input.raw,
      targetKind: input.kind,
      targetName: buildTargetName(input),
      repoRoot: options.repoRoot,
      files,
      standardsFiles: referenceFiles.standardsFiles,
      designReferenceFiles: referenceFiles.designReferenceFiles
    },
    additionalDirectories: referenceFiles.additionalDirectories,
    warnings: referenceFiles.warnings
  };
}

/** Validates and classifies the raw target argument before file enumeration. */
export async function normalizeTargetInput(options: AppOptions): Promise<TargetInput> {
  if (!options.rawTarget && !options.targetDir) {
    throw new CliError("Either --target or --target-dir is required", 2);
  }

  if (options.rawTarget && options.targetDir) {
    throw new CliError("--target and --target-dir cannot be used together", 2);
  }

  if (options.rawTarget === "full") {
    return { kind: "full", raw: "full" };
  }

  const rawPath = options.targetDir ?? options.rawTarget;
  if (!rawPath) {
    throw new CliError("Either --target or --target-dir is required", 2);
  }

  const absolutePath = resolveFrom(options.repoRoot, rawPath);
  ensurePathInRepo(options.repoRoot, absolutePath);

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    throw new CliError(`Review target does not exist: ${absolutePath}`, 3);
  }

  if (options.targetDir) {
    if (!stat.isDirectory()) {
      throw new CliError(`--target-dir must be an existing directory: ${absolutePath}`, 3);
    }

    return { kind: "directory", raw: options.targetDir, absolutePath };
  }

  if (stat.isFile()) {
    return { kind: "file", raw: rawPath, absolutePath };
  }

  if (stat.isDirectory()) {
    return { kind: "directory", raw: rawPath, absolutePath };
  }

  throw new CliError(`Review target must be a file or directory: ${absolutePath}`, 3);
}

/** Enumerates only files that match the Java review scope and remain inside the repo. */
export async function enumerateReviewableFiles(input: TargetInput, repoRoot: string): Promise<string[]> {
  if (input.kind === "file") {
    const relativePath = relativeToRepo(repoRoot, input.absolutePath);
    return isReviewableFilePath(relativePath) ? [relativePath] : [];
  }

  const searchRoot = input.kind === "full" ? repoRoot : input.absolutePath;
  const absoluteFiles = await fg([...REVIEW_FILE_PATTERNS], {
    ...REVIEW_FILE_GLOB_OPTIONS,
    cwd: searchRoot,
    absolute: true
  });

  return uniqueSorted(
    absoluteFiles
      .filter((filePath) => isPathInsideOrEqual(repoRoot, filePath))
      .map((filePath) => relativeToRepo(repoRoot, path.normalize(filePath)))
  );
}

export function buildTargetName(input: TargetInput): string {
  if (input.kind === "full") {
    return "full";
  }

  const baseName = path.basename(input.absolutePath);
  const fileName = input.kind === "file" ? baseName.replace(/\.[^.]+$/, "") : baseName;
  return slugifyPathSegment(fileName);
}

async function resolveReferenceFiles(repoRoot: string): Promise<{
  standardsFiles: string[];
  designReferenceFiles: string[];
  additionalDirectories: string[];
  warnings: string[];
}> {
  const standardsFiles: string[] = [];
  const designReferenceFiles: string[] = [];
  const additionalDirectories: string[] = [];
  const warnings: string[] = [];

  await addIfFileExists(path.join(repoRoot, "AGENTS.md"), repoRoot, standardsFiles);
  await addGlobbedFiles(path.join(repoRoot, "design-docs"), repoRoot, designReferenceFiles);
  await addIfFileExists(path.join(repoRoot, "docs", "migration", "DESIGN.md"), repoRoot, designReferenceFiles);
  await addIfFileExists(path.join(repoRoot, "docs", "migration", "PLAN.md"), repoRoot, designReferenceFiles);

  const instructionsDir = path.resolve(repoRoot, "..", "instructions");
  const instructionFiles = await fg("*.instructions.md", {
    cwd: instructionsDir,
    absolute: true,
    onlyFiles: true
  }).catch(() => []);

  if (instructionFiles.length > 0) {
    standardsFiles.push(...instructionFiles.map((filePath) => path.normalize(filePath)));
    additionalDirectories.push(instructionsDir);
  } else {
    warnings.push(`No external instruction files found in ${instructionsDir}`);
  }

  return {
    standardsFiles: uniqueSorted(standardsFiles),
    designReferenceFiles: uniqueSorted(designReferenceFiles),
    additionalDirectories: uniqueSorted(additionalDirectories),
    warnings
  };
}

async function addIfFileExists(filePath: string, repoRoot: string, destination: string[]): Promise<void> {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      destination.push(relativeToRepo(repoRoot, filePath));
    }
  } catch {
    // Optional reference files are included only when present.
  }
}

async function addGlobbedFiles(directory: string, repoRoot: string, destination: string[]): Promise<void> {
  const files = await fg("**/*", {
    cwd: directory,
    absolute: true,
    onlyFiles: true,
    dot: true
  }).catch(() => []);

  destination.push(...files.map((filePath) => relativeToRepo(repoRoot, path.normalize(filePath))));
}

function ensurePathInRepo(repoRoot: string, absolutePath: string): void {
  if (!isPathInsideOrEqual(repoRoot, absolutePath)) {
    throw new CliError(`Review target must be inside --repo: ${absolutePath}`, 2);
  }
}
