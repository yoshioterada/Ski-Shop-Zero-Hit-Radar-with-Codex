import type { AgentReviewResult, Finding, IntegratedVerdict } from "../agents/agent-types.js";

export function calculateIntegratedVerdict(input: {
  findings: readonly Finding[];
  results: readonly AgentReviewResult[];
}): IntegratedVerdict {
  if (input.findings.some((finding) => finding.severity === "Critical")) {
    return "Rejected";
  }

  if (input.results.some((result) => result.verdict === "incomplete" || result.status !== "completed")) {
    return "Conditional Approval";
  }

  if (input.findings.some((finding) => finding.severity === "High")) {
    return "Conditional Approval";
  }

  if (input.findings.length > 0) {
    return "Approved with Notes";
  }

  return "Approved";
}

export function calculateExitCode(input: {
  failOn: "critical" | "high" | "none";
  findings: readonly Finding[];
  results: readonly AgentReviewResult[];
}): number {
  const completedJobs = input.results.filter((result) => result.status === "completed").length;
  if (input.results.length > 0 && completedJobs === 0) {
    return 4;
  }

  if (input.failOn === "none") {
    return 0;
  }

  if (input.failOn === "critical") {
    return input.findings.some((finding) => finding.severity === "Critical") ? 1 : 0;
  }

  return input.findings.some((finding) => finding.severity === "Critical" || finding.severity === "High")
    ? 1
    : 0;
}
