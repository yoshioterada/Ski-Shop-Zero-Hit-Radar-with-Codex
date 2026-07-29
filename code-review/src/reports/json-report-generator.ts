import type { BuildReportInput, IntegratedReviewReport } from "./report-types.js";

export function generateJsonReport(input: BuildReportInput): IntegratedReviewReport {
  return {
    target: input.target,
    verdict: input.verdict,
    reviewDate: (input.reviewDate ?? new Date()).toISOString(),
    agents: input.agents,
    results: input.results,
    findings: input.findings,
    conflicts: input.conflicts,
    adjudications: input.adjudications,
    escalations: input.escalations,
    sdkExecution: input.sdkExecution,
    outputFiles: input.outputFiles ?? {}
  };
}
