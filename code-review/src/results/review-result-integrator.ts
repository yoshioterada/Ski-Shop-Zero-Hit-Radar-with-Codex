import type {
  AdjudicationExecutionResult,
  AdjudicationResult,
  AgentReviewResult,
  Conflict,
  EscalationItem,
  Finding,
  IntegratedVerdict
} from "../agents/agent-types.js";

import { detectConflicts } from "./conflict-detector.js";
import { deduplicateFindings } from "./finding-deduplicator.js";
import { normalizeAgentResults } from "./result-normalizer.js";
import { calculateExitCode, calculateIntegratedVerdict } from "./verdict-calculator.js";

export interface IntegratedReviewOutcome {
  results: AgentReviewResult[];
  findings: Finding[];
  conflicts: Conflict[];
  adjudications: AdjudicationResult[];
  escalations: EscalationItem[];
  verdict: IntegratedVerdict;
  exitCode: number;
}

/** Normalizes agent outputs, deduplicates findings, detects conflicts, and calculates exit code. */
export function integrateReviewResults(input: {
  results: readonly AgentReviewResult[];
  failOn: "critical" | "high" | "none";
}): IntegratedReviewOutcome {
  const results = normalizeAgentResults(input.results);
  const findings = deduplicateFindings(results.flatMap((result) => result.findings));
  const conflicts = detectConflicts(findings);
  const verdict = calculateIntegratedVerdict({ findings, results });
  const exitCode = calculateExitCode({ failOn: input.failOn, findings, results });

  return {
    results,
    findings,
    conflicts,
    adjudications: [],
    escalations: results.flatMap((result) => result.escalations),
    verdict,
    exitCode
  };
}

/** Adds Tech Lead adjudication output to the integrated report model. */
export function applyAdjudicationOutcome(
  outcome: IntegratedReviewOutcome,
  adjudication: AdjudicationExecutionResult
): IntegratedReviewOutcome {
  return {
    ...outcome,
    adjudications: adjudication.adjudications,
    escalations: [...outcome.escalations, ...adjudication.escalations]
  };
}
