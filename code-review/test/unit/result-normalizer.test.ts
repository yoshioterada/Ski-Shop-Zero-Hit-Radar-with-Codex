import { describe, expect, it } from "vitest";

import type { AgentReviewResult, Finding } from "../../src/agents/agent-types.js";
import { normalizeAgentResult } from "../../src/results/result-normalizer.js";

describe("result normalizer", () => {
  it("adds stable finding ids and sourceAgents", () => {
    const result = normalizeAgentResult(agentResult("security", [finding({ id: "", sourceAgents: [] })]));

    expect(result.findings[0]?.id).toMatch(/^finding-[a-f0-9]{12}$/);
    expect(result.findings[0]?.sourceAgents).toEqual(["security"]);
    expect(result.escalations[0]?.sourceAgents).toEqual(["security"]);
  });

  it("preserves existing finding ids while merging sourceAgents", () => {
    const result = normalizeAgentResult(
      agentResult("performance", [finding({ id: "existing-id", sourceAgents: ["security"] })])
    );

    expect(result.findings[0]?.id).toBe("existing-id");
    expect(result.findings[0]?.sourceAgents).toEqual(["performance", "security"]);
  });
});

function agentResult(agentId: string, findings: Finding[]): AgentReviewResult {
  return {
    agentId,
    status: "completed",
    verdict: "warning",
    summary: "summary",
    findings,
    escalations: [
      {
        priority: "high",
        sourceAgents: [],
        description: "Escalate",
        recommendedDecisionMaker: "Tech Lead"
      }
    ],
    designDeviations: [],
    startedAt: "2026-01-01T00:00:00.000Z"
  };
}

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "finding-id",
    severity: "Medium",
    category: "security",
    title: "Missing authorization",
    description: "Endpoint lacks an authorization guard.",
    targetFile: "./src/main/java/App.java",
    lineStart: 10,
    sourceAgents: ["security"],
    confidence: "high",
    ...overrides
  };
}
