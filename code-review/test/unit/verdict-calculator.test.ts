import { describe, expect, it } from "vitest";

import type { AgentReviewResult, Finding } from "../../src/agents/agent-types.js";
import { calculateExitCode, calculateIntegratedVerdict } from "../../src/results/verdict-calculator.js";

describe("verdict calculator", () => {
  it("returns Rejected when Critical exists", () => {
    expect(calculateIntegratedVerdict({ findings: [finding("Critical")], results: [result()] })).toBe("Rejected");
  });

  it("returns Conditional Approval when any review is incomplete", () => {
    expect(
      calculateIntegratedVerdict({
        findings: [],
        results: [result({ status: "error", verdict: "incomplete" })]
      })
    ).toBe("Conditional Approval");
  });

  it("returns Conditional Approval for High findings", () => {
    expect(calculateIntegratedVerdict({ findings: [finding("High")], results: [result()] })).toBe(
      "Conditional Approval"
    );
  });

  it("returns Approved with Notes for Medium/Low findings", () => {
    expect(calculateIntegratedVerdict({ findings: [finding("Medium"), finding("Low")], results: [result()] })).toBe(
      "Approved with Notes"
    );
  });

  it("returns Approved when there are no findings", () => {
    expect(calculateIntegratedVerdict({ findings: [], results: [result()] })).toBe("Approved");
  });

  it("calculates fail-on exit codes", () => {
    expect(calculateExitCode({ failOn: "critical", findings: [finding("Critical")], results: [result()] })).toBe(1);
    expect(calculateExitCode({ failOn: "critical", findings: [finding("High")], results: [result()] })).toBe(0);
    expect(calculateExitCode({ failOn: "high", findings: [finding("High")], results: [result()] })).toBe(1);
    expect(calculateExitCode({ failOn: "high", findings: [finding("Medium")], results: [result()] })).toBe(0);
    expect(calculateExitCode({ failOn: "none", findings: [finding("Critical")], results: [result()] })).toBe(0);
  });

  it("returns exit code 4 when all jobs fail", () => {
    expect(
      calculateExitCode({
        failOn: "none",
        findings: [],
        results: [result({ status: "error", verdict: "incomplete" })]
      })
    ).toBe(4);
  });
});

function finding(severity: Finding["severity"]): Finding {
  return {
    id: `finding-${severity}`,
    severity,
    category: "category",
    title: "title",
    description: "description",
    targetFile: "src/main/java/App.java",
    sourceAgents: ["security"],
    confidence: "high"
  };
}

function result(overrides: Partial<AgentReviewResult> = {}): AgentReviewResult {
  return {
    agentId: "security",
    status: "completed",
    verdict: "pass",
    summary: "summary",
    findings: [],
    escalations: [],
    designDeviations: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}
