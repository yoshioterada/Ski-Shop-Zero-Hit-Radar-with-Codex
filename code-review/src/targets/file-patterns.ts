import path from "node:path";

import { toPosixPath } from "../utils/path-utils.js";

export const REVIEW_FILE_PATTERNS = [
  "**/*.java",
  "**/pom.xml",
  "**/application*.properties",
  "**/application*.yml",
  "**/application*.yaml",
  "**/*Application.java",
  "**/*Config.java",
  "**/SecurityConfig.java",
  "**/db/migration/*.sql",
  "**/Dockerfile",
  "**/.dockerignore"
] as const;

export const EXCLUDED_DIRECTORIES = [
  ".git",
  "node_modules",
  "target",
  "build",
  "dist",
  ".gradle",
  ".idea",
  ".vscode",
  "review-reports"
] as const;

export const REVIEW_FILE_GLOB_OPTIONS = {
  dot: true,
  onlyFiles: true,
  unique: true,
  ignore: EXCLUDED_DIRECTORIES.flatMap((directory) => [`${directory}/**`, `**/${directory}/**`])
} as const;

export function isReviewableFilePath(filePath: string): boolean {
  const normalized = toPosixPath(filePath);
  const baseName = path.posix.basename(normalized);

  return (
    normalized.endsWith(".java") ||
    baseName === "pom.xml" ||
    /^application.*\.(properties|ya?ml)$/.test(baseName) ||
    baseName === "SecurityConfig.java" ||
    baseName.endsWith("Application.java") ||
    baseName.endsWith("Config.java") ||
    (normalized.includes("/db/migration/") && baseName.endsWith(".sql")) ||
    baseName === "Dockerfile" ||
    baseName === ".dockerignore"
  );
}
