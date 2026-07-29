import path from "node:path";

export function resolveFrom(baseDir: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? path.normalize(maybeRelativePath)
    : path.resolve(baseDir, maybeRelativePath);
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function relativeToRepo(repoRoot: string, absolutePath: string): string {
  return toPosixPath(path.relative(repoRoot, absolutePath));
}

export function isPathInsideOrEqual(rootDir: string, candidatePath: string): boolean {
  const relative = path.relative(rootDir, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function slugifyPathSegment(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "target";
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function defaultDocsDir(repoRoot: string): string {
  return path.join(repoRoot, "docs");
}

export function defaultOutputRoot(repoRoot: string): string {
  return path.resolve(repoRoot, "..", "review-reports", "code-review");
}
