import { describe, expect, it } from "vitest";

import type { Finding } from "../../src/agents/agent-types.js";
import { deduplicateFindings } from "../../src/results/finding-deduplicator.js";

describe("finding deduplicator", () => {
  it("deduplicates exact finding keys", () => {
    const findings = deduplicateFindings([
      finding({ severity: "Medium", sourceAgents: ["security"], description: "Short." }),
      finding({
        id: "other",
        severity: "High",
        sourceAgents: ["architecture"],
        description: "Longer and more specific duplicate description."
      })
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "High",
      sourceAgents: ["architecture", "security"],
      description: "Longer and more specific duplicate description."
    });
  });

  it("deduplicates highly similar findings without lineStart", () => {
    const findings = deduplicateFindings([
      finding({
        id: "one",
        lineStart: undefined,
        description: "Endpoint is missing authorization check for admin operation.",
        sourceAgents: ["security"]
      }),
      finding({
        id: "two",
        lineStart: undefined,
        description: "Endpoint is missing authorization check for admin operation.",
        sourceAgents: ["api-endpoint"]
      })
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.sourceAgents).toEqual(["api-endpoint", "security"]);
  });
});

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "finding-id",
    severity: "Medium",
    category: "security",
    title: "Missing authorization",
    description: "Endpoint lacks an authorization guard.",
    targetFile: "src/main/java/App.java",
    lineStart: 10,
    sourceAgents: ["security"],
    confidence: "high",
    ...overrides
  };
}
