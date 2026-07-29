import crypto from "node:crypto";

import type { AgentReviewResult, EscalationItem, Finding } from "../agents/agent-types.js";
import { toPosixPath } from "../utils/path-utils.js";

export function normalizeAgentResult(result: AgentReviewResult): AgentReviewResult {
  return {
    ...result,
    findings: result.findings.map((finding, index) => normalizeFinding(result.agentId, finding, index)),
    escalations: result.escalations.map((escalation) => normalizeEscalation(result.agentId, escalation))
  };
}

export function normalizeAgentResults(results: readonly AgentReviewResult[]): AgentReviewResult[] {
  return results.map((result) => normalizeAgentResult(result));
}

export function normalizeFinding(agentId: string, finding: Finding, index = 0): Finding {
  const sourceAgents = mergeSourceAgents([...(finding.sourceAgents ?? []), agentId]);
  const normalizedFinding = {
    ...finding,
    targetFile: normalizeFilePath(finding.targetFile),
    sourceAgents
  };

  return {
    ...normalizedFinding,
    id: finding.id && finding.id.length > 0 ? finding.id : buildFindingId(agentId, normalizedFinding, index)
  };
}

export function normalizeEscalation(agentId: string, escalation: EscalationItem): EscalationItem {
  return {
    ...escalation,
    sourceAgents: mergeSourceAgents([...(escalation.sourceAgents ?? []), agentId])
  };
}

export function buildFindingId(agentId: string, finding: Omit<Finding, "id">, index = 0): string {
  const hash = crypto
    .createHash("sha256")
    .update(
      [
        agentId,
        normalizeFilePath(finding.targetFile),
        finding.lineStart ?? "",
        normalizeText(finding.category),
        normalizeText(finding.title),
        normalizeText(finding.description),
        index
      ].join("|")
    )
    .digest("hex")
    .slice(0, 12);

  return `finding-${hash}`;
}

export function normalizeFilePath(filePath: string): string {
  return toPosixPath(filePath).replace(/^\.\//, "");
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function mergeSourceAgents(sourceAgents: readonly string[]): string[] {
  return [...new Set(sourceAgents.filter((agent) => agent.length > 0))].sort();
}
