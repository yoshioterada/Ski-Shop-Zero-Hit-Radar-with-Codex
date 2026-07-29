import type { AdjudicationResult, AgentReviewResult, Conflict, Finding } from "../agents/agent-types.js";
import type { IntegratedReviewReport } from "./report-types.js";

export function generateMarkdownReport(report: IntegratedReviewReport): string {
  return [
    "# Source Code Review Integrated Report",
    "",
    "## Verdict",
    `- Target: ${escapeMarkdown(report.target.rawTarget)}`,
    `- Verdict: ${report.verdict}`,
    `- Review Date: ${report.reviewDate}`,
    `- Project: ${escapeMarkdown(report.target.repoRoot)}`,
    `- Agents: ${report.agents.map(escapeMarkdown).join(", ")}`,
    "",
    "## Findings Summary",
    "| Agent | Thread ID | Status | Verdict | Critical | High | Medium | Low | Score |",
    "|---|---|---|---|---:|---:|---:|---:|---:|",
    ...report.results.map((result) => findingsSummaryRow(result)),
    "",
    "## Verdict Rationale",
    verdictRationale(report),
    "",
    "## Critical/High Findings List",
    "| # | Severity | Source Agent | Category | Target File | Line | Finding | Suggested Fix |",
    "|---:|---|---|---|---|---|---|---|",
    ...criticalHighFindings(report.findings).map((finding, index) => criticalHighFindingRow(finding, index)),
    emptyTableRow(criticalHighFindings(report.findings).length, 8),
    "",
    "## All Findings",
    "| # | Severity | Source Agent | Category | Target File | Line | Finding |",
    "|---:|---|---|---|---|---|---|",
    ...report.findings.map((finding, index) => findingRow(finding, index)),
    emptyTableRow(report.findings.length, 7),
    "",
    "## Escalation Items",
    "| # | Priority | Source Agent | Description | Recommended Decision Maker |",
    "|---:|---|---|---|---|",
    ...report.escalations.map((escalation, index) =>
      [
        index + 1,
        escapeMarkdown(escalation.priority),
        escapeMarkdown(escalation.sourceAgents.join(", ")),
        escapeMarkdown(escalation.description),
        escapeMarkdown(escalation.recommendedDecisionMaker)
      ].join(" | ")
    ).map((row) => `| ${row} |`),
    emptyTableRow(report.escalations.length, 5),
    "",
    "## Conflict Resolution Record",
    "| # | Agent A | Agent B | Conflict Description | Tech-Lead Adjudication | Rationale |",
    "|---:|---|---|---|---|---|",
    ...report.conflicts.map((conflict, index) => conflictRow(conflict, report.adjudications, index)),
    emptyTableRow(report.conflicts.length, 6),
    "",
    "## Design Document Cross-Reference Results",
    ...designReferenceLines(report.results),
    "",
    "## Incomplete Reviews",
    ...incompleteReviewLines(report.results),
    "",
    "## Codex SDK Execution Summary",
    "| Agent | Thread ID | Duration | Input Tokens | Cached Input Tokens | Output Tokens | Reasoning Tokens |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...report.results.map((result) => sdkSummaryRow(result)),
    emptyTableRow(report.results.length, 7),
    "",
    "## Individual Agent Detail Reports",
    ...report.results.flatMap((result) => individualAgentLines(result)),
    ""
  ].join("\n");
}

function findingsSummaryRow(result: AgentReviewResult): string {
  const counts = countBySeverity(result.findings);
  return [
    result.agentId,
    result.threadId ?? "",
    result.status,
    result.verdict,
    counts.Critical,
    counts.High,
    counts.Medium,
    counts.Low,
    result.score ?? ""
  ].map((value) => escapeMarkdown(String(value))).join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function verdictRationale(report: IntegratedReviewReport): string {
  if (report.verdict === "Rejected") {
    return "Critical findings were detected and require remediation before approval.";
  }
  if (report.verdict === "Conditional Approval") {
    return "High severity findings or incomplete reviews require follow-up before unconditional approval.";
  }
  if (report.verdict === "Approved with Notes") {
    return "Only Medium or Low severity findings were detected.";
  }
  return "No findings were reported by completed agent reviews.";
}

function criticalHighFindings(findings: readonly Finding[]): Finding[] {
  return findings.filter((finding) => finding.severity === "Critical" || finding.severity === "High");
}

function criticalHighFindingRow(finding: Finding, index: number): string {
  return [
    index + 1,
    finding.severity,
    finding.sourceAgents.join(", "),
    finding.category,
    finding.targetFile,
    formatLine(finding),
    finding.title,
    finding.suggestedFix ?? ""
  ].map((value) => escapeMarkdown(String(value))).join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function findingRow(finding: Finding, index: number): string {
  return [
    index + 1,
    finding.severity,
    finding.sourceAgents.join(", "),
    finding.category,
    finding.targetFile,
    formatLine(finding),
    finding.title
  ].map((value) => escapeMarkdown(String(value))).join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function conflictRow(conflict: Conflict, adjudications: readonly AdjudicationResult[], index: number): string {
  const adjudication = adjudications.find((item) => item.conflictId === conflict.id);
  return [
    index + 1,
    conflict.agentA,
    conflict.agentB,
    conflict.description,
    adjudication?.recommendedAction ?? "",
    adjudication?.rationale ?? ""
  ].map((value) => escapeMarkdown(String(value))).join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function designReferenceLines(results: readonly AgentReviewResult[]): string[] {
  const deviations = results.flatMap((result) => result.designDeviations.map((deviation) => ({ result, deviation })));
  if (deviations.length === 0) {
    return ["No design document deviations were reported."];
  }

  return deviations.map(({ result, deviation }, index) =>
    `${index + 1}. ${escapeMarkdown(result.agentId)}: ${escapeMarkdown(deviation.document)} - ${escapeMarkdown(deviation.description)} (${escapeMarkdown(deviation.targetFile)})`
  );
}

function incompleteReviewLines(results: readonly AgentReviewResult[]): string[] {
  const incomplete = results.filter((result) => result.status !== "completed" || result.verdict === "incomplete");
  if (incomplete.length === 0) {
    return ["No incomplete reviews."];
  }

  return incomplete.map((result, index) =>
    `${index + 1}. ${escapeMarkdown(result.agentId)} - ${escapeMarkdown(result.status)} - ${escapeMarkdown(result.errorMessage ?? result.summary)}`
  );
}

function sdkSummaryRow(result: AgentReviewResult): string {
  return [
    result.agentId,
    result.threadId ?? "",
    result.durationMs ?? "",
    result.usage?.inputTokens ?? "",
    result.usage?.cachedInputTokens ?? "",
    result.usage?.outputTokens ?? "",
    result.usage?.reasoningOutputTokens ?? ""
  ].map((value) => escapeMarkdown(String(value))).join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function individualAgentLines(result: AgentReviewResult): string[] {
  return [
    `### ${escapeMarkdown(result.agentId)}`,
    "",
    `- Status: ${escapeMarkdown(result.status)}`,
    `- Verdict: ${escapeMarkdown(result.verdict)}`,
    `- Summary: ${escapeMarkdown(result.summary)}`,
    "",
    result.rawMarkdown ?? "(no detail report)",
    ""
  ];
}

function countBySeverity(findings: readonly Finding[]): Record<Finding["severity"], number> {
  return {
    Critical: findings.filter((finding) => finding.severity === "Critical").length,
    High: findings.filter((finding) => finding.severity === "High").length,
    Medium: findings.filter((finding) => finding.severity === "Medium").length,
    Low: findings.filter((finding) => finding.severity === "Low").length
  };
}

function formatLine(finding: Finding): string {
  if (finding.lineStart === undefined) {
    return "";
  }
  return finding.lineEnd === undefined ? String(finding.lineStart) : `${finding.lineStart}-${finding.lineEnd}`;
}

function emptyTableRow(itemCount: number, columnCount: number): string {
  return itemCount === 0 ? `| ${Array.from({ length: columnCount }, () => "").join(" | ")} |` : "";
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
