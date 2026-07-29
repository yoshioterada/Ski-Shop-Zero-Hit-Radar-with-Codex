import type { Finding } from "../agents/agent-types.js";
import { severityRank } from "../agents/agent-types.js";

import { mergeSourceAgents, normalizeFilePath, normalizeText } from "./result-normalizer.js";

const similarityThreshold = 0.85;

export function deduplicateFindings(findings: readonly Finding[]): Finding[] {
  const deduplicated: Finding[] = [];

  for (const finding of findings) {
    const existingIndex = deduplicated.findIndex((existing) => areDuplicateFindings(existing, finding));
    if (existingIndex === -1) {
      deduplicated.push({ ...finding, targetFile: normalizeFilePath(finding.targetFile) });
      continue;
    }

    deduplicated[existingIndex] = mergeFindings(deduplicated[existingIndex] as Finding, finding);
  }

  return deduplicated;
}

export function areDuplicateFindings(left: Finding, right: Finding): boolean {
  if (buildExactKey(left) === buildExactKey(right)) {
    return true;
  }

  if (
    normalizeFilePath(left.targetFile) !== normalizeFilePath(right.targetFile) ||
    normalizeText(left.category) !== normalizeText(right.category)
  ) {
    return false;
  }

  const leftText = normalizeText(`${left.title} ${left.description}`);
  const rightText = normalizeText(`${right.title} ${right.description}`);
  return jaccardSimilarity(leftText, rightText) >= similarityThreshold;
}

export function mergeFindings(left: Finding, right: Finding): Finding {
  const higherSeverity =
    severityRank[right.severity] > severityRank[left.severity] ? right.severity : left.severity;
  const moreSpecificDescription =
    right.description.length > left.description.length ? right.description : left.description;
  const suggestedFix = right.suggestedFix?.length ?? 0 > (left.suggestedFix?.length ?? 0)
    ? right.suggestedFix
    : left.suggestedFix;

  return {
    ...left,
    severity: higherSeverity,
    description: moreSpecificDescription,
    evidence: right.evidence?.length ?? 0 > (left.evidence?.length ?? 0) ? right.evidence : left.evidence,
    suggestedFix,
    sourceAgents: mergeSourceAgents([...left.sourceAgents, ...right.sourceAgents]),
    confidence: confidenceRank(right.confidence) > confidenceRank(left.confidence) ? right.confidence : left.confidence
  };
}

function buildExactKey(finding: Finding): string {
  return [
    normalizeFilePath(finding.targetFile),
    finding.lineStart ?? "",
    normalizeText(finding.category),
    normalizeText(finding.title)
  ].join(":");
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  const union = new Set([...leftTokens, ...rightTokens]);
  if (union.size === 0) {
    return 1;
  }

  const intersectionSize = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersectionSize / union.size;
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function confidenceRank(confidence: Finding["confidence"]): number {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}
