import { describe, expect, it } from "vitest";

import type { Finding } from "../../src/agents/agent-types.js";
import { detectConflicts } from "../../src/results/conflict-detector.js";

describe("conflict detector", () => {
  it("detects defined conflict patterns", () => {
    const conflicts = detectConflicts([
      finding({
        id: "security",
        sourceAgents: ["security"],
        title: "Add strict request limit",
        description: "Add strict throttling to the endpoint."
      }),
      finding({
        id: "performance",
        sourceAgents: ["performance"],
        title: "Relax request limit",
        description: "Relax throttling because it increases latency."
      })
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      agentA: "security",
      agentB: "performance",
      pattern: "restrictions_vs_relaxation",
      initialResolutionRule: "原則 security 優先"
    });
  });

  it("candidate-detects undefined conflicts on the same file and line", () => {
    const conflicts = detectConflicts([
      finding({
        id: "api",
        sourceAgents: ["api-endpoint"],
        title: "Add cache",
        description: "Add cache for this response."
      }),
      finding({
        id: "dependency",
        sourceAgents: ["dependency"],
        title: "No cache",
        description: "Use no cache because dependency state changes frequently."
      })
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      agentA: "api-endpoint",
      agentB: "dependency",
      pattern: "undefined_opposing_recommendation"
    });
  });
});

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
