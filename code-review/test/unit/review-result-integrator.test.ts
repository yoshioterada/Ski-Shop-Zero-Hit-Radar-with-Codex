import { describe, expect, it } from "vitest";

import type { AgentReviewResult, Finding } from "../../src/agents/agent-types.js";
import { integrateReviewResults } from "../../src/results/review-result-integrator.js";
import { applyAdjudicationOutcome } from "../../src/results/review-result-integrator.js";

describe("review result integrator", () => {
  it("normalizes, deduplicates, detects conflicts, calculates verdict, and exit code", () => {
    const outcome = integrateReviewResults({
      failOn: "high",
      results: [
        result("security", [
          finding({
            id: "",
            severity: "High",
            sourceAgents: [],
            title: "Add strict request limit",
            description: "Add strict throttling to the endpoint."
          })
        ]),
        result("performance", [
          finding({
            id: "",
            severity: "Medium",
            sourceAgents: [],
            title: "Relax request limit",
            description: "Relax throttling because it increases latency."
          })
        ]),
        result("api-endpoint", [
          finding({
            id: "",
            severity: "High",
            sourceAgents: [],
            title: "Add strict request limit",
            description: "Add strict throttling to the endpoint."
          })
        ])
      ]
    });

    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[0]?.sourceAgents).toEqual(["api-endpoint", "security"]);
    expect(outcome.conflicts).toHaveLength(1);
    expect(outcome.verdict).toBe("Conditional Approval");
    expect(outcome.exitCode).toBe(1);
  });

  it("adds adjudication result and escalation records to the report model outcome", () => {
    const outcome = integrateReviewResults({
      failOn: "none",
      results: [result("security", [])]
    });

    const updated = applyAdjudicationOutcome(outcome, {
      status: "completed",
      summary: "Resolved.",
      adjudications: [
        {
          conflictId: "conflict-1",
          decision: "prefer_a",
          finalSeverity: "High",
          finalFindingTitle: "Prefer security",
          rationale: "Security wins.",
          recommendedAction: "Apply security fix."
        }
      ],
      escalations: []
    });

    expect(updated.adjudications).toHaveLength(1);
    expect(updated.escalations).toEqual([]);
  });
});

function result(agentId: string, findings: Finding[]): AgentReviewResult {
  return {
    agentId,
    status: "completed",
    verdict: "warning",
    summary: "summary",
    findings,
    escalations: [],
    designDeviations: [],
    startedAt: "2026-01-01T00:00:00.000Z"
  };
}

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "finding-id",
    severity: "Medium",
    category: "review",
    title: "title",
    description: "description",
    targetFile: "src/main/java/App.java",
    lineStart: 42,
    sourceAgents: ["security"],
    confidence: "high",
    ...overrides
  };
}
