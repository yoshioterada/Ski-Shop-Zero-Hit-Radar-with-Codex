import type { Conflict, Finding } from "../agents/agent-types.js";
import { normalizeFilePath, normalizeText } from "./result-normalizer.js";

export interface ConflictPattern {
  agentA: string;
  agentB: string;
  pattern: string;
  initialResolutionRule: string;
}

export const DEFINED_CONFLICT_PATTERNS: readonly ConflictPattern[] = [
  {
    agentA: "architecture",
    agentB: "java-standards",
    pattern: "abstraction_vs_kiss",
    initialResolutionRule: "設計意図を参照しつつ architecture 優先"
  },
  {
    agentA: "security",
    agentB: "performance",
    pattern: "restrictions_vs_relaxation",
    initialResolutionRule: "原則 security 優先"
  },
  {
    agentA: "data-access",
    agentB: "performance",
    pattern: "constraints_vs_denormalization",
    initialResolutionRule: "明確な理由がない限り data-access 優先"
  },
  {
    agentA: "java-standards",
    agentB: "test-quality",
    pattern: "java21_vs_testability",
    initialResolutionRule: "テスタビリティを損なわない範囲で Java 21"
  },
  {
    agentA: "resilience",
    agentB: "performance",
    pattern: "retry_vs_latency",
    initialResolutionRule: "冪等操作のみ retry 許容"
  },
  {
    agentA: "ddd-domain",
    agentB: "data-access",
    pattern: "aggregate_boundary_vs_query_efficiency",
    initialResolutionRule: "DDD 境界優先、効率は別解で対処"
  }
];

const opposingTermPairs = [
  ["add", "remove"],
  ["increase", "decrease"],
  ["strict", "relax"],
  ["introduce", "eliminate"],
  ["split", "merge"],
  ["abstract", "simplify"],
  ["retry", "no retry"],
  ["cache", "no cache"]
] as const;

export function detectConflicts(findings: readonly Finding[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let leftIndex = 0; leftIndex < findings.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < findings.length; rightIndex += 1) {
      const left = findings[leftIndex] as Finding;
      const right = findings[rightIndex] as Finding;
      const conflict = detectConflictPair(left, right, conflicts.length + 1);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  return conflicts;
}

function detectConflictPair(left: Finding, right: Finding, conflictNumber: number): Conflict | null {
  if (!isSameLocationOrArea(left, right)) {
    return null;
  }

  const pair = findDefinedPattern(left.sourceAgents, right.sourceAgents);
  const hasOpposingTerms = containsOpposingTerms(`${left.title} ${left.description}`, `${right.title} ${right.description}`);

  if (pair && hasOpposingTerms) {
    const [agentA, agentB] = orderAgentsForPattern(left, right, pair);
    return {
      id: `conflict-${conflictNumber}`,
      agentA,
      agentB,
      findingA: left,
      findingB: right,
      pattern: pair.pattern,
      description: `Defined conflict pattern detected: ${pair.pattern}`,
      initialResolutionRule: pair.initialResolutionRule
    };
  }

  if (!pair && hasOpposingTerms && isSameExactLine(left, right)) {
    return {
      id: `conflict-${conflictNumber}`,
      agentA: left.sourceAgents[0] ?? "unknown",
      agentB: right.sourceAgents[0] ?? "unknown",
      findingA: left,
      findingB: right,
      pattern: "undefined_opposing_recommendation",
      description: "Undefined conflict candidate detected on the same file and line."
    };
  }

  return null;
}

function findDefinedPattern(leftAgents: readonly string[], rightAgents: readonly string[]): ConflictPattern | undefined {
  return DEFINED_CONFLICT_PATTERNS.find(
    (pattern) =>
      (leftAgents.includes(pattern.agentA) && rightAgents.includes(pattern.agentB)) ||
      (leftAgents.includes(pattern.agentB) && rightAgents.includes(pattern.agentA))
  );
}

function isSameLocationOrArea(left: Finding, right: Finding): boolean {
  if (normalizeFilePath(left.targetFile) !== normalizeFilePath(right.targetFile)) {
    return false;
  }

  return left.lineStart === undefined || right.lineStart === undefined || left.lineStart === right.lineStart;
}

function isSameExactLine(left: Finding, right: Finding): boolean {
  return normalizeFilePath(left.targetFile) === normalizeFilePath(right.targetFile) && left.lineStart === right.lineStart;
}

function containsOpposingTerms(left: string, right: string): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  return opposingTermPairs.some(([a, b]) => {
    return (
      (containsTerm(normalizedLeft, a) && containsTerm(normalizedRight, b)) ||
      (containsTerm(normalizedLeft, b) && containsTerm(normalizedRight, a))
    );
  });
}

function containsTerm(value: string, term: string): boolean {
  return new RegExp(`(^|\\W)${escapeRegExp(term)}(\\W|$)`).test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function orderAgentsForPattern(left: Finding, right: Finding, pattern: ConflictPattern): [string, string] {
  const leftHasA = left.sourceAgents.includes(pattern.agentA);
  const rightHasA = right.sourceAgents.includes(pattern.agentA);

  if (leftHasA && !rightHasA) {
    return [pattern.agentA, pattern.agentB];
  }
  if (rightHasA) {
    return [pattern.agentA, pattern.agentB];
  }

  return [left.sourceAgents[0] ?? pattern.agentA, right.sourceAgents[0] ?? pattern.agentB];
}
